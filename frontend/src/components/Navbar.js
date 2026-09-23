import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ user, logout }) {
  return (
    <div className="navbar">
      <div className="navbar-content">
        <h1>🍽️ FoodExpress</h1>
        <nav>
          <Link to="/">🏪 Restaurants</Link>
          <Link to="/coupons">🎟️ Coupons</Link>
          <Link to="/orders">📦 My Orders</Link>
          <span className="user-info">👋 {user?.name || 'User'}</span>
          <button onClick={logout}>🚪 Logout</button>
        </nav>
      </div>
    </div>
  );
}

export default Navbar;
