const { app } = require('@azure/functions');
const { getPool, sql } = require('../../utils/db');
const { requireAdmin } = require('../../utils/adminAuth');
const csv = require('csv-parser');
const { Readable } = require('stream');
const crypto = require('crypto');

// POST /api/admin/upload-products-csv
// CSV columns req: SKU, Nombre, Descripcion, UnidadMedidaBase, CantidadUnidadBase, LocalCategoriaID, LocalSubCategoriaID
// Roles: ADM, PED, EDI
app.http('uploadProductsCSV', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'api/admin/upload-products-csv',
    handler: async (request, context) => {
        try {
            context.log("Subida ......");
            context.log(request);
            const auth = await requireAdmin(request, ['ADM', 'PED', 'EDI']);
            context.log(auth);
            if (!auth.authorized) {
                return { status: auth.status, body: auth.body };
            }

            const formData = await request.formData();
            context.log(formData);
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

            const requiredColumns = [
                'SKU', 'Nombre', 'Descripcion', 'UnidadMedidaBase',
                'CantidadUnidadBase', 'LocalCategoriaID', 'LocalSubCategoriaID'
            ];
            if (rows.length > 0) {
                const missing = requiredColumns.filter(c => !(c in rows[0]));
                if (missing.length > 0) {
                    return { status: 400, body: `Missing required columns: ${missing.join(', ')}` };
                }
            }

            const sessionId = crypto.randomUUID();
            const pool = await getPool();
            const transaction = new sql.Transaction(pool);
            context.log("Va a iniciar transaccion");
            await transaction.begin();

            try {
                context.log("Llegan " + rows.length + " records");

                // 1. Definir la estructura de la tabla de staging
                const stagingTable = new sql.Table('TmpUploadProductMaestro');
                stagingTable.create = false;
                stagingTable.columns.add('SessionID', sql.UniqueIdentifier, { nullable: false });
                stagingTable.columns.add('RowIndex', sql.Int, { nullable: false });
                stagingTable.columns.add('SKU', sql.NVarChar(50), { nullable: false });
                stagingTable.columns.add('Nombre', sql.NVarChar(255), { nullable: false });
                stagingTable.columns.add('Descripcion', sql.NVarChar(sql.MAX), { nullable: true });
                stagingTable.columns.add('UnidadMedidaBase', sql.NVarChar(20), { nullable: false });
                stagingTable.columns.add('CantidadUnidadBase', sql.Decimal(18, 2), { nullable: false });
                stagingTable.columns.add('LocalCategoriaID', sql.VarChar(100), { nullable: false });
                stagingTable.columns.add('LocalSubCategoriaID', sql.VarChar(100), { nullable: false });
                stagingTable.columns.add('NegocioID', sql.Int, { nullable: false });

                // 2. Poblar la tabla de staging
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    const descVal = (row.Descripcion !== undefined && row.Descripcion !== null)
                        ? String(row.Descripcion).trim()
                        : null;

                    stagingTable.rows.add(
                        sessionId,
                        i + 1,
                        String(row.SKU).trim(),
                        String(row.Nombre).trim(),
                        descVal,
                        String(row.UnidadMedidaBase).trim(),
                        parseFloat(row.CantidadUnidadBase) || 0.0,
                        String(row.LocalCategoriaID).trim(),
                        String(row.LocalSubCategoriaID).trim(),
                        auth.negocioId
                    );
                }

                // 3. Ejecutar Bulk Copy en la tabla temporal
                const requestBulk = new sql.Request(transaction);
                await requestBulk.bulk(stagingTable);

                // 4. Llamar al procedimiento almacenado
                const spRequest = new sql.Request(transaction);
                const spResult = await spRequest
                    .input('SessionID', sql.UniqueIdentifier, sessionId)
                    .input('NegocioID', sql.Int, auth.negocioId)
                    .execute('sp_BulkUploadProducts');

                await transaction.commit();

                // 5. Mapear resultados
                const rawErrors = spResult.recordsets[0] || [];
                const counts = (spResult.recordsets[1] && spResult.recordsets[1][0]) || {};

                const upsertedCount = (counts.InsertedCount || 0) + (counts.UpdatedCount || 0);

                return {
                    status: 200,
                    jsonBody: {
                        message: 'Bulk upload complete',
                        upserted: upsertedCount,
                        errors: rawErrors.length,
                        details: rawErrors.length > 0 ? { errors: rawErrors } : undefined
                    }
                };
            } catch (txErr) {
                await transaction.rollback();
                throw txErr;
            }
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});
