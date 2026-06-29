import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import BottomNav from './components/BottomNav';
import StoreSelector from './components/StoreSelector';
import CategoryBar from './components/CategoryBar';
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import AuthModal from './components/AuthModal';
import ProfileView from './components/ProfileView';
import ListsView from './components/ListsView';
import OrdersView from './components/OrdersView';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import AdminOrdersView from './components/AdminOrdersView';
import AdminProductImages from './components/AdminProductImages';
import AdminProductUpload from './components/AdminProductUpload';
import AdminPriceUpload from './components/AdminPriceUpload';
import Footer from './components/Footer';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';

function App() {
  const [selectedStore, setSelectedStore] = useState(null);
  const [isStoreSelectorOpen, setIsStoreSelectorOpen] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // home, profile, lists, orders, admin
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminActiveView, setAdminActiveView] = useState('prices'); // prices, orders, bulkProducts, productImages
  const [pendingCheckout, setPendingCheckout] = useState(false);

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) setIsAdminLoggedIn(true);
    
    // Check URL for admin mode
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'admin') setCurrentView('admin');
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    const savedCart = localStorage.getItem('cart');
    if (savedCart) setCartItems(JSON.parse(savedCart));

    // Global Axios 401 interceptor
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const handleLoginSuccess = (data) => {
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

    if (pendingCheckout) {
      setPendingCheckout(false);
      submitOrder();
      return;
    }

    const savedStore = localStorage.getItem('selectedStore');
    if (savedStore) {
      const store = JSON.parse(savedStore);
      setSelectedStore(store);
      fetchProducts(store.TiendaID, null, '', true);
    } else {
      setIsFirstVisit(true);
      setIsStoreSelectorOpen(true);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentView('home');
  };

  const handleAdminLogin = (data) => {
    setIsAdminLoggedIn(true);
    localStorage.setItem('adminToken', data.token);
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('adminToken');
    setCurrentView('home');
    window.history.pushState({}, '', '/');
  };

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    const savedStore = localStorage.getItem('selectedStore');
    if (savedStore) {
      const store = JSON.parse(savedStore);
      setSelectedStore(store);
      fetchProducts(store.TiendaID, null, '', true);
    } else {
      setIsFirstVisit(true);
      setIsStoreSelectorOpen(true);
    }
  }, []);

  const fetchProducts = async (storeId, categoryId = null, search = '', isPromotion = null, subCategoryId = null) => {
    setLoading(true);
    try {
      let url = `${API_URL}/products/${storeId}`;
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId);
      if (search) params.append('search', search);
      if (isPromotion !== null) params.append('isPromotion', isPromotion);
      if (subCategoryId) params.append('subCategoryId', subCategoryId);
      
      const res = await axios.get(`${url}?${params.toString()}`);
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    localStorage.setItem('selectedStore', JSON.stringify(store));
    setIsStoreSelectorOpen(false);
    setIsFirstVisit(false);
    setSelectedSubCategory(null);
    fetchProducts(store.TiendaID, selectedCategory, searchTerm, null, null);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedSubCategory(null);
    fetchProducts(selectedStore.TiendaID, categoryId, '', null, null);
  };

  const handleSubCategorySelect = (subCategoryId) => {
    setSelectedSubCategory(subCategoryId);
    fetchProducts(selectedStore.TiendaID, selectedCategory, '', null, subCategoryId);
  };

  const [sortBy, setSortBy] = useState('none'); // none, price_asc, price_desc, unit_price_asc

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (currentView !== 'home') setCurrentView('home');
    // Debounce would be better, but for now simple
    fetchProducts(selectedStore.TiendaID, selectedCategory, value, null, null);
  };

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.ProductoID === product.ProductoID);
      if (existing) {
        return prev.map(item => 
          item.ProductoID === product.ProductoID 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId, quantity) => {
    setCartItems(prev => prev.map(item => 
      item.ProductoID === productId ? { ...item, quantity } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.ProductoID !== productId));
  };

  const submitOrder = async () => {
    const token = localStorage.getItem('token');
    const total = cartItems.reduce((acc, item) => {
      const price = item.EsPromocion ? item.PrecioPromocion : item.PrecioRegular;
      return acc + (price * item.quantity);
    }, 0);

    try {
      await axios.post(`${API_URL}/orders`, {
        tiendaId: selectedStore.TiendaID,
        items: cartItems,
        total
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCartItems([]);
      setIsCartOpen(false);
      setCurrentView('orders');
      alert('¡Pedido realizado con éxito!');
    } catch (err) {
      console.error('Error in checkout', err);
      alert('Hubo un error al procesar tu pedido.');
    }
  };

  const handleCheckout = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setPendingCheckout(true);
      setIsAuthOpen(true);
      return;
    }
    await submitOrder();
  };

  const sortedProducts = [...products].sort((a, b) => {
    const priceA = a.EsPromocion ? a.PrecioPromocion : a.PrecioRegular;
    const priceB = b.EsPromocion ? b.PrecioPromocion : b.PrecioRegular;
    
    if (sortBy === 'price_asc') return priceA - priceB;
    if (sortBy === 'price_desc') return priceB - priceA;
    if (sortBy === 'unit_price_asc') return a.PrecioPorUnidadMedida - b.PrecioPorUnidadMedida;
    return 0;
  });

  if (currentView === 'admin') {
    return (
      <div className="app admin-mode">
        {!isAdminLoggedIn ? (
          <AdminLogin onLoginSuccess={handleAdminLogin} />
        ) : (
            <AdminDashboard activeView={adminActiveView} onViewChange={setAdminActiveView} onLogout={handleAdminLogout}>
            {adminActiveView === 'prices' && <AdminPriceUpload />}
            {adminActiveView === 'bulkProducts' && <AdminProductUpload />}
            {adminActiveView === 'orders' && <AdminOrdersView />}
            {adminActiveView === 'productImages' && <AdminProductImages productId={null} />}
          </AdminDashboard>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <Navigation 
        selectedStore={selectedStore} 
        onOpenStoreSelector={() => setIsStoreSelectorOpen(true)}
        onSearch={handleSearch}
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => user ? setCurrentView('profile') : setIsAuthOpen(true)}
      />

      <main className="main-content container animate-fade-in">
        {!selectedStore ? (
          <div className="welcome-placeholder">
            <h2>Bienvenido a MerCarlos</h2>
            <p>Por favor selecciona una tienda para ver los productos disponibles.</p>
            <button className="btn btn-primary" onClick={() => setIsStoreSelectorOpen(true)}>
              Seleccionar Tienda
            </button>
          </div>
        ) : currentView === 'profile' ? (
          <ProfileView 
            user={user} 
            selectedStore={selectedStore} 
            onLogout={handleLogout}
            onChangeStore={() => setIsStoreSelectorOpen(true)}
          />
        ) : currentView === 'lists' ? (
          <ListsView onAddToCart={addToCart} />
        ) : currentView === 'orders' ? (
          <OrdersView />
        ) : (
          <div className="catalog-content">
            <CategoryBar 
              selectedCategory={selectedCategory} 
              onSelectCategory={handleCategorySelect}
              selectedSubCategory={selectedSubCategory}
              onSelectSubCategory={handleSubCategorySelect}
            />
            
            <div className="catalog-header">
              <div className="catalog-title">
                <h3>{selectedCategory ? 'Resultados' : 'Nuestros Productos'}</h3>
                <span className="product-count">{products.length} artículos</span>
              </div>
              
              <div className="catalog-filters">
                <select 
                  className="sort-select" 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="none">Ordenar por</option>
                  <option value="price_asc">Precio: Menor a Mayor</option>
                  <option value="price_desc">Precio: Mayor a Menor</option>
                  <option value="unit_price_asc">Precio por Unidad: Menor a Mayor</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-grid">
                {[1,2,3,4].map(i => <div key={i} className="skeleton-card card"></div>)}
              </div>
            ) : (
              <div className="grid grid-cols-4">
                {sortedProducts.length > 0 ? (
                  sortedProducts.map(product => (
                    <ProductCard 
                      key={product.ProductoID} 
                      product={product} 
                      onAddToCart={addToCart}
                      onShowDetail={(p) => setSelectedProductId(p.ProductoID)}
                    />
                  ))
                ) : (
                  <div className="no-products">
                    No encontramos productos en esta categoría para esta tienda.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer selectedStore={selectedStore} />

      {selectedProductId && (
        <ProductDetail 
          productId={selectedProductId}
          storeId={selectedStore.TiendaID}
          onClose={() => setSelectedProductId(null)}
          onAddToCart={addToCart}
        />
      )}

      <Cart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => { setIsAuthOpen(false); setPendingCheckout(false); }}
        onLoginSuccess={handleLoginSuccess}
        mandatory={pendingCheckout}
      />

      <StoreSelector 
        isOpen={isStoreSelectorOpen}
        mandatory={isFirstVisit}
        onSelect={handleStoreSelect}
        onClose={() => setIsStoreSelectorOpen(false)}
      />

      <BottomNav 
        currentView={currentView}
        onViewChange={setCurrentView}
      />
    </div>
  );
}

export default App;
