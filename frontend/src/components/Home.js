import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const restaurantIcons = ['🍕', '🍔', '🍣', '🍜', '🌮', '🥗', '🍝', '🍛', '🥘', '🍱'];
const restaurantGradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)'
];

function Home({ token }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/restaurants');
      setRestaurants(response.data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">🍽️ Loading restaurants...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2>🍽️ Discover Amazing Restaurants</h2>
        <p>Order your favorite food from the best restaurants in town</p>
      </div>
      
      {restaurants.length === 0 ? (
        <div className="empty-state">
          <h3>🏪 No restaurants available</h3>
          <p>Check back later for new restaurants!</p>
        </div>
      ) : (
        <div className="restaurant-grid">
          {restaurants.map((restaurant, index) => (
            <div
              key={restaurant.id}
              className="restaurant-card"
              onClick={() => navigate(`/restaurant/${restaurant.id}`)}
            >
              <div 
                className="restaurant-image"
                style={{ background: restaurantGradients[index % restaurantGradients.length] }}
              >
                <span style={{ zIndex: 1 }}>
                  {restaurantIcons[index % restaurantIcons.length]}
                </span>
              </div>
              <div className="restaurant-card-content">
                <h3>{restaurant.name}</h3>
                {restaurant.address && (
                  <p>📍 {restaurant.address}</p>
                )}
                {restaurant.phone && (
                  <p>📞 {restaurant.phone}</p>
                )}
                <div className="restaurant-rating">
                  <span className="rating-stars">⭐ 4.{Math.floor(Math.random() * 5) + 5}</span>
                  <span style={{ color: '#999', fontSize: '14px' }}>
                    ({Math.floor(Math.random() * 500) + 100}+ reviews)
                  </span>
                </div>
                <span className="restaurant-badge">Fast Delivery</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
