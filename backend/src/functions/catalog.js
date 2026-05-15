const { app } = require('@azure/functions');
const { poolPromise, sql } = require('../utils/db');

// GET /categories
app.http('getCategories', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query('SELECT CategoriaID, Nombre FROM Categoria');
            
            return {
                status: 200,
                jsonBody: result.recordset
            };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});

// GET /subcategories/{categoryId}
app.http('getSubCategories', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'subcategories/{categoryId}',
    handler: async (request, context) => {
        const categoryId = request.params.categoryId;
        
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('categoryId', sql.Int, categoryId)
                .query('SELECT SubCategoriaID, Nombre FROM SubCategoria WHERE CategoriaID = @categoryId');
            
            return {
                status: 200,
                jsonBody: result.recordset
            };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});
// GET /products/{storeId}
app.http('getProductsByStore', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'products/{storeId}',
    handler: async (request, context) => {
        const storeId = request.params.storeId;
        const search = request.query.get('search');
        const subCategoryId = request.query.get('subCategoryId');
        const categoryId = request.query.get('categoryId');
        const isPromotion = request.query.get('isPromotion') === 'true';

        try {
            const pool = await poolPromise;
            let query = `
                SELECT 
                    pm.ProductoID, pm.Nombre, pm.Descripcion, pm.SKU, pm.UnidadMedidaBase, pm.CantidadUnidadBase,
                    pt.PrecioRegular, pt.PrecioPromocion, pt.EsPromocion, pt.Stock,
                    (SELECT TOP 1 ImagenURL FROM ProductoImagen WHERE ProductoID = pm.ProductoID AND EsPortada = 1) as ImagenURL
                FROM ProductoMaestro pm
                JOIN ProductoTienda pt ON pm.ProductoID = pt.ProductoID
                JOIN SubCategoria sc ON pm.SubCategoriaID = sc.SubCategoriaID
                JOIN Categoria c ON sc.CategoriaID = c.CategoriaID
                WHERE pt.TiendaID = @storeId
            `;

            const sqlRequest = pool.request().input('storeId', sql.Int, storeId);

            if (search) {
                query += " AND pm.Nombre LIKE @search";
                sqlRequest.input('search', sql.NVarChar, `%${search}%`);
            }
            if (subCategoryId) {
                query += " AND pm.SubCategoriaID = @subCategoryId";
                sqlRequest.input('subCategoryId', sql.Int, subCategoryId);
            }
            if (categoryId) {
                query += " AND c.CategoriaID = @categoryId";
                sqlRequest.input('categoryId', sql.Int, categoryId);
            }
            if (isPromotion) {
                query += " AND pt.EsPromocion = 1";
            }

            const result = await sqlRequest.query(query);

            // Calculate price per unit on the fly
            const products = result.recordset.map(p => {
                const activePrice = p.EsPromocion && p.PrecioPromocion ? p.PrecioPromocion : p.PrecioRegular;
                return {
                    ...p,
                    PrecioPorUnidadMedida: activePrice / p.CantidadUnidadBase,
                    DisplayPrecioPorUnidad: `$${(activePrice / p.CantidadUnidadBase).toFixed(2)} por ${p.UnidadMedidaBase}`
                };
            });

            return {
                status: 200,
                jsonBody: products
            };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});

// GET /product/{productId}/{storeId}
app.http('getProductDetail', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'product/{productId}/{storeId}',
    handler: async (request, context) => {
        const productId = request.params.productId;
        const storeId = request.params.storeId;

        try {
            const pool = await poolPromise;
            
            // 1. Get Product Maestro and Store Price
            const productResult = await pool.request()
                .input('productId', sql.Int, productId)
                .input('storeId', sql.Int, storeId)
                .query(`
                    SELECT 
                        pm.ProductoID, pm.Nombre, pm.Descripcion, pm.SKU, pm.UnidadMedidaBase, pm.CantidadUnidadBase,
                        pt.PrecioRegular, pt.PrecioPromocion, pt.EsPromocion, pt.Stock
                    FROM ProductoMaestro pm
                    LEFT JOIN ProductoTienda pt ON pm.ProductoID = pt.ProductoID AND pt.TiendaID = @storeId
                    WHERE pm.ProductoID = @productId
                `);

            if (productResult.recordset.length === 0) {
                return { status: 404, body: 'Product Not Found' };
            }

            const product = productResult.recordset[0];

            // 2. Get Gallery Images
            const imagesResult = await pool.request()
                .input('productId', sql.Int, productId)
                .query('SELECT ImagenURL, EsPortada FROM ProductoImagen WHERE ProductoID = @productId ORDER BY Orden ASC');

            // 3. Enrich response
            const activePrice = product.EsPromocion && product.PrecioPromocion ? product.PrecioPromocion : product.PrecioRegular;
            const enrichedProduct = {
                ...product,
                PrecioPorUnidadMedida: activePrice / product.CantidadUnidadBase,
                DisplayPrecioPorUnidad: `$${(activePrice / product.CantidadUnidadBase).toFixed(2)} por ${product.UnidadMedidaBase}`,
                Imagenes: imagesResult.recordset
            };

            return {
                status: 200,
                jsonBody: enrichedProduct
            };
        } catch (err) {
            context.log(err);
            return { status: 500, body: 'Internal Server Error' };
        }
    }
});

