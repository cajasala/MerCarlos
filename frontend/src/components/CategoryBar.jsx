import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CategoryBar.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';

const CategoryBar = ({ onSelectCategory, selectedCategory, onSelectSubCategory, selectedSubCategory }) => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/categories`);
      setCategories([{ CategoriaID: null, Nombre: 'Todos' }, ...res.data]);
    } catch (err) {
      console.error('Error fetching categories', err);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      const res = await axios.get(`${API_URL}/subcategories/${categoryId}`);
      setSubcategories(res.data);
    } catch (err) {
      console.error('Error fetching subcategories', err);
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
      {subcategories.length > 0 && (
        <div className="category-list-scroll subcategory-list">
          {subcategories.map(sub => (
            <button
              key={sub.SubcategoriaID}
              className={`subcategory-item ${selectedSubCategory === sub.SubcategoriaID ? 'active' : ''}`}
              onClick={() => onSelectSubCategory(sub.SubcategoriaID)}
            >
              {sub.Nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryBar;
