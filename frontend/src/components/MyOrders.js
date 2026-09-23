import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReviewModal from './ReviewModal';

function MyOrders({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingOrder, setReviewingOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/orders/mine', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    const statusMap = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      preparing: 'status-preparing',
      delivered: 'status-delivered'
    };
    return `order-status ${statusMap[status] || 'status-pending'}`;
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      pending: '⏳',
      confirmed: '✅',
      preparing: '👨‍🍳',
      delivered: '🚚'
    };
    return iconMap[status] || '📦';
  };

  if (loading) {
    return <div className="loading">📦 Loading your orders...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2>📦 My Orders</h2>
        <p>Track and manage your food orders</p>
      </div>
      
      {orders.length === 0 ? (
        <div className="empty-state">
          <h3>🍽️ No orders yet</h3>
          <p>Start by ordering from your favorite restaurant!</p>
        </div>
      ) : (
        <>
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>Order #{order.id}</h3>
                  <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
                    🕒 {new Date(order.created_at).toLocaleString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className={getStatusClass(order.status)}>
                  {getStatusIcon(order.status)} {order.status.toUpperCase()}
                </span>
              </div>
              
              {order.delivery_address && (
                <div style={{ 
                  marginBottom: '15px',
                  padding: '12px',
                  background: 'rgba(102, 126, 234, 0.05)',
                  borderRadius: '12px',
                  fontSize: '14px'
                }}>
                  📍 <strong>Delivery to:</strong> {order.delivery_address}
                </div>
              )}

              <div className="order-items">
                <h4 style={{ marginBottom: '12px', color: '#333', fontSize: '16px' }}>🍽️ Items:</h4>
                {order.items && order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <span>
                      <strong>{item.name || `Item #${item.menuItemId}`}</strong>
                      <span style={{ color: '#999', marginLeft: '8px' }}>× {item.quantity}</span>
                    </span>
                    <span style={{ fontWeight: '600', color: '#667eea' }}>
                      ${item.price ? (parseFloat(item.price) * item.quantity).toFixed(2) : 'N/A'}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ 
                marginTop: '20px', 
                paddingTop: '20px', 
                borderTop: '2px solid #f0f0f0',
                textAlign: 'right',
                fontSize: '22px'
              }}>
                <span style={{ color: '#666', fontSize: '16px', marginRight: '10px' }}>
                  Total Amount:
                </span>
                <span style={{ 
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  ${parseFloat(order.total_amount || order.totalPrice || 0).toFixed(2)}
                </span>
              </div>

              {/* Review Button */}
              <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <button
                  onClick={() => setReviewingOrder(order)}
                  style={{
                    padding: '12px 30px',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(240, 147, 251, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  ⭐ Write a Review
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Review Modal */}
      {reviewingOrder && (
        <ReviewModal
          order={reviewingOrder}
          token={token}
          onClose={() => setReviewingOrder(null)}
          onSubmit={() => {
            setReviewingOrder(null);
            alert('✅ Thank you for your review!');
          }}
        />
      )}
    </div>
  );
}

export default MyOrders;
