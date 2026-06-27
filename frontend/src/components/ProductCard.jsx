import React from 'react';
import { ShoppingCart, Eye } from 'lucide-react';
import './ProductCard.css';

const ProductCard = ({ product, onAddToCart, onShowDetail }) => {
  const { 
    Nombre, 
    PrecioRegular, 
    PrecioPromocion, 
    EsPromocion, 
    UnidadMedidaBase, 
    DisplayPrecioPorUnidad, 
    ImagenURL 
  } = product;

  const defaultImage = `${import.meta.env.BASE_URL}default-product.svg`;

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = defaultImage;
  };

  return (
    <div className="product-card card animate-fade-in">
      <div className="product-image-container">
        {EsPromocion && <span className="promo-badge">Oferta</span>}
        <img 
          src={ImagenURL || defaultImage} 
          alt={Nombre} 
          className="product-image"
          onError={handleImageError}
        />
        <button className="quick-view-btn" onClick={() => onShowDetail(product)}>
          <Eye size={18} />
        </button>
      </div>

      <div className="product-info">
        <h3 className="product-name" onClick={() => onShowDetail(product)}>{Nombre}</h3>
        
        <div className="price-section">
          {EsPromocion ? (
            <div className="price-group">
              <span className="current-price">${PrecioPromocion.toLocaleString()}</span>
              <span className="old-price">${PrecioRegular.toLocaleString()}</span>
            </div>
          ) : (
            <span className="current-price">${PrecioRegular.toLocaleString()}</span>
          )}
        </div>

        <div className="unit-price">
          {DisplayPrecioPorUnidad}
        </div>

        <button className="btn btn-primary add-to-cart-btn" onClick={() => onAddToCart(product)}>
          <ShoppingCart size={18} />
          <span>Agregar</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
