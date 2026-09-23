import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Checkout({ token }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, restaurant, menuItems, subtotal, discount, total, appliedCoupon } = location.state || {};

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Card details (fake for now)
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  // UPI details
  const [upiId, setUpiId] = useState('');

  // Wallet balance (fake)
  const [walletBalance] = useState(250.00);

  if (!cart || !restaurant) {
    navigate('/');
    return null;
  }

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
    { id: 'upi', name: 'UPI', icon: '📱' },
    { id: 'wallet', name: `Digital Wallet ($${walletBalance.toFixed(2)})`, icon: '👛' },
    { id: 'cod', name: 'Cash on Delivery', icon: '💵' }
  ];

  const handleCardInputChange = (field, value) => {
    let formattedValue = value;
    
    if (field === 'number') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) return;
    }
    
    if (field === 'expiry') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
      }
      if (formattedValue.length > 5) return;
    }
    
    if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 3) return;
    }

    setCardDetails({ ...cardDetails, [field]: formattedValue });
  };

  const validatePaymentDetails = () => {
    if (!deliveryAddress.trim()) {
      setMessage({ type: 'error', text: 'Please enter a delivery address' });
      return false;
    }

    if (selectedPaymentMethod === 'card') {
      if (!cardDetails.number || cardDetails.number.replace(/\s/g, '').length !== 16) {
        setMessage({ type: 'error', text: 'Please enter a valid 16-digit card number' });
        return false;
      }
      if (!cardDetails.name.trim()) {
        setMessage({ type: 'error', text: 'Please enter cardholder name' });
        return false;
      }
      if (!cardDetails.expiry || cardDetails.expiry.length !== 5) {
        setMessage({ type: 'error', text: 'Please enter valid expiry date (MM/YY)' });
        return false;
      }
      if (!cardDetails.cvv || cardDetails.cvv.length !== 3) {
        setMessage({ type: 'error', text: 'Please enter valid CVV' });
        return false;
      }
    }

    if (selectedPaymentMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setMessage({ type: 'error', text: 'Please enter a valid UPI ID' });
        return false;
      }
    }

    if (selectedPaymentMethod === 'wallet') {
      if (walletBalance < parseFloat(total)) {
        setMessage({ type: 'error', text: 'Insufficient wallet balance' });
        return false;
      }
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validatePaymentDetails()) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Step 1: Create the order
      const items = Object.entries(cart).map(([menuItemId, quantity]) => ({
        menuItemId: parseInt(menuItemId),
        quantity
      }));

      const orderResponse = await axios.post(
        'http://localhost:4000/api/orders',
        {
          restaurantId: restaurant.id,
          items,
          deliveryAddress,
          deliveryInstructions
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const orderId = orderResponse.data.id;

      // Step 2: Process payment (fake for now)
      let paymentMethod = selectedPaymentMethod;
      if (selectedPaymentMethod === 'card') {
        paymentMethod = `Card ending in ${cardDetails.number.slice(-4)}`;
      } else if (selectedPaymentMethod === 'upi') {
        paymentMethod = `UPI: ${upiId}`;
      }

      await axios.post(
        'http://localhost:4000/api/payments',
        {
          orderId,
          amount: total,
          paymentMethod,
          status: 'completed' // Fake success
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Step 3: Apply coupon if used
      if (appliedCoupon) {
        await axios.post(
          'http://localhost:4000/api/coupons/apply',
          {
            couponId: appliedCoupon.coupon.id,
            orderId,
            discountApplied: appliedCoupon.discount.appliedAmount
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }

      setMessage({ type: 'success', text: '🎉 Payment successful! Your order is being prepared...' });
      
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
    } catch (error) {
      console.error('Error processing order:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to process payment. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="menu-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back to Cart
        </button>
        <h2>Checkout</h2>
      </div>

      {message.text && (
        <div className={message.type === 'error' ? 'error' : 'success'} style={{ marginBottom: '20px' }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px', alignItems: 'start' }}>
        {/* Left side - Delivery & Payment */}
        <div>
          {/* Delivery Address */}
          <div className="payment-section">
            <h3>📍 Delivery Address</h3>
            <textarea
              placeholder="Enter your complete delivery address..."
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '15px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
            <textarea
              placeholder="Delivery instructions (optional)"
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'inherit',
                marginTop: '12px',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Payment Method Selection */}
          <div className="payment-section">
            <h3>💳 Payment Method</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  style={{
                    padding: '15px 20px',
                    border: `2px solid ${selectedPaymentMethod === method.id ? '#667eea' : '#e0e0e0'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: selectedPaymentMethod === method.id ? 'rgba(102, 126, 234, 0.05)' : 'white',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{method.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{method.name}</div>
                  </div>
                  {selectedPaymentMethod === method.id && (
                    <span style={{ color: '#667eea', fontWeight: 'bold' }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details Forms */}
          {selectedPaymentMethod === 'card' && (
            <div className="payment-section">
              <h3>💳 Card Details</h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                <input
                  type="text"
                  placeholder="Card Number (16 digits)"
                  value={cardDetails.number}
                  onChange={(e) => handleCardInputChange('number', e.target.value)}
                  style={{
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontFamily: 'monospace',
                    letterSpacing: '1px'
                  }}
                />
                <input
                  type="text"
                  placeholder="Cardholder Name"
                  value={cardDetails.name}
                  onChange={(e) => handleCardInputChange('name', e.target.value)}
                  style={{
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '15px'
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => handleCardInputChange('expiry', e.target.value)}
                    style={{
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    value={cardDetails.cvv}
                    onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                    style={{
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {selectedPaymentMethod === 'upi' && (
            <div className="payment-section">
              <h3>📱 UPI Details</h3>
              <input
                type="text"
                placeholder="Enter your UPI ID (e.g., user@paytm)"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '15px'
                }}
              />
              <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(102, 126, 234, 0.05)', borderRadius: '8px', fontSize: '14px', color: '#666' }}>
                ℹ️ You will receive a payment request on your UPI app
              </div>
            </div>
          )}

          {selectedPaymentMethod === 'wallet' && (
            <div className="payment-section">
              <h3>👛 Digital Wallet</h3>
              <div style={{ padding: '20px', background: 'rgba(102, 126, 234, 0.05)', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Available Balance</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>
                  ${walletBalance.toFixed(2)}
                </div>
                {walletBalance < parseFloat(total) && (
                  <div style={{ marginTop: '12px', color: '#f5576c', fontSize: '14px' }}>
                    ⚠️ Insufficient balance. Please choose another payment method.
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedPaymentMethod === 'cod' && (
            <div className="payment-section">
              <h3>💵 Cash on Delivery</h3>
              <div style={{ padding: '20px', background: 'rgba(76, 175, 80, 0.05)', borderRadius: '12px', textAlign: 'center', color: '#4caf50' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>💵</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>Pay with cash when delivered</div>
                <div style={{ fontSize: '14px', marginTop: '8px', color: '#666' }}>
                  Please keep exact change ready: ${total}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right side - Order Summary */}
        <div className="cart" style={{ position: 'sticky', top: '20px' }}>
          <h3>📦 Order Summary</h3>
          
          <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontWeight: '600', color: '#667eea', marginBottom: '8px' }}>
              {restaurant.name}
            </div>
            {Object.entries(cart).map(([itemId, quantity]) => {
              const item = menuItems.find(m => m.id === parseInt(itemId));
              return item ? (
                <div key={itemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginTop: '6px', color: '#666' }}>
                  <span>{quantity}x {item.name}</span>
                  <span>${(parseFloat(item.price) * quantity).toFixed(2)}</span>
                </div>
              ) : null;
            })}
          </div>

          <div style={{ display: 'grid', gap: '8px', fontSize: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: '600' }}>${subtotal}</span>
            </div>
            
            {discount > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4caf50' }}>
                  <span>Discount ({appliedCoupon?.coupon.code}):</span>
                  <span style={{ fontWeight: '600' }}>-${discount}</span>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#999' }}>
              <span>Delivery Fee:</span>
              <span style={{ textDecoration: 'line-through' }}>$2.99</span>
              <span style={{ color: '#4caf50', fontWeight: '600', marginLeft: '-30px' }}>FREE</span>
            </div>
          </div>

          <div className="cart-total" style={{ marginTop: '15px' }}>
            Total: ${total}
          </div>

          <button 
            className="checkout-btn"
            onClick={handlePlaceOrder}
            disabled={loading}
            style={{
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Processing...' : `🚀 Pay ${total} & Place Order`}
          </button>

          <div style={{ fontSize: '12px', color: '#999', marginTop: '12px', textAlign: 'center' }}>
            🔒 Your payment information is secure
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
