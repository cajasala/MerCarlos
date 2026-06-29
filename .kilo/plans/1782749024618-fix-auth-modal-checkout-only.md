# Fix AuthModal: Show Only at Checkout

## Problem
AuthModal appears on initial app load even though the spec says browsing should be anonymous. Root cause: the Axios 401 interceptor in `App.jsx:70` still calls `setIsAuthOpen(true)` on any 401 response. Since `secure-endpoints-jwt` requires JWT on catalog endpoints in production, the first `fetchProducts()` call returns 401, triggering the interceptor and blocking navigation.

## Decision
- **Backend:** make catalog and locations endpoints public again. Keep JWT required on orders and lists.
- **Frontend:** remove `setIsAuthOpen(true)` from the 401 interceptor.
- **Specs:** update `secure-endpoints-jwt` to align with the new scope (catalog/locations public, orders/lists secured).

## Tasks

### 1. Backend — Make catalog & locations public
**Files:** `backend/src/functions/catalog.js`, `backend/src/functions/locations.js`

For each handler in both files, remove the `authenticate(request)` call and the `if (!user) return { status: 401, body: 'Unauthorized' }` check.

| Endpoint | File | Lines to remove |
|---|---|---|
| `getCategories` | catalog.js | 11-12 |
| `getSubCategories` | catalog.js | 35-36 |
| `getProductsByStore` | catalog.js | 62-63 |
| `getProductDetail` | catalog.js | 132-133 |
| `getCities` | locations.js | 11-12 |
| `getStoresByCity` | locations.js | 36-37 |

**Do NOT change:**
- `orders.js` (GET/POST) — keep JWT required
- `lists.js` (GET/POST/DELETE) — keep JWT required
- `auth.js` — keep as-is

### 2. Frontend — Remove auto-open from 401 interceptor
**File:** `frontend/src/App.jsx` line 70

Remove `setIsAuthOpen(true)` from the interceptor. It should only clear credentials silently:

```js
// Before
if (error.response && error.response.status === 401) {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthOpen(true);  // ← REMOVE THIS LINE
}

// After
if (error.response && error.response.status === 401) {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
}
```

AuthModal already opens correctly from:
- `handleCheckout()` (line 242) — when no token at checkout
- Navigation "Ingresa" button (line 283) — manual login trigger

### 3. Update secure-endpoints-jwt spec
**File:** `openspec/specs/secure-endpoints-jwt/spec.md`

Update the "Mandatory Frontend Login" requirement (lines 24-29) to reflect that:
- Catalog and locations endpoints are public (no JWT required for browsing)
- JWT is required for orders and lists endpoints only
- Frontend opens AuthModal only at checkout or via manual login trigger

### 4. Validation
1. Load app without token and with saved store → StoreSelector opens, **no AuthModal**
2. Select store → catalog loads without auth
3. Add products to cart → works without auth
4. Click "Hacer pedido" without token → **AuthModal opens**
5. Complete OTP (new user) → step 2 (profile) shown, then order created
6. Complete OTP (existing user) → modal closes, order created immediately
7. Verify orders and lists views still require auth (401 handled gracefully)
