const jwt = require('jsonwebtoken');
/*
const { app } = require('@azure/functions');
const { poolPromise, sql } = require('../../utils/db');
const { generateToken } = require('../../utils/auth');
const { comparePassword } = require('../../utils/password');
const csv = require('csv-parser');
const { Readable } = require('stream');
const crypto = require('crypto');
*/
// ──────────────────────────────────────────────
// adminGate  —  RBAC helper
// app.http handlers call   adminGate(request, ['ADM','PED'])
// Returns: { ok: true, adminId, negocioId, role }
//          { ok: false, status, body }
// ──────────────────────────────────────────────
async function adminGate(request, allowedRoles = []) {
    const rawAuth = request.headers?.get('authorization');
    if (!rawAuth) return { status: 401, body: 'Unauthorized' };

    const token = rawAuth.startsWith('Bearer ')
        ? rawAuth.slice(7)
        : rawAuth;

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return { status: 401, body: 'Invalid token' };
    }

    if (typeof decoded.role === 'number') {
        return { status: 401, body: 'Session expired — please log in again' };
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return { status: 403, body: 'Forbidden — insufficient role' };
    }
    return { ok: true, adminId: decoded.id, negocioId: decoded.negocioId, role: decoded.role };
}

// ──────────────────────────────────────────────
// POST /mng/login
// ──────────────────────────────────────────────
/*
app.http('mngLogin', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'mng/login',
    handler: async (request, context) => {
        try {
            const chunks = [];
            for await (const chunk of request.body) {
                chunks.push(Buffer.from(chunk));
            }
            const body = JSON.parse(Buffer.concat(chunks).toString());
            const { username, password } = body;

            if (!username || !password) {
                return { status: 400, body: 'Username and password required' };
            }

            const pool = await poolPromise;

            // Return hash for bcrypt comparison (no identity check)
            const result = await pool.request()
                .input('username', sql.NVarChar, username)
                .query('SELECT AdminID, Username, RolID, NegocioID, PasswordHash FROM Administrador WHERE Username = @username');

            if (result.recordset.length === 0) {
                return { status: 401, body: 'Invalid credentials' };
            }

            const admin = result.recordset[0];
            const passwordMatch = await comparePassword(password, admin.PasswordHash);

            if (!passwordMatch) {
                return { status: 401, body: 'Invalid credentials' };
            }

            const token = generateToken({ id: admin.AdminID, role: admin.RolID, negocioId: admin.NegocioID });

            return {
                status: 200,
                jsonBody: {
                    token,
                    admin: { id: admin.AdminID, username: admin.Username, role: admin.RolID, negocioId: admin.NegocioID }
                }
            };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});

// ──────────────────────────────────────────────
// POST /mng/upload-csv   — Carga Masiva de Precios
// Auth: ADM, PED, EDI
// ──────────────────────────────────────────────
app.http('mngUploadCSV', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'mng/upload-csv',
    handler: async (request, context) => {
        const gate = await adminGate(request, ['ADM', 'PED', 'EDI']);
        if (!gate.ok) return { status: gate.status, body: gate.body };

        try {
            const formData = await request.formData();
            const file = formData.get('file');
            const tiendaId = parseInt(formData.get('tiendaId'), 10);

            if (!file || !tiendaId) return { status: 400, body: 'File and Store ID required' };

            const buffer = Buffer.from(await file.arrayBuffer());
            const rows = [];

            const stream = Readable.from(buffer);
            await new Promise((resolve, reject) => {
                stream.pipe(csv())
                    .on('data', (data) => rows.push(data))
                    .on('end', resolve)
                    .on('error', reject);
            });

            if (rows.length === 0) return { status: 400, body: 'CSV file is empty' };

            const requiredColumns = ['SKU', 'PrecioRegular', 'PrecioPromocion', 'EsPromocion', 'Stock'];
            const missing = requiredColumns.filter(c => !(c in rows[0]));
            if (missing.length > 0) {
                return { status: 400, body: `Missing required columns: ${missing.join(', ')}` };
            }

            const sessionId = crypto.randomUUID();
            const pool = await poolPromise;
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // 1. Define staging table structure
                const stagingTable = new sql.Table('TmpUploadProductoTienda');
                stagingTable.create = false;
                stagingTable.columns.add('SessionID', sql.UniqueIdentifier, { nullable: false });
                stagingTable.columns.add('RowIndex', sql.Int, { nullable: false });
                stagingTable.columns.add('SKU', sql.NVarChar(50), { nullable: false });
                stagingTable.columns.add('PrecioRegular', sql.Decimal(18, 2), { nullable: false });
                stagingTable.columns.add('PrecioPromocion', sql.Decimal(18, 2), { nullable: true });
                stagingTable.columns.add('EsPromocion', sql.Bit, { nullable: false });
                stagingTable.columns.add('Stock', sql.Decimal(18, 2), { nullable: false });
                stagingTable.columns.add('NegocioID', sql.Int, { nullable: false });
                stagingTable.columns.add('TiendaID', sql.Int, { nullable: false });

                // 2. Populate staging rows
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    stagingTable.rows.add(
                        sessionId,
                        i + 1,
                        String(row.SKU).trim(),
                        parseFloat(row.PrecioRegular) || 0,
                        row.PrecioPromocion ? parseFloat(row.PrecioPromocion) : null,
                        row.EsPromocion === '1' || row.EsPromocion === 'true' ? 1 : 0,
                        parseFloat(row.Stock) || 0,
                        gate.negocioId,
                        tiendaId
                    );
                }

                // 3. Bulk insert into staging table
                const bulkRequest = new sql.Request(transaction);
                await bulkRequest.bulk(stagingTable);

                // 4. Execute stored procedure — validates SKUs and MERGEs into ProductoTienda
                const spResult = await new sql.Request(transaction)
                    .input('SessionID', sql.UniqueIdentifier, sessionId)
                    .input('NegocioID', sql.Int, gate.negocioId)
                    .input('TiendaID', sql.Int, tiendaId)
                    .execute('sp_BulkUploadStorePrices');

                await transaction.commit();

                // 5. Map SP result sets
                const errorRows = spResult.recordsets[0] || [];
                const counts = (spResult.recordsets[1] && spResult.recordsets[1][0]) || {};

                return {
                    status: 200,
                    jsonBody: {
                        message: 'Bulk upload complete',
                        inserted: counts.InsertedCount || 0,
                        updated: counts.UpdatedCount || 0,
                        errors: errorRows
                    }
                };
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
*/