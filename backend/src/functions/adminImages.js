const { app } = require('@azure/functions');
const { getPool, sql } = require('../../utils/db');
const { requireAdmin } = require('../../utils/adminAuth');

// POST /api/admin/products/{productId}/images
// Roles: ADM, EDI
app.http('uploadProductImage', {
     methods: ['POST'],
     authLevel: 'anonymous',
     route: 'api/admin/products/{productId}/images',
    handler: async (request, context) => {
        const auth = await requireAdmin(request, ['ADM', 'EDI']);
        if (!auth.authorized) {
            return { status: auth.status, body: auth.body };
        }

        try {
            const { productId } = request.params;
            const parsedId = parseInt(productId, 10);
            if (isNaN(parsedId)) {
                return { status: 400, body: 'Invalid productId' };
            }

            const formData = await request.formData();
            const file = formData.get('image');
            const esPortadaRaw = formData.get('esPortada');

            if (!file) {
                return { status: 400, body: 'image file is required' };
            }

            // MIME guard
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                return { status: 400, body: `Invalid image mime type: ${file.type}. Allowed: ${allowedTypes.join(', ')}` };
            }

            const esPortada = esPortadaRaw === 'true' || esPortadaRaw === '1';

            const imageBytes = Buffer.from(await file.arrayBuffer());

            // Upload to blob storage via static helper
            const imageUrl = await uploadToBlob(parsedId, file.name, imageBytes, file.type);

            const pool = await getPool();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // If uploading a cover image, demote the previous cover first
                if (esPortada) {
                    await transaction.request()
                        .input('productId', sql.Int, parsedId)
                        .query('UPDATE ProductoImagen SET EsPortada = 0 WHERE ProductoID = @productId AND EsPortada = 1');
                }

                const result = await transaction.request()
                    .input('productId', sql.Int, parsedId)
                    .input('url', sql.NVarChar, imageUrl)
                    .input('portada', sql.Bit, esPortada ? 1 : 0)
                    .query(`
                        INSERT INTO ProductoImagen (ProductoID, ImagenURL, EsPortada, Orden)
                        OUTPUT INSERTED.ImagenID AS ImagenID
                        VALUES (@productId, @url, @portada, 0)
                    `);

                await transaction.commit();
                return { status: 201, jsonBody: { imagenId: result.recordset[0].ImagenID, url: imageUrl, esPortada } };
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

// DELETE /api/admin/products/{productId}/images/{imagenId}

// GET /api/admin/products/{productId}/images — list images for a product
// Roles: ADM, EDI
app.http('listProductImages', {
     methods: ['GET'],
     authLevel: 'anonymous',
     route: 'api/admin/products/{productId}/images',
    handler: async (request, context) => {
        const auth = await requireAdmin(request, ['ADM', 'EDI']);
        if (!auth.authorized) {
            return { status: auth.status, body: auth.body };
        }

        try {
            const { productId } = request.params;
            const pool = await getPool();
            const result = await pool.request()
                .input('productId', sql.Int, parseInt(productId, 10))
                .query(`
                    SELECT i.ImagenID, i.ProductoID, i.ImagenURL, i.EsPortada, i.Orden
                    FROM ProductoImagen i
                    JOIN ProductoMaestro pm ON i.ProductoID = pm.ProductoID
                    WHERE i.ProductoID = @productId
                    ORDER BY i.Orden ASC, i.ImagenID ASC
                `);
            return { status: 200, jsonBody: result.recordset };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});
// Roles: ADM, EDI
app.http('deleteProductImage', {
     methods: ['DELETE'],
     authLevel: 'anonymous',
     route: 'api/admin/products/{productId}/images/{imagenId}',
    handler: async (request, context) => {
        const auth = await requireAdmin(request, ['ADM', 'EDI']);
        if (!auth.authorized) {
            return { status: auth.status, body: auth.body };
        }

        try {
            const { imagenId } = request.params;
            const { productId } = request.params; // eslint-disable-line no-unused-vars

            const pool = await getPool();
            const result = await pool.request()
                .input('imagenId', sql.Int, parseInt(imagenId, 10))
                .query('SELECT ProductoID, ImagenURL FROM ProductoImagen WHERE ImagenID = @imagenId');

            if (result.recordset.length === 0) {
                return { status: 404, body: 'Image not found' };
            }

            const { ImagenURL } = result.recordset[0];

            await pool.request()
                .input('imagenId', sql.Int, parseInt(imagenId, 10))
                .query('DELETE FROM ProductoImagen WHERE ImagenID = @imagenId');

            // Attempt to delete from blob storage — non-fatal if fails
            try { await deleteFromBlob(ImagenURL); } catch (_) { }

            return { status: 204, body: '' };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});

// --------------------------------------------------------------------------
// Blob helpers — replace with actual Azure Storage SDK integration
// Current: return a local-serving URL (file server or CDN placeholder)
// --------------------------------------------------------------------------

async function uploadToBlob(productId, fileName, bytes, mimeType) {
    const { BlobServiceClient } = require('@azure/storage-blob');
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_STORAGE_CONTAINER || 'product-images';

    if (!connectionString) {
        // Fallback during local development without Azure Storage configured
        context.log.warn('AZURE_STORAGE_CONNECTION_STRING not set — returning mock URL');
        return `https://placeholder.local/product-images/${productId}/${encodeURIComponent(fileName)}`;
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();

    const blobName = `product-${productId}/${Date.now()}-${fileName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(bytes, { blobHTTPHeaders: { blobContentType: mimeType } });

    return blockBlobClient.url;
}

async function deleteFromBlob(blobUrl) {
    try {
        const { BlobServiceClient } = require('@azure/storage-blob');
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        const { BlobClient } = require('@azure/storage-blob');
        const blobClient = new BlobClient(blobUrl, connectionString);
        await blobClient.deleteIfExists();
    } catch (_) { /* best-effort */ }
}
