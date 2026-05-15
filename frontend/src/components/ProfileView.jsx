import React from 'react';
import { User, MapPin, LogOut, ChevronRight, Bell, Settings } from 'lucide-react';
import './ProfileView.css';

const ProfileView = ({ user, selectedStore, onLogout, onChangeStore }) => {
  if (!user) return (
    <div className="profile-placeholder">
      <User size={64} className="placeholder-icon" />
      <h2>Mi Perfil</h2>
      <p>Inicia sesión para ver tu historial de pedidos y gestionar tu cuenta.</p>
    </div>
  );

  return (
    <div className="profile-container animate-fade-in">
      <div className="profile-header">
        <div className="user-avatar">
          {user.nombre.charAt(0)}{user.apellido.charAt(0)}
        </div>
        <div className="user-info">
          <h3>{user.nombre} {user.apellido}</h3>
          <p>{user.telefono}</p>
        </div>
      </div>

      <div className="profile-menu">
        <div className="menu-section">
          <h4>Configuración de Tienda</h4>
          <button className="menu-item" onClick={onChangeStore}>
            <div className="menu-item-content">
              <MapPin size={20} className="menu-icon" />
              <div>
                <span>Mi Tienda MerCarlos</span>
                <p>{selectedStore ? selectedStore.Nombre : 'No seleccionada'}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-light" />
          </button>
        </div>

        <div className="menu-section">
          <h4>Cuenta</h4>
          <button className="menu-item">
            <div className="menu-item-content">
              <Bell size={20} className="menu-icon" />
              <span>Notificaciones</span>
            </div>
            <ChevronRight size={20} className="text-light" />
          </button>
          <button className="menu-item">
            <div className="menu-item-content">
              <Settings size={20} className="menu-icon" />
              <span>Preferencias</span>
            </div>
            <ChevronRight size={20} className="text-light" />
          </button>
        </div>

        <button className="btn-logout" onClick={onLogout}>
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileView;
