import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Heart, Plus, Trash2, ShoppingCart, ChevronRight, List } from 'lucide-react';
import './ListsView.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';

const ListsView = ({ onAddToCart }) => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/lists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLists(res.data);
    } catch (err) {
      console.error('Error fetching lists', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`${API_URL}/lists`, { nombre: newListName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLists([res.data, ...lists]);
      setNewListName('');
      setIsAdding(false);
    } catch (err) {
      console.error('Error creating list', err);
    }
  };

  const handleDeleteList = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/lists/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLists(lists.filter(l => l.ListaID !== id));
    } catch (err) {
      console.error('Error deleting list', err);
    }
  };

  if (loading) return <div className="loading-state">Cargando tus listas...</div>;

  return (
    <div className="lists-container animate-fade-in">
      <div className="lists-header">
        <div className="title-group">
          <Heart size={28} className="text-primary" />
          <h2>Mis Listas de Compra</h2>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
          <Plus size={20} />
          <span>Nueva Lista</span>
        </button>
      </div>

      {isAdding && (
        <form className="add-list-form card" onSubmit={handleCreateList}>
          <input 
            type="text" 
            placeholder="Nombre de la lista (ej: Mercado Mensual)" 
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            autoFocus
            required
          />
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => setIsAdding(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Crear</button>
          </div>
        </form>
      )}

      <div className="lists-grid">
        {lists.length > 0 ? (
          lists.map(list => (
            <div key={list.ListaID} className="list-card card">
              <div className="list-card-header">
                <div className="list-icon-bg">
                  <List size={24} />
                </div>
                <div className="list-meta">
                  <h3>{list.Nombre}</h3>
                  <p>{new Date(list.CreatedAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="list-actions">
                <button className="btn btn-outline btn-full" onClick={() => console.log('View items')}>
                  Ver artículos
                </button>
                <button className="icon-btn text-error" onClick={() => handleDeleteList(list.ListaID)}>
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-lists">
            <Heart size={64} className="placeholder-icon" />
            <p>Aún no tienes listas guardadas.</p>
            <p className="small">Crea una para organizar tus compras frecuentes.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListsView;
