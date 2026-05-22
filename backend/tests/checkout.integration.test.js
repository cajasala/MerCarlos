// Test flujo canastilla -> checkout POST /orders
const API = 'http://localhost:7073/api';

// 1. Buscar productos de la primera tienda disponible
async function getFirstStore() {
  const res = await fetch(`${API}/cities`);
  const cities = await res.json();
  if (!cities.length) throw new Error('No cities in DB');
  const cityId = cities[0].CiudadID;
  const storesRes = await fetch(`${API}/stores/${cityId}`);
  const stores = await storesRes.json();
  if (!stores.length) throw new Error('No stores in DB');
  return stores[0]; // { TiendaID, Nombre, ... }
}

// 2. Obtener productos de esa tienda
async function getProducts(storeId) {
  const res = await fetch(`${API}/products/${storeId}`);
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.statusText}`);
  return res.json();
}

// 3. Obtener token JWT (primer usuario cliente de la DB)
async function getFirstClientToken() {
  // Llamar directamente a la DB para obtener un cliente existente
  // o crear uno nuevo via OTP mock
  const res = await fetch(`${API}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      telefono: '099999999',
      code: '123456',
      nombre: 'Test',
      apellido: 'User'
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`OTP failed: ${JSON.stringify(data)}`);
  return data.token; // JWT
}

// 4. Simular checkout (mismo body que envía App.jsx)
async function createOrder(token, storeId, items, total) {
  const res = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ tiendaId: storeId, items, total })
  });
  const data = await res.json();
  return { status: res.status, body: data };
}

// ─── EJECUCIÓN ───────────────────────────────────────────
(async () => {
  console.log('=== INICIO PRUEBA FLUJO CANASTILLA → ORDEN ===');

  // Paso A: store
  const store = await getFirstStore();
  console.log(`[A] Tienda encontrada: TiendaID=${store.TiendaID} Nombre=${store.Nombre}`);

  // Paso B: productos
  const products = await getProducts(store.TiendaID);
  console.log(`[B] Productos encontrados: ${products.length}`);
  if (products.length === 0) { console.error('ERROR: No hay productos. Ejecute las migraciones y seed.'); process.exit(1); }

  // Tomar 2 productos para la orden
  const cartItems = products.slice(0, 2).map(p => ({
    ProductoID: p.ProductoID,
    Nombre: p.Nombre,
    EsPromocion: p.EsPromocion,
    PrecioPromocion: p.PrecioPromocion,
    PrecioRegular: p.PrecioRegular,
    ImagenURL: p.ImagenURL,
    DisplayPrecioPorUnidad: p.DisplayPrecioPorUnidad,
    quantity: 1
  }));
  const total = cartItems.reduce((acc, item) => {
    const price = item.EsPromocion ? item.PrecioPromocion : item.PrecioRegular;
    return acc + (price * item.quantity);
  }, 0);
  console.log(`[B] Canastilla (${cartItems.length} items):`);
  cartItems.forEach(i => console.log(`     - ${i.Nombre} (ID=${i.ProductoID}) $${i.EsPromocion ? i.PrecioPromocion : i.PrecioRegular}`));
  console.log(`     Total: $${total}`);

  // Paso C: JWT
  const token = await getFirstClientToken();
  console.log(`[C] JWT obtenido (primeros 30 chars): ${token.slice(0, 30)}...`);

  // Paso D: crear orden
  const result = await createOrder(token, store.TiendaID, cartItems, total);
  console.log(`[D] POST /orders → status ${result.status}`);
  console.log(`    body: ${JSON.stringify(result.body, null, 2)}`);

  if (result.status === 201) {
    console.log('\n✅ CHECKOUT EXITOSO — Orden creada correctamente');
    // Paso E: verificar en GET /orders
    const meRes = await fetch(`${API}/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const orders = await meRes.json();
    console.log(`[E] GET /orders → ${orders.length} orden(es)`);
    const nueva = orders.find(o => o.OrdenID === result.body.ordenId);
    if (nueva) {
      console.log(`    Orden ${nueva.OrdenID}: Status="${nueva.StatusNombre}", Total=$${nueva.Total}`);
    }
  } else {
    console.error('\n❌ CHECKOUT FALLÓ');
  }
})();
