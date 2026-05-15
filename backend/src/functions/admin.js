const { app } = require('@azure/functions');
const { poolPromise, sql } = require('../../utils/db');
const { generateToken } = require('../../utils/auth');
const csv = require('csv-parser');
const { Readable } = require('stream');

// POST /admin/login
app.http('mngLogin', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'mng/login',
    handler: async (request, context) => {
        try {
            const { username, password } = await request.json();
            
            const pool = await poolPromise;
            const result = await pool.request()
                .input('username', sql.NVarChar, username)
                .input('password', sql.NVarChar, password) // Note: Should be hashed in production
                .query('SELECT * FROM Administrador WHERE Username = @username AND Password = @password');

            if (result.recordset.length === 0) {
                return { status: 401, body: 'Invalid credentials' };
            }

            const admin = result.recordset[0];
            const token = generateToken({ id: admin.AdminID, role: 'admin' });

            return { 
                status: 200, 
                jsonBody: { 
                    token, 
                    admin: { id: admin.AdminID, username: admin.Username } 
                } 
            };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});

// POST /admin/upload-csv
app.http('mngUploadCSV', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'mng/upload-csv',
    handler: async (request, context) => {
        try {
            // Check auth (simplified for demo)
            const formData = await request.formData();
            const file = formData.get('file');
            const tiendaId = formData.get('tiendaId');

            if (!file || !tiendaId) return { status: 400, body: 'File and Store ID required' };

            const buffer = Buffer.from(await file.arrayBuffer());
            const results = [];
            
            const stream = Readable.from(buffer);
            await new Promise((resolve, reject) => {
                stream.pipe(csv())
                    .on('data', (data) => results.push(data))
                    .on('end', resolve)
                    .on('error', reject);
            });

            const pool = await poolPromise;
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                for (const row of results) {
                    // row expected format: SKU, PrecioRegular, PrecioPromocion, EsPromocion
                    await transaction.request()
                        .input('tiendaId', sql.Int, tiendaId)
                        .input('sku', sql.NVarChar, row.SKU)
                        .input('precioRegular', sql.Decimal(18, 2), row.PrecioRegular)
                        .input('precioPromocion', sql.Decimal(18, 2), row.PrecioPromocion || null)
                        .input('esPromocion', sql.Bit, row.EsPromocion === '1' ? 1 : 0)
                        .query(`
                            UPDATE pt
                            SET pt.PrecioRegular = @precioRegular,
                                pt.PrecioPromocion = @precioPromocion,
                                pt.EsPromocion = @esPromocion
                            FROM ProductoTienda pt
                            JOIN ProductoMaestro pm ON pt.ProductoID = pm.ProductoID
                            WHERE pt.TiendaID = @tiendaId AND pm.SKU = @sku
                        `);
                }
                await transaction.commit();
                return { status: 200, jsonBody: { message: `Updated ${results.length} products` } };
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
