const { app } = require('@azure/functions');
const { poolPromise, sql } = require('../../utils/db');
const { requireAdmin } = require('../../utils/adminAuth');
const csv = require('csv-parser');
const { Readable } = require('stream');

// POST /api/admin/upload-products-csv
// CSV columns req: SKU, Nombre, UnidadMedidaBase, CantidadUnidadBase, CategoriaID
// CSV cols opc: Descripcion, SubCategoriaID, PrecioRegular, PrecioPromocion, EsPromocion, Stock
// Roles: ADM, PED, EDI
app.http('uploadProductsCSV', {
     methods: ['POST'],
     authLevel: 'anonymous',
     route: 'api/admin/upload-products-csv',
    handler: async (request, context) => {
        try {
            const auth = await requireAdmin(request, ['ADM', 'PED', 'EDI']);
            if (!auth.authorized) {
                return { status: auth.status, body: auth.body };
            }

            const formData = await request.formData();
            const file = formData.get('file');
            if (!file) {
                return { status: 400, body: 'File is required' };
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const rows = [];

            const stream = Readable.from(buffer);
            await new Promise((resolve, reject) => {
                stream.pipe(csv())
                    .on('data', data => rows.push(data))
                    .on('end', resolve)
                    .on('error', reject);
            });

            const requiredColumns = ['SKU', 'Nombre', 'UnidadMedidaBase', 'CantidadUnidadBase', 'CategoriaID'];
            if (rows.length > 0) {
                const missing = requiredColumns.filter(c => !(c in rows[0]));
                if (missing.length > 0) {
                    return { status: 400, body: `Missing required columns: ${missing.join(', ')}` };
                }
            }

            const pool = await poolPromise;
            const errors = [];
            const upserted = [];
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    const rowNum = i + 1;

                    try {
                        // FK validation — CategoriaID
                        const catCheck = await transaction.request()
                            .input('catId', sql.Int, parseInt(row.CategoriaID, 10))
                            .query('SELECT 1 AS ok FROM Categoria WHERE CategoriaID = @catId');
                        if (catCheck.recordset.length === 0) {
                            errors.push({ row: rowNum, error: `CategoriaID ${row.CategoriaID} not found`, sku: row.SKU });
                            continue;
                        }

                        // FK validation — SubCategoriaID (optional)
                        let subCategoriaId = null;
                        if (row.SubCategoriaID) {
                            const subCheck = await transaction.request()
                                .input('subId', sql.Int, parseInt(row.SubCategoriaID, 10))
                                .query('SELECT 1 AS ok FROM SubCategoria WHERE SubCategoriaID = @subId');
                            if (subCheck.recordset.length === 0) {
                                errors.push({ row: rowNum, error: `SubCategoriaID ${row.SubCategoriaID} not found`, sku: row.SKU });
                                continue;
                            }
                            subCategoriaId = parseInt(row.SubCategoriaID, 10);
                        }

                        const sku = String(row.SKU).trim();
                        const nombre = String(row.Nombre).trim();
                        const unidadMedidaBase = String(row.UnidadMedidaBase).trim();
                        const cantidadUnidadBase = parseFloat(row.CantidadUnidadBase);
                        const descripcion = row.Descripcion ? String(row.Descripcion).trim() : null;

                        // Upsert
                        const existing = await transaction.request()
                            .input('sku', sql.NVarChar, sku)
                            .query('SELECT ProductoID FROM ProductoMaestro WHERE SKU = @sku');

                        if (existing.recordset.length > 0) {
                            await transaction.request()
                                .input('nombre', sql.NVarChar, nombre)
                                .input('desc', sql.NVarChar(4000), descripcion)
                                .input('subId', sql.Int, subCategoriaId)
                                .input('sku', sql.NVarChar, sku)
                                .query(`
                                    UPDATE ProductoMaestro
                                    SET Nombre = @nombre,
                                        Descripcion = @desc,
                                        SubCategoriaID = @subId
                                    WHERE SKU = @sku
                                `);
                            upserted.push({ row: rowNum, action: 'updated', sku });
                        } else {
                            const result = await transaction.request()
                                .input('sku', sql.NVarChar, sku)
                                .input('nombre', sql.NVarChar, nombre)
                                .input('desc', sql.NVarChar(4000), descripcion)
                                .input('subId', sql.Int, subCategoriaId)
                                .input('um', sql.NVarChar, unidadMedidaBase)
                                .input('cant', sql.Decimal(18, 2), cantidadUnidadBase)
                                .query(`
                                    INSERT INTO ProductoMaestro
                                        (SKU, Nombre, Descripcion, SubCategoriaID, UnidadMedidaBase, CantidadUnidadBase, NegocioID)
                                    OUTPUT INSERTED.ProductoID AS ProductoID
                                    VALUES (@sku, @nombre, @desc, @subId, @um, @cant, @negocioId)
                                `);
                            upserted.push({ row: rowNum, action: 'inserted', sku, productoId: result.recordset[0].ProductoId });
                        }
                    } catch (rowErr) {
                        errors.push({ row: rowNum, error: rowErr.message, sku: row.SKU });
                    }
                }

                await transaction.commit();
            } catch (txErr) {
                await transaction.rollback();
                throw txErr;
            }

            return {
                status: 200,
                jsonBody: {
                    message: 'Bulk upload complete',
                    upserted: upserted.length,
                    errors: errors.length,
                    details: errors.length > 0 ? { errors } : undefined
                }
            };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});
