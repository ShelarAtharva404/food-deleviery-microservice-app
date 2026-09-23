import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function RestaurantDetail({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    fetchRestaurantAndMenu();
  }, [id]);

  const fetchRestaurantAndMenu = async () => {
    try {
      const [restaurantRes, menuRes] = await Promise.all([
        axios.get(`http://localhost:4000/api/restaurants/${id}`),
        axios.get(`http://localhost:4000/api/restaurants/${id}/menu`)
      ]);
      setRestaurant(restaurantRes.data);
      setMenuItems(menuRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load restaurant data' });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (itemId, change) => {
    setCart(prev => {
      const newQuantity = (prev[itemId] || 0) + change;
      if (newQuantity <= 0) {
        const newCart = { ...prev };
        delete newCart[itemId];
        return newCart;
      }
      return { ...prev, [itemId]: newQuantity };
    });
  };

  const getCartTotal = () => {
    const subtotal = Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = menuItems.find(m => m.id === parseInt(itemId));
      return total + (item ? parseFloat(item.price) * quantity : 0);
    }, 0);
    
    if (appliedCoupon) {
      return parseFloat(appliedCoupon.discount.finalAmount);
    }
    
    return subtotal.toFixed(2);
  };

  const getSubtotal = () => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = menuItems.find(m => m.id === parseInt(itemId));
      return total + (item ? parseFloat(item.price) * quantity : 0);
    }, 0).toFixed(2);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter a coupon code' });
      return;
    }

    setCouponLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post(
        'http://localhost:4000/api/coupons/validate',
        {
          code: couponCode.toUpperCase(),
          orderAmount: getSubtotal()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setAppliedCoupon(response.data);
      setMessage({ type: 'success', text: `🎉 Coupon applied! You saved $${response.data.discount.appliedAmount}` });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Invalid coupon code' 
      });
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setMessage({ type: '', text: '' });
  };

  const handleCheckout = () => {
    if (Object.keys(cart).length === 0) {
      setMessage({ type: 'error', text: 'Your cart is empty! Add some delicious items first 🛒' });
      return;
    }

    // Navigate to checkout page with cart data
    navigate('/checkout', {
      state: {
        cart,
        restaurant,
        menuItems,
        subtotal: getSubtotal(),
        discount: appliedCoupon ? appliedCoupon.discount.appliedAmount : '0.00',
        total: getCartTotal(),
        appliedCoupon
      }
    });
  };

  if (loading) {
    return <div className="loading">🍽️ Loading menu...</div>;
  }

  if (!restaurant) {
    return (
      <div className="container">
        <div className="empty-state">Restaurant not found</div>
      </div>
    );
  }

  const cartItemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="container">
      <div className="menu-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Restaurants
        </button>
        <h2>{restaurant.name}</h2>
        {restaurant.address && <p>📍 {restaurant.address}</p>}
        {restaurant.phone && <p>📞 {restaurant.phone}</p>}
        <div className="restaurant-rating" style={{ marginTop: '15px', paddingTop: '0', border: 'none' }}>
          <span className="rating-stars">⭐ 4.{Math.floor(Math.random() * 5) + 5}</span>
          <span style={{ color: '#999', fontSize: '14px' }}>
            ({Math.floor(Math.random() * 500) + 100}+ reviews)
          </span>
        </div>
      </div>

      {message.text && (
        <div className={message.type === 'error' ? 'error' : 'success'} style={{ marginBottom: '20px' }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: cartItemCount > 0 ? '1fr 380px' : '1fr', gap: '30px', alignItems: 'start' }}>
        <div>
          <div className="menu-section">
            <h3>🍽️ Menu</h3>
            {menuItems.length === 0 ? (
              <div className="empty-state" style={{ marginTop: '20px' }}>
                <p>No menu items available</p>
              </div>
            ) : (
              <>
                {menuItems.map((item) => (
                  <div key={item.id} className="menu-item">
                    <div className="menu-item-info">
                      <h4>{item.name}</h4>
                      {item.description && <p>{item.description}</p>}
                      <div className="menu-item-price">${parseFloat(item.price).toFixed(2)}</div>
                    </div>
                    <div className="menu-item-actions">
                      {cart[item.id] ? (
                        <div className="quantity-control">
                          <button 
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            −
                          </button>
                          <span className="quantity">{cart[item.id]}</span>
                          <button 
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="quantity-btn"
                          onClick={() => updateQuantity(item.id, 1)}
                          style={{ width: 'auto', padding: '0 20px' }}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {cartItemCount > 0 && (
          <div className="cart">
            <h3>
              🛒 Your Cart 
              <span className="cart-badge">{cartItemCount}</span>
            </h3>
            {Object.entries(cart).map(([itemId, quantity]) => {
              const item = menuItems.find(m => m.id === parseInt(itemId));
              return item ? (
                <div key={itemId} className="cart-item">
                  <div>
                    <strong>{item.name}</strong>
                    <div style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>
                      Qty: {quantity}
                    </div>
                  </div>
                  <div style={{ fontWeight: '600', color: '#667eea' }}>
                    ${(parseFloat(item.price) * quantity).toFixed(2)}
                  </div>
                </div>
              ) : null;
            })}
            
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: '600' }}>${getSubtotal()}</span>
              </div>
              
              {/* Coupon Section */}
              <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(102, 126, 234, 0.05)', borderRadius: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#667eea' }}>
                  🎟️ Have a coupon?
                </div>
                {!appliedCoupon ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                      style={{
                        padding: '10px 15px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div style={{ 
                    padding: '10px', 
                    background: 'rgba(76, 175, 80, 0.1)', 
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#4caf50' }}>
                        {appliedCoupon.coupon.code}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {appliedCoupon.coupon.description}
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f5576c',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {appliedCoupon && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', color: '#4caf50' }}>
                  <span>Discount:</span>
                  <span style={{ fontWeight: '600' }}>-${appliedCoupon.discount.appliedAmount}</span>
                </div>
              )}
            </div>

            <div className="cart-total">
              Total: ${getCartTotal()}
            </div>
            <button 
              className="checkout-btn" 
              onClick={handleCheckout}
            >
              🛒 Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RestaurantDetail;
