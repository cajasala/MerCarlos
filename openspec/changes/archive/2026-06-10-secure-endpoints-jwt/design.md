## Context

Currently, locations and catalog endpoints are fully public. The user has requested to secure all endpoints under JWT authorization. To ensure that development speed and local testing remain unhindered, a hybrid authentication approach is proposed.

## Goals / Non-Goals

**Goals:**
- Secure `/api/cities`, `/api/stores/*`, `/api/categories`, `/api/subcategories/*`, `/api/products/*`, and `/api/product/*` using standard JWT verification.
- Allow local development testing without requiring JWT header authentication by auto-authenticating request contexts locally when `process.env.NODE_ENV === 'development'`.
- Adjust the React frontend to enforce login prior to location or product retrieval, and configure global Axios headers for JWT transmission.

**Non-Goals:**
- Authenticating `/api/auth/request-otp` and `/api/auth/verify-otp` (must remain public).
- Modifying the database schemas or table indexes.

## Decisions

### 1. Hybrid Auth Bypass in Development Mode
- **Choice:** Automatically mock the JWT validation return in `backend/utils/auth.js` when `process.env.NODE_ENV === 'development'` and no Authorization header is present.
- **Rationale:** Keeps developer experience (DX) seamless, enabling direct browser access to JSON endpoints and local frontend visual tests without mandatory logins.
- **Alternatives Considered:**
  - *No bypass (Strict Mode)*: Rejected because it requires generating/refreshing JWT tokens constantly for simple tests and breaks direct URL browser preview.
  - *Mock endpoint*: Rejected because it requires extra routing and code.

### 2. Frontend Global Request Header Configuration
- **Choice:** Configure Axios `common` headers on application initialization or authentication state change.
- **Rationale:** Ensures all components (`App.jsx`, `StoreSelector.jsx`, `ProductDetail.jsx`) automatically include the JWT token without having to manually modify every single Axios invocation.
- **Alternatives Considered:**
  - *Manual header passing*: Passing headers individually in each `axios.get` call. Rejected as error-prone and hard to maintain.

## Risks / Trade-offs

### Layer-specific Risks:
- **Frontend Failure:**
  - *Risk:* If the token is lost from state or `localStorage` becomes corrupted, the user might see `401 Unauthorized` across all product components.
  - *Mitigation:* Catch `401` responses globally using an Axios interceptor and redirect the user back to the mandatory login flow if the session is invalid.
- **Backend Failure:**
  - *Risk:* The bypass logic could run in production if `NODE_ENV` is incorrectly set or defaulted to `'development'` in the production environment.
  - *Mitigation:* Ensure strict checks: only bypass if `process.env.NODE_ENV === 'development'` and specifically *not* in production environments. We can also add a log message when the bypass is active.
- **Database Failure:**
  - *Risk:* DB connection pool timeouts or lock contention under heavy authenticated loads.
  - *Mitigation:* Keep queries optimized and connection times short (no impact on DB logic, auth helper only acts in-memory on request headers).

### Data Flow Diagram (ASCII):

```
=== LOCAL DEVELOPMENT FLOW (Bypass Active) ===
[Browser/Frontend] ─────── GET /api/cities (No Header) ───────▶ [Backend (auth.js)]
                                                                        │
                                                         NODE_ENV == 'development'?
                                                                        │ (Yes)
                                                                        ▼
                                                         [Injected Mock User Profile]
                                                                        │
                                                                        ▼
                                                             [Returns 200 Cities JSON]

=== PRODUCTION FLOW (Strict Auth) ===
[Browser/Frontend] ─────── GET /api/cities (No Header) ───────▶ [Backend (auth.js)]
                                                                        │
                                                         NODE_ENV == 'development'?
                                                                        │ (No)
                                                                        ▼
                                                             [Returns 401 Unauthorized]

[Browser/Frontend] ── GET /api/cities (Authorization Header) ──▶ [Backend (auth.js)]
                                                                        │
                                                             [Verify JWT Secret]
                                                                        │
                                                                        ▼
                                                             [Returns 200 Cities JSON]
```

## Migration Plan
1. Deploy the backend updates (secured endpoints and updated `utils/auth.js` helper).
2. Set the `NODE_ENV=production` environment variable in production settings to ensure the bypass is disabled.
3. Deploy the frontend updates (mandatory login on load, global Axios headers config, `AuthModal` changes).
