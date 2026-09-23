require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:4001';
const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://restaurant-service:4002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:4003';
const DELIVERY_SERVICE_URL = process.env.DELIVERY_SERVICE_URL || 'http://delivery-service:4004';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4005';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4007';
const REVIEW_SERVICE_URL = process.env.REVIEW_SERVICE_URL || 'http://localhost:4008';
const COUPON_SERVICE_URL = process.env.COUPON_SERVICE_URL || 'http://localhost:4009';

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

// /api/users/*        -> user-service
// /api/restaurants/*  -> restaurant-service
// /api/orders/*       -> order-service
// /api/deliveries/*   -> delivery-service
// /api/notifications/*-> notification-service
// /api/payments/*     -> payment-service
// /api/reviews/*      -> review-service
// /api/coupons/*      -> coupon-service
app.use('/api/users', createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true, pathRewrite: { '^/api/users': '' } }));
app.use('/api/restaurants', createProxyMiddleware({ target: RESTAURANT_SERVICE_URL, changeOrigin: true, pathRewrite: { '^/api/restaurants': '' } }));
app.use('/api/orders', createProxyMiddleware({ target: ORDER_SERVICE_URL, changeOrigin: true, pathRewrite: { '^/api/orders': '' } }));
app.use('/api/deliveries', createProxyMiddleware({ target: DELIVERY_SERVICE_URL, changeOrigin: true, pathRewrite: { '^/api/deliveries': '' } }));
app.use('/api/notifications', createProxyMiddleware({ target: NOTIFICATION_SERVICE_URL, changeOrigin: true, pathRewrite: { '^/api/notifications': '' } }));
app.use('/api/payments', createProxyMiddleware({
  target: PAYMENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: (path) => `/payments${path === '/' ? '' : path}`,
}));
app.use('/api/payment-methods', createProxyMiddleware({
  target: PAYMENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: () => '/payment-methods',
}));
app.use('/api/reviews', createProxyMiddleware({ 
  target: REVIEW_SERVICE_URL, 
  changeOrigin: true,
  pathRewrite: (path) => `/reviews${path}`
}));
app.use('/api/coupons', createProxyMiddleware({ 
  target: COUPON_SERVICE_URL, 
  changeOrigin: true,
  pathRewrite: (path) => `/coupons${path}`
}));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`api-gateway listening on ${PORT}`));
