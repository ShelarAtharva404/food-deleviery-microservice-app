const axios = require('axios');

const RESTAURANT_SERVICE_URL =
  process.env.RESTAURANT_SERVICE_URL || 'http://restaurant-service:4002';
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4005';

async function getMenuItem(menuItemId) {
  const res = await axios.get(`${RESTAURANT_SERVICE_URL}/menu-items/${menuItemId}`);
  return res.data;
}

async function getRestaurant(restaurantId) {
  const res = await axios.get(`${RESTAURANT_SERVICE_URL}/${restaurantId}`);
  return res.data;
}

// Fire-and-forget notification — order flow should not fail if this fails
async function notify(event, payload) {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/notify`, { event, payload }, { timeout: 3000 });
  } catch (err) {
    console.error(`notification failed for event=${event}:`, err.message);
  }
}

module.exports = { getMenuItem, getRestaurant, notify };
