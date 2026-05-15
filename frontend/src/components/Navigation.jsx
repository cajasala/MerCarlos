import React from 'react';
import { Search, ShoppingCart, User, MapPin, Menu } from 'lucide-react';
import './Navigation.css';

const Navigation = ({ selectedStore, onOpenStoreSelector, onSearch, cartCount, onOpenCart }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) onSearch(value);
  };

  return (
    <header className="header">
      <div className="container header-content">
        <div className="logo-section">
          <Menu className="mobile-only menu-icon" />
          <h1 className="logo">Mer<span>Carlos</span></h1>
        </div>

        <div className="search-bar-desktop desktop-only">
          <input 
            type="text" 
            placeholder="¿Qué estás buscando hoy?" 
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <button className="search-btn"><Search size={20} /></button>
        </div>

        <div className="nav-actions">
          <button className="store-selector-btn" onClick={onOpenStoreSelector}>
            <MapPin size={18} />
            <span className="desktop-only">{selectedStore ? selectedStore.Nombre : 'Seleccionar Tienda'}</span>
          </button>
          
          <button className="icon-btn desktop-only" onClick={onOpenAuth}>
            <User size={24} />
          </button>
          
          <button className="icon-btn cart-btn" onClick={onOpenCart}>
            <ShoppingCart size={24} />
            <span className="cart-badge">{cartCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
