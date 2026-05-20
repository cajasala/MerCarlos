const jwt = require('jsonwebtoken');
const { app } = require('@azure/functions');
const { poolPromise, sql } = require('../../utils/db');
const { generateToken } = require('../../utils/auth');
const { comparePassword } = require('../../utils/password');
const csv = require('csv-parser');
const { Readable } = require('stream');

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
