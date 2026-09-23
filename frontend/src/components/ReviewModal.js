import React, { useState } from 'react';
import axios from 'axios';

function ReviewModal({ order, onClose, onSubmit, token }) {
  const [rating, setRating] = useState(5);
  const [foodRating, setFoodRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Try both possible field names
      const restaurantId = order.restaurant_id || order.restaurantId;
      
      console.log('Submitting review for order:', order);
      console.log('Restaurant ID:', restaurantId);
      
      if (!restaurantId) {
        throw new Error('Restaurant ID not found in order');
      }

      const reviewData = {
        restaurantId: restaurantId,
        orderId: order.id,
        rating,
        reviewText,
        foodRating,
        serviceRating,
        deliveryRating
      };
      
      console.log('Review data:', reviewData);

      const response = await axios.post(
        'http://localhost:4000/api/reviews/restaurant',
        reviewData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('Review submitted successfully:', response.data);
      onSubmit();
    } catch (error) {
      console.error('Error submitting review:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to submit review. Please try again.';
      alert(errorMsg);
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#666' }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '32px',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              padding: '0'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {star <= value ? '⭐' : '☆'}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '25px',
        padding: '40px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ marginBottom: '10px', color: '#333' }}>⭐ Rate Your Experience</h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>Order #{order.id}</p>

        <form onSubmit={handleSubmit}>
          <StarRating value={rating} onChange={setRating} label="Overall Rating" />
          <StarRating value={foodRating} onChange={setFoodRating} label="Food Quality" />
          <StarRating value={serviceRating} onChange={setServiceRating} label="Service" />
          <StarRating value={deliveryRating} onChange={setDeliveryRating} label="Delivery" />

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#666' }}>
              Write a Review (Optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience..."
              rows="4"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '15px',
                fontFamily: 'Poppins, sans-serif',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '15px',
                background: '#f0f0f0',
                color: '#666',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: '15px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReviewModal;
