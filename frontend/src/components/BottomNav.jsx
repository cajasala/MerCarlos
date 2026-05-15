import React from 'react';
import { Home, Grid, ShoppingBag, User, Heart } from 'lucide-react';
import './BottomNav.css';

const BottomNav = ({ currentView, onViewChange }) => {
  return (
    <nav className="bottom-nav mobile-only">
      <button 
        className={`nav-item ${currentView === 'home' ? 'active' : ''}`}
        onClick={() => onViewChange('home')}
      >
        <Home size={20} />
        <span>Inicio</span>
      </button>
      <button className="nav-item">
        <Grid size={20} />
        <span>Categorías</span>
      </button>
      <button 
        className={`nav-item ${currentView === 'lists' ? 'active' : ''}`}
        onClick={() => onViewChange('lists')}
      >
        <Heart size={20} />
        <span>Listas</span>
      </button>
      <button 
        className={`nav-item ${currentView === 'profile' ? 'active' : ''}`}
        onClick={() => onViewChange('profile')}
      >
        <User size={20} />
        <span>Perfil</span>
      </button>
    </nav>
  );
};

export default BottomNav;
