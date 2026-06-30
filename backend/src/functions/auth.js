const { app } = require('@azure/functions');
const { getPool, sql } = require('../../utils/db');
const { sendSMS, generateOTP } = require('../../utils/sms');
const { generateToken, authenticate } = require('../../utils/auth');

// POST /auth/request-otp
app.http('requestOTP', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'auth/request-otp',
    handler: async (request, context) => {
        try {
            const { telefono } = await request.json();
            if (!telefono) return { status: 400, body: 'Phone number required' };

            const otp = generateOTP();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

            const pool = await getPool();
            await pool.request()
                .input('telefono', sql.NVarChar, telefono)
                .input('code', sql.NVarChar, otp)
                .input('expiresAt', sql.DateTime, expiresAt)
                .query('INSERT INTO OTP (Telefono, Code, ExpiresAt) VALUES (@telefono, @code, @expiresAt)');

            await sendSMS(telefono, `Tu código de verificación para MerCarlos es: ${otp}`);

            return { status: 200, jsonBody: { message: 'OTP sent' } };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});

// POST /auth/verify-otp
app.http('verifyOTP', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'auth/verify-otp',
    handler: async (request, context) => {
        try {
            const { telefono, code, nombre, apellido, email, codigoFidelizacion } = await request.json();
            
            const pool = await getPool();
            
            // 1. Verify OTP
            const otpResult = await pool.request()
                .input('telefono', sql.NVarChar, telefono)
                .input('code', sql.NVarChar, code)
                .query('SELECT TOP 1 * FROM OTP WHERE Telefono = @telefono AND Code = @code AND ExpiresAt > GETDATE() ORDER BY CreatedAt DESC');

            if (otpResult.recordset.length === 0) {
                return { status: 401, body: 'Invalid or expired OTP' };
            }

            // 2. Check if user exists, if not create
            let userResult = await pool.request()
                .input('telefono', sql.NVarChar, telefono)
                .query('SELECT * FROM Cliente WHERE Telefono = @telefono');

            let user;
            let isNew = false;
            if (userResult.recordset.length === 0) {
                // Register new user
                const insertResult = await pool.request()
                    .input('telefono', sql.NVarChar, telefono)
                    .input('nombre', sql.NVarChar, nombre || '')
                    .input('apellido', sql.NVarChar, apellido || '')
                    .input('email', sql.NVarChar, email || '')
                    .input('fidelizacion', sql.NVarChar, codigoFidelizacion || '')
                    .query('INSERT INTO Cliente (Telefono, Nombre, Apellido, Email, CodigoFidelizacion) OUTPUT INSERTED.* VALUES (@telefono, @nombre, @apellido, @email, @fidelizacion)');
                user = insertResult.recordset[0];
                isNew = true;
            } else {
                user = userResult.recordset[0];
            }

            // 3. Generate JWT
            const token = generateToken({ id: user.ClienteID, role: 'user' });

            return {
                status: 200,
                jsonBody: {
                    token,
                    isNew,
                    user: {
                        id: user.ClienteID,
                        nombre: user.Nombre,
                        apellido: user.Apellido,
                        telefono: user.Telefono,
                        email: user.Email
                    }
                }
            };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});

// PATCH /auth/profile
app.http('updateProfile', {
    methods: ['PATCH'],
    authLevel: 'anonymous',
    route: 'auth/profile',
    handler: async (request, context) => {
        try {
            const auth = authenticate(request);
            if (!auth) return { status: 401, body: 'Unauthorized' };

            const { nombre, apellido, email } = await request.json();

            const pool = await getPool();
            const result = await pool.request()
                .input('clienteId', sql.Int, auth.id)
                .input('nombre', sql.NVarChar, nombre || '')
                .input('apellido', sql.NVarChar, apellido || '')
                .input('email', sql.NVarChar, email || '')
                .query(`UPDATE Cliente
                        SET Nombre = @nombre, Apellido = @apellido, Email = @email
                        OUTPUT INSERTED.ClienteID, INSERTED.Nombre, INSERTED.Apellido, INSERTED.Telefono, INSERTED.Email
                        WHERE ClienteID = @clienteId`);

            if (result.recordset.length === 0) return { status: 404, body: 'User not found' };

            const u = result.recordset[0];
            return {
                status: 200,
                jsonBody: {
                    user: {
                        id: u.ClienteID,
                        nombre: u.Nombre,
                        apellido: u.Apellido,
                        telefono: u.Telefono,
                        email: u.Email
                    }
                }
            };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});
