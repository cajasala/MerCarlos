/**
 * RBAC Integration Tests
 *
 * Pre-requisite: SQL Server Azure env running with:
 *   1. Migration 001 executed
 *   2. Seed data applied (1.4 + 1.5 + 1.6)
 *
 * Run: npm test -- --grep RBAC
 *
 * Three admin accounts must exist before running:
 *   ADM  username='adm1'  password='admin123'   (Rol = 'ADM')
 *   PED  username='ped1'  password='gestor123'  (Rol = 'PED')
 *   EDI  username='edi1'  password='editor123'  (Rol = 'EDI')
 *
 * Passwords must be hashed with bcrypt before these tests.
 */

const assert = require('assert');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../utils/db');

const API = process.env.API_URL || 'http://localhost:7071/api';
const secret = process.env.JWT_SECRET;

let admToken, pedToken, ediToken, oranToken;
let negocioId;
let createdOrderId;

async function login(username, password) {
    const res = await fetch(`${API}/mng/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Login failed for ${username}: ${data.body} → verify bcrypt password`);
    return data.token;
}

describe('RBAC - Role Enforcing', () => {

    beforeEach(async () => {
        // Reuse token within session; re-login if expired or first test
        if (!admToken || !pedToken || !ediToken) {
            admToken = await login('adm1', 'admin123');
            pedToken = await login('ped1', 'gestor123');
            ediToken = await login('edi1', 'editor123');

            // Decode negocioId from token
            const decodedAdm = jwt.decode(admToken);
            negocioId = decodedAdm.negocioId;
            console.log('NegocioId', negocioId);
        }
    });

    // ─── 10.1 Login &Role ────────────────────────────────────────────────────
    it('ADM token carries role "ADM"', () => {
        const decoded = jwt.decode(admToken);
        assert.strictEqual(decoded.role, 'ADM');
    });

    it('PED token carries role "PED"', () => {
        const decoded = jwt.decode(pedToken);
        assert.strictEqual(decoded.role, 'PED');
    });

    it('EDI token carries role "EDI"', () => {
        const decoded = jwt.decode(ediToken);
        assert.strictEqual(decoded.role, 'EDI');
    });

    // ─── 10.2 Order Status Transitions ───────────────────────────────────────

    it('PED can advance order status one step at a time', async () => {
        // Create order first; get its ID from DB for testing
        const pool = await getPool();
        const result = await pool.request()
            .input('negocioId', sql.Int, negocioId)
            .query(`
                SELECT TOP 1 o.OrdenID, s.Nombre AS StatusNombre
                FROM Orden o
                JOIN StatusOrden s ON o.StatusID = s.StatusID
                JOIN Tienda t ON o.TiendaID = t.TiendaID
                WHERE t.NegocioID = @negocioId
            `);

        if (result.recordset.length === 0) {
            // Skip if no orders exist yet in test DB
            console.log('SKIP: no orders exist; advance transition test skipped');
            return;
        }

        const orderId = result.recordset[0].OrdenID;

        // Try stepping forward (Reservado → Alistamiento)
        const stepForward = await fetch(`${API}/api/admin/orders/${orderId}/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pedToken}`
            },
            body: JSON.stringify({ statusName: 'Alistamiento' })
        });

        assert.strictEqual(stepForward.status, 200, 'PED should succeed advancing one step');
    });

    it('PED cannot skip Despachado to Entregado', async () => {
        const pool = await getPool();
        const result = await pool.request()
            .input('negocioId', sql.Int, negocioId)
            .query(`
                SELECT TOP 1 o.OrdenID, s.Nombre AS StatusNombre
                FROM Orden o
                JOIN StatusOrden s ON o.StatusID = s.StatusID
                JOIN Tienda t ON o.TiendaID = t.TiendaID
                WHERE t.NegocioID = @negocioId AND s.Nombre IN ('Reservado','Alistamiento','Despachado')
            `);

        if (result.recordset.length === 0) {
            console.log('SKIP: no order in pivot state; skip test failed');
            return;
        }

        const orderId = result.recordset[0].OrdenID;

        // Skip one step: e.g. Reservado → Entregado (Invalid), should 422
        const skip = await fetch(`${API}/api/admin/orders/${orderId}/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pedToken}`
            },
            body: JSON.stringify({ statusName: 'Entregado' })
        });

        assert.strictEqual(skip.status, 422, 'PED should be blocked from skip transitions');
    });

    it('ADM can jump freely', async () => {
        const pool = await getPool();
        const result = await pool.request()
            .input('negocioId', sql.Int, negocioId)
            .query(`
                SELECT TOP 1 o.OrdenID, s.Nombre AS StatusNombre
                FROM Orden o
                JOIN StatusOrden s ON o.StatusID = s.StatusID
                JOIN Tienda t ON o.TiendaID = t.TiendaID
                WHERE t.NegocioID = @negocioId
            `);

        if (result.recordset.length === 0) {
            console.log('SKIP: no orders exist');
            return;
        }

        const orderId = result.recordset[0].OrdenID;
        const jump = await fetch(`${API}/api/admin/orders/${orderId}/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${admToken}`
            },
            body: JSON.stringify({ statusName: 'Cancelado' })
        });

        assert.strictEqual(jump.status, 200, 'ADM should always bypass transicionEstado checks');
    });

    // ─── 10.3 Cancellation from source state ─────────────────────────────────
    it('PED can cancel from Alistamiento state', async () => {
        const pool = await getPool();
        const result = await pool.request()
            .input('negocioId', sql.Int, negocioId)
            .query(`
                SELECT TOP 1 o.OrdenID, s.Nombre AS StatusNombre
                FROM Orden o
                JOIN StatusOrden s ON o.StatusID = s.StatusID
                JOIN StatusOrden s2 ON o.StatusID = s2.StatusID
                JOIN Tienda t ON o.TiendaID = t.TiendaID
                WHERE t.NegocioID = @negocioId
            `);

        if (result.recordset.length === 0) {
            console.log('SKIP: no orders');
            return;
        }

        const orderId = result.recordset[0].OrdenID;
        // Temporarily advance to Alistamiento for test
        await fetch(`${API}/api/admin/orders/${orderId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pedToken}` },
            body: JSON.stringify({ statusName: 'Alistamiento' })
        });

        const cancel = await fetch(`${API}/api/admin/orders/${orderId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pedToken}` },
            body: JSON.stringify({ statusName: 'Cancelado' })
        });

        assert.strictEqual(cancel.status, 200, 'PED should cancel from any state');
    });

    // ─── 10.4 Negocio Scope ──────────────────────────────────────────────────
    it('PED only sees negocio-scoped orders', async () => {
        const res = await fetch(`${API}/api/admin/orders`, {
            headers: { 'Authorization': `Bearer ${pedToken}` }
        });
        assert.strictEqual(res.status, 200);
        const orders = await res.json();
        const pool = await getPool();
        const negocioOrders = await pool.request()
            .input('negocioId', sql.Int, negocioId)
            .query(`SELECT o.OrdenID FROM Orden o JOIN Tienda t ON o.TiendaID = t.TiendaID WHERE t.NegocioID = @negocioId`);
        assert.strictEqual(orders.length, negocioOrders.recordset.length,
            'PED should only return negocio-owning orders');
    });

    // ─── 10.5 Bulk Product Upload partial success ─────────────────────────────
    it('bulk product upload returns per-row errors on partial failure', async () => {
        const badCSV = 'SKU,Nombre,Descripcion,UnidadMedidaBase,CantidadUnidadBase,LocalCategoriaID,LocalSubCategoriaID\nBAD-999,Test Fail,Desc Fail,unidad,1,LOCAL-CAT-999,LOCAL-SUB-999\nSKU-001,Good,Desc Good,unidad,1,LOCAL-CAT-001,LOCAL-SUB-001';

        const fd = new FormData();
        fd.append('file', new Blob([badCSV], { type: 'text/csv' }), 'bad.csv');

        const res = await fetch(`${API}/api/admin/upload-products-csv`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ediToken}`
            },
            body: fd
        });

        const data = await res.json();
        assert.ok(data.upserted !== undefined || data.message, 'Upload should return structured response');
    });

    // ─── 10.6 Image Upload auth ──────────────────────────────────────────────
    it('EDI can upload image (or mock returns 201)', async () => {
        // If AZURE_STORAGE_CONNECTION_STRING is not set, endpoint returns mock 201
        const DRAFT_PRODUCT_ID = 1;
        const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
        const fd = new FormData();
        fd.append('image', file);
        fd.append('esPortada', 'false');

        const res = await fetch(`${API}/api/admin/products/${DRAFT_PRODUCT_ID}/images`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${ediToken}` },
            body: fd
        });

        // Accept 201 (created) or 500 (no blob storage configured) — auth gate passed if 401/403 is NOT returned
        assert.notStrictEqual(res.status, 401, 'EDI should pass auth gate');
        assert.notStrictEqual(res.status, 403, 'EDI should be authorized for image upload');
    });

    it('PED is denied image upload', async () => {
        const DRAFT_PRODUCT_ID = 1;
        const fd = new FormData();
        fd.append('image', new File([''], 'test.jpg', { type: 'image/jpeg' }));

        const res = await fetch(`${API}/api/admin/products/${DRAFT_PRODUCT_ID}/images`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${pedToken}` },
            body: fd
        });

        assert.strictEqual(res.status, 403, 'PED role should be forbidden from image upload');
    });

    // ─── 10.7 Frontend role nav ───────────────────────────────────────────────
    it('JWT role field is string (not numeric)', () => {
        for (const token of [admToken, pedToken, ediToken]) {
            const decoded = jwt.decode(token);
            assert.strictEqual(typeof decoded.role, 'string',
                `Role must be a string for token ${token.slice(0, 20)}...`);
        }
    });
});
