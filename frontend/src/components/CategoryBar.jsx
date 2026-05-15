import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CategoryBar.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';

const CategoryBar = ({ onSelectCategory, selectedCategory }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/categories`);
      setCategories([{ CategoriaID: null, Nombre: 'Todos' }, ...res.data]);
    } catch (err) {
      console.error('Error fetching categories', err);
    }
  };

  return (
    <div className="category-bar">
      <div className="category-list-scroll">
        {categories.map(cat => (
          <button 
            key={cat.CategoriaID}
            className={`category-item ${selectedCategory === cat.CategoriaID ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.CategoriaID)}
          >
            {cat.Nombre}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryBar;
