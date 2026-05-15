import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, MapPin, ChevronRight, Search } from 'lucide-react';
import './StoreSelector.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';

const StoreSelector = ({ onSelect, onClose, isOpen, mandatory = false }) => {
  const [cities, setCities] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCities();
    }
  }, [isOpen]);

  const fetchCities = async () => {
    try {
      const res = await axios.get(`${API_URL}/cities`);
      setCities(res.data);
    } catch (err) {
      console.error('Error fetching cities', err);
    }
  };

  const fetchStores = async (cityId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/stores/${cityId}`);
      setStores(res.data);
    } catch (err) {
      console.error('Error fetching stores', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    fetchStores(city.CiudadID);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in">
        <div className="modal-header">
          <h2>{mandatory ? 'Bienvenido a MerCarlos' : 'Cambiar Tienda'}</h2>
          {!mandatory && (
            <button className="close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          )}
        </div>

        <div className="modal-body">
          <p className="modal-subtitle">
            {selectedCity 
              ? `Tiendas en ${selectedCity.Nombre}` 
              : 'Selecciona tu ciudad para ver los precios de tu zona'}
          </p>

          {!selectedCity ? (
            <div className="city-list">
              {cities.map(city => (
                <button 
                  key={city.CiudadID} 
                  className="list-item"
                  onClick={() => handleCitySelect(city)}
                >
                  <span>{city.Nombre}</span>
                  <ChevronRight size={20} className="text-light" />
                </button>
              ))}
            </div>
          ) : (
            <div className="store-list">
              <button className="back-link" onClick={() => setSelectedCity(null)}>
                ← Volver a ciudades
              </button>
              {loading ? (
                <div className="loading-spinner">Cargando tiendas...</div>
              ) : (
                stores.map(store => (
                  <button 
                    key={store.TiendaID} 
                    className="list-item store-item"
                    onClick={() => onSelect(store)}
                  >
                    <div className="store-info">
                      <MapPin size={18} className="store-icon" />
                      <span>{store.Nombre}</span>
                    </div>
                    <ChevronRight size={20} className="text-light" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreSelector;
