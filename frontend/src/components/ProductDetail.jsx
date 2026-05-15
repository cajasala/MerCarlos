import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, ShoppingCart, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import './ProductDetail.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071/api';

const ProductDetail = ({ productId, storeId, onClose, onAddToCart }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchProductDetail();
  }, [productId, storeId]);

  const fetchProductDetail = async () => {
    try {
      const res = await axios.get(`${API_URL}/product/${productId}/${storeId}`);
      setProduct(res.data);
    } catch (err) {
      console.error('Error fetching product detail', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="product-detail-overlay">
      <div className="product-detail-content loading">Cargando detalles...</div>
    </div>
  );

  if (!product) return null;

  const images = product.Imagenes && product.Imagenes.length > 0 
    ? product.Imagenes 
    : [{ ImagenURL: 'https://via.placeholder.com/400x400?text=MerCarlos' }];

  return (
    <div className="product-detail-overlay animate-fade-in">
      <div className="product-detail-container">
        <button className="close-detail-btn" onClick={onClose}>
          <X size={28} />
        </button>

        <div className="product-detail-grid">
          {/* Image Gallery */}
          <div className="image-gallery">
            <div className="main-image-container">
              <img src={images[currentImageIndex].ImagenURL} alt={product.Nombre} className="main-image" />
              {images.length > 1 && (
                <>
                  <button 
                    className="gallery-nav-btn prev" 
                    onClick={() => setCurrentImageIndex((currentImageIndex - 1 + images.length) % images.length)}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    className="gallery-nav-btn next" 
                    onClick={() => setCurrentImageIndex((currentImageIndex + 1) % images.length)}
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
            <div className="thumbnail-list">
              {images.map((img, idx) => (
                <img 
                  key={idx}
                  src={img.ImagenURL} 
                  alt="thumbnail" 
                  className={`thumbnail ${idx === currentImageIndex ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(idx)}
                />
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="detail-info">
            <div className="detail-header">
              <span className="sku-label">SKU: {product.SKU}</span>
              <h2 className="detail-name">{product.Nombre}</h2>
              <div className="detail-price-section">
                {product.EsPromocion ? (
                  <div className="detail-price-group">
                    <span className="detail-current-price">${product.PrecioPromocion.toLocaleString()}</span>
                    <span className="detail-old-price">${product.PrecioRegular.toLocaleString()}</span>
                  </div>
                ) : (
                  <span className="detail-current-price">${product.PrecioRegular.toLocaleString()}</span>
                )}
                <span className="detail-unit-price">{product.DisplayPrecioPorUnidad}</span>
              </div>
            </div>

            <div className="detail-description">
              <h3>Descripción</h3>
              <p>{product.Descripcion || 'Sin descripción disponible.'}</p>
            </div>

            <div className="detail-features">
              <div className="feature-item">
                <Info size={18} />
                <span>Unidad base: {product.CantidadUnidadBase} {product.UnidadMedidaBase}</span>
              </div>
            </div>

            <div className="detail-actions">
              <button className="btn btn-primary btn-lg" onClick={() => onAddToCart(product)}>
                <ShoppingCart size={20} />
                <span>Agregar a la canastilla</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
