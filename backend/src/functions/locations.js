const { app } = require('@azure/functions');
const { poolPromise, sql } = require('../../utils/db');

// GET /cities
app.http('getCities', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'cities',
    handler: async (request, context) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query('SELECT CiudadID, Nombre FROM Ciudad');
            
            return {
                status: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                jsonBody: result.recordset
            };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});

// GET /stores/:cityId
app.http('getStoresByCity', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'stores/{cityId}',
    handler: async (request, context) => {
        const cityId = request.params.cityId;
        
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('cityId', sql.Int, cityId)
                .query('SELECT TiendaID, Nombre, TelefonoWhatsApp FROM Tienda WHERE CiudadID = @cityId');
            
            return {
                status: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                jsonBody: result.recordset
            };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});

