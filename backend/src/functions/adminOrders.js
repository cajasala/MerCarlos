const { app } = require('@azure/functions');
const { poolPromise, sql } = require('../../utils/db');
const { requireAdmin } = require('../../utils/adminAuth');

// ╔═══════════════════════════════════════════════════════════╗
// ║  POST /api/admin/orders/{orderId}/status                    ║
// ║  Roles: ADM (sin restricción), PED (transición permitida)   ║
// ╚═══════════════════════════════════════════════════════════╝
app.http('updateOrderStatus', {
     methods: ['POST'],
     authLevel: 'anonymous',
     route: 'api/admin/orders/{orderId}/status',
    handler: async (request, context) => {
        const { orderId } = request.params;
        const { statusName } = await request.json().catch(() => ({}));

        const auth = await requireAdmin(request, ['ADM', 'PED']);
        if (!auth.authorized)      return { status: auth.status, body: auth.body };
        if (!statusName || typeof statusName !== 'string')
            return { status: 400, body: 'statusName is required' };

        const pool = await poolPromise;

        try {
            // 1. Resolve StatusID from name
            const statusResult = await pool.request()
                .input('nombre', sql.NVarChar, statusName)
                .query('SELECT StatusID FROM StatusOrden WHERE Nombre = @nombre');

            if (statusResult.recordset.length === 0) {
                return { status: 422, body: `Status "${statusName}" not found` };
            }
            const targetStatusId = statusResult.recordset[0].StatusID;

            // 2. Get order — negocio-scoped
            const orderResult = await pool.request()
                .input('orderId', sql.Int, orderId)
                .input('negocioId', sql.Int, auth.negocioId)
                .query(`
                    SELECT o.OrdenID, o.ClienteID, o.TiendaID, o.Total,
                           o.StatusID, s.Nombre AS StatusNombre
                    FROM Orden o
                    JOIN StatusOrden s ON o.StatusID = s.StatusID
                    JOIN Tienda t      ON o.TiendaID = t.TiendaID
                    WHERE o.OrdenID = @orderId AND t.NegocioID = @negocioId
                `);

            if (orderResult.recordset.length === 0) {
                return { status: 404, body: 'Order not found' };
            }

            const order       = orderResult.recordset[0];
            const currentName = order.StatusNombre;

            // 3. Validate transition — ADM always allowed; PED checks TransicionEstado
            if (auth.role === 'PED' && statusName !== 'Cancelado') {
                const transResult = await pool.request()
                    .input('origen',  sql.NVarChar, currentName)
                    .input('destino', sql.NVarChar, statusName)
                    .query(`
                        SELECT RolesPermitidos
                        FROM TransicionEstado
                        WHERE EstadoOrigen = @origen AND EstadoDestino = @destino
                    `);

                if (transResult.recordset.length === 0) {
                    return {
                        status: 422,
                        body: `Invalid transition "${currentName}" → "${statusName}" for PED`
                    };
                }

                let allowedRoles;
                try {
                    allowedRoles = JSON.parse(transResult.recordset[0].RolesPermitidos);
                } catch {
                    allowedRoles = [transResult.recordset[0].RolesPermitidos];
                }

                if (!allowedRoles.includes(auth.role)) {
                    return {
                        status: 422,
                        body: `Role ${auth.role} cannot transition "${currentName}" → "${statusName}"`
                    };
                }
            }

            // 4. Update
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .input('statusId', sql.Int, targetStatusId)
                .query('UPDATE Orden SET StatusID = @statusId WHERE OrdenID = @orderId');

            // 5. Return updated
            const updated = await pool.request()
                .input('orderId', sql.Int, orderId)
                .query(`
                    SELECT o.*, s.Nombre AS StatusNombre
                    FROM Orden o
                    JOIN StatusOrden s ON o.StatusID = s.StatusID
                    WHERE o.OrdenID = @orderId
                `);

            return { status: 200, jsonBody: updated.recordset[0] };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});

// ╔═══════════════════════════════════════════════════════════╗
// ║  GET /api/admin/orders  —  negocio-scoped, status names       ║
// ║  Roles: ADM, PED                                             ║
// ╚═══════════════════════════════════════════════════════════╝
app.http('listAdminOrders', {
     methods: ['GET'], authLevel: 'anonymous', route: 'api/admin/orders',
    handler: async (request, context) => {
        const auth = await requireAdmin(request, ['ADM', 'PED']);
        if (!auth.authorized) return { status: auth.status, body: auth.body };

        try {
            const pool = await poolPromise;
            const statusFilter = request.query.get('statusName');

            let query = `
                SELECT o.OrdenID, o.ClienteID, o.TiendaID, o.Total, o.CreatedAt,
                        o.StatusID, s.Nombre AS StatusNombre, t.Nombre AS TiendaNombre
                FROM Orden o
                JOIN StatusOrden s ON o.StatusID = s.StatusID
                JOIN Tienda t    ON o.TiendaID = t.TiendaID
                WHERE t.NegocioID = @negocioId
            `;
            if (statusFilter)   query += ' AND s.Nombre = @statusNombre';
            query += ' ORDER BY o.CreatedAt DESC';

            const req = pool.request().input('negocioId', sql.Int, auth.negocioId);
            if (statusFilter)   req.input('statusNombre', sql.NVarChar, statusFilter);
            const result = await req.query(query);
            return { status: 200, jsonBody: result.recordset };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});
