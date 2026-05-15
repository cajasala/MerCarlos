const { app } = require('@azure/functions');
const { poolPromise, sql } = require('../utils/db');
const { authenticate } = require('../utils/auth');

// GET /orders
app.http('getOrders', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'orders',
    handler: async (request, context) => {
        const user = authenticate(request);
        if (!user) return { status: 401, body: 'Unauthorized' };

        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('clienteId', sql.Int, user.id)
                .query(`
                    SELECT o.*, s.Nombre as StatusNombre 
                    FROM Orden o 
                    JOIN StatusOrden s ON o.StatusID = s.StatusID 
                    WHERE o.ClienteID = @clienteId 
                    ORDER BY o.FechaOrden DESC
                `);

            return { status: 200, jsonBody: result.recordset };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});

// POST /orders (Checkout)
app.http('createOrder', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'orders',
    handler: async (request, context) => {
        const user = authenticate(request);
        if (!user) return { status: 401, body: 'Unauthorized' };

        try {
            const { tiendaId, items, total } = await request.json();
            const pool = await poolPromise;
            const transaction = new sql.Transaction(pool);
            
            await transaction.begin();
            try {
                // 1. Create Order
                const orderResult = await transaction.request()
                    .input('clienteId', sql.Int, user.id)
                    .input('tiendaId', sql.Int, tiendaId)
                    .input('total', sql.Decimal(18, 2), total)
                    .query('INSERT INTO Orden (ClienteID, TiendaID, Total, StatusID) OUTPUT INSERTED.OrdenID VALUES (@clienteId, @tiendaId, @total, 1)'); // 1: Recibido
                
                const orderId = orderResult.recordset[0].OrdenID;

                // 2. Add Detail items
                for (const item of items) {
                    await transaction.request()
                        .input('ordenId', sql.Int, orderId)
                        .input('productoId', sql.Int, item.ProductoID)
                        .input('cantidad', sql.Int, item.quantity)
                        .input('precio', sql.Decimal(18, 2), item.EsPromocion ? item.PrecioPromocion : item.PrecioRegular)
                        .query('INSERT INTO DetalleOrden (OrdenID, ProductoID, Cantidad, PrecioUnitario) VALUES (@ordenId, @productoId, @cantidad, @precio)');
                }

                await transaction.commit();
                return { status: 201, jsonBody: { ordenId } };
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});
