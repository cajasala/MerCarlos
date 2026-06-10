## 1. Backend Implementation

- [x] 1.1 [BE] Modify `backend/utils/auth.js` to implement the development environment bypass check (`process.env.NODE_ENV === 'development'`) returning a default mock user context when no Authorization header is present.
- [x] 1.2 [BE] Update `backend/src/functions/locations.js` to secure `getCities` and `getStoresByCity` using the `authenticate` utility, returning a 401 status code if the user is unauthorized.
- [x] 1.3 [BE] Update `backend/src/functions/catalog.js` to secure `getCategories`, `getSubCategories`, `getProductsByStore`, and `getProductDetail` using the `authenticate` utility, returning a 401 status code if the user is unauthorized.

## 2. Frontend Implementation

- [x] 2.1 [FE] Configure Axios to globally inject the JWT Authorization header on startup and after successful login in `frontend/src/App.jsx`.
- [x] 2.2 [FE] Modify `frontend/src/App.jsx` to enforce mandatory login on application load if no JWT token exists in `localStorage`.
- [x] 2.3 [FE] Update `frontend/src/components/AuthModal.jsx` to hide the close button and disable closing of the modal when login is mandatory.
- [x] 2.4 [FE] Add global Axios interceptor in `frontend/src/App.jsx` to catch 401 response statuses and trigger the mandatory login modal.
