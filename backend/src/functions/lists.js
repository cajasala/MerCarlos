const { app } = require('@azure/functions');
const { poolPromise, sql } = require('../../utils/db');
const { authenticate } = require('../../utils/auth');

// GET /lists
app.http('getLists', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'lists',
    handler: async (request, context) => {
        const user = authenticate(request);
        if (!user) return { status: 401, body: 'Unauthorized' };

        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('clienteId', sql.Int, user.id)
                .query('SELECT * FROM ListaCompra WHERE ClienteID = @clienteId ORDER BY CreatedAt DESC');

            return { status: 200, jsonBody: result.recordset };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});

// POST /lists
app.http('createList', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'lists',
    handler: async (request, context) => {
        const user = authenticate(request);
        if (!user) return { status: 401, body: 'Unauthorized' };

        try {
            const { nombre } = await request.json();
            const pool = await poolPromise;
            const result = await pool.request()
                .input('clienteId', sql.Int, user.id)
                .input('nombre', sql.NVarChar, nombre)
                .query('INSERT INTO ListaCompra (ClienteID, Nombre) OUTPUT INSERTED.* VALUES (@clienteId, @nombre)');

            return { status: 201, jsonBody: result.recordset[0] };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});

// DELETE /lists/{id}
app.http('deleteList', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'lists/{id}',
    handler: async (request, context) => {
        const user = authenticate(request);
        if (!user) return { status: 401, body: 'Unauthorized' };

        try {
            const id = request.params.id;
            const pool = await poolPromise;
            await pool.request()
                .input('id', sql.Int, id)
                .input('clienteId', sql.Int, user.id)
                .query('DELETE FROM ListaCompra WHERE ListaID = @id AND ClienteID = @clienteId');

            return { status: 204 };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});
