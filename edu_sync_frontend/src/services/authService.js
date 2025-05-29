// src/services/authService.js
import api from '../config/api';

export const register = async (userData) => {
  try {
    console.log('Sending registration data:', userData);
    const response = await api.post('/api/auth/register', userData);
    console.log('Registration response:', response.data);

    if (response.data.token) {
      // Save token to localStorage
      localStorage.setItem('token', response.data.token);
      
      // Save user data to localStorage
      localStorage.setItem('user', JSON.stringify({
        email: response.data.user.email,
        role: response.data.user.role,
        name: response.data.user.name
      }));

      // Set default authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      return response.data;
    } else {
      throw new Error('No token received from server');
    }
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};