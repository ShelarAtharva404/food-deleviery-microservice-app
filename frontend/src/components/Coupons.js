import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Coupons({ token }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/coupons');
      setCoupons(response.data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    alert(`Coupon code "${code}" copied to clipboard!`);
  };

  if (loading) {
    return <div className="loading">🎟️ Loading coupons...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2>🎟️ Available Coupons & Offers</h2>
        <p>Save money on your next order with these amazing deals!</p>
      </div>

      {coupons.length === 0 ? (
        <div className="empty-state">
          <h3>No coupons available</h3>
          <p>Check back later for new offers!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginTop: '30px' }}>
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '25px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Decorative corner */}
              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '100px',
                height: '100px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                opacity: '0.1'
              }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Discount Badge */}
                <div style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '18px',
                  fontWeight: '700',
                  marginBottom: '15px'
                }}>
                  {coupon.discount_type === 'percentage' 
                    ? `${coupon.discount_value}% OFF`
                    : `$${coupon.discount_value} OFF`}
                </div>

                {/* Coupon Code */}
                <div
                  onClick={() => copyCoupon(coupon.code)}
                  style={{
                    padding: '15px',
                    background: 'rgba(102, 126, 234, 0.1)',
                    borderRadius: '12px',
                    marginBottom: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: '2px dashed #667eea'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                  }}
                >
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#667eea', textAlign: 'center', letterSpacing: '2px' }}>
                    {coupon.code}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999', textAlign: 'center', marginTop: '5px' }}>
                    Click to copy
                  </div>
                </div>

                {/* Description */}
                <p style={{ color: '#666', marginBottom: '15px', fontSize: '15px' }}>
                  {coupon.description}
                </p>

                {/* Details */}
                <div style={{ fontSize: '13px', color: '#999' }}>
                  {coupon.min_order_amount && (
                    <div style={{ marginBottom: '5px' }}>
                      📦 Min. order: ${parseFloat(coupon.min_order_amount).toFixed(2)}
                    </div>
                  )}
                  {coupon.max_discount_amount && (
                    <div style={{ marginBottom: '5px' }}>
                      💰 Max. discount: ${parseFloat(coupon.max_discount_amount).toFixed(2)}
                    </div>
                  )}
                  {coupon.valid_until && (
                    <div>
                      ⏰ Valid until: {new Date(coupon.valid_until).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Apply Button */}
                <button
                  onClick={() => copyCoupon(coupon.code)}
                  style={{
                    width: '100%',
                    marginTop: '15px',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Copy & Use Code
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Coupons;
