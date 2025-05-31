// src/api.js
import axios from 'axios';

const API_BASE_URL = 'https://mywebapp047.azurewebsites.net';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true // Add this line
});

export { api }; // Add this line to export the api instance

export const registerUser = async (userData) => {
    try {
        console.log('Sending registration data:', userData);
        const response = await api.post('/api/auth/register', userData);
        console.log('Registration response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Registration error:', error);
        if (error.response) {
            console.error('Error response:', error.response.data);
        }
        throw error;
    }
};
