import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import RestaurantDetail from './components/RestaurantDetail';
import Checkout from './components/Checkout';
import MyOrders from './components/MyOrders';
import Coupons from './components/Coupons';
import Navbar from './components/Navbar';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Fetch user data
      fetchUserData();
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <div className="App">
        {token && <Navbar user={user} logout={logout} />}
        <Routes>
          <Route path="/login" element={
            token ? <Navigate to="/" /> : <Login onLogin={login} />
          } />
          <Route path="/register" element={
            token ? <Navigate to="/" /> : <Register onRegister={login} />
          } />
          <Route path="/" element={
            token ? <Home token={token} /> : <Navigate to="/login" />
          } />
          <Route path="/restaurant/:id" element={
            token ? <RestaurantDetail token={token} /> : <Navigate to="/login" />
          } />
          <Route path="/checkout" element={
            token ? <Checkout token={token} /> : <Navigate to="/login" />
          } />
          <Route path="/coupons" element={
            token ? <Coupons token={token} /> : <Navigate to="/login" />
          } />
          <Route path="/orders" element={
            token ? <MyOrders token={token} /> : <Navigate to="/login" />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
