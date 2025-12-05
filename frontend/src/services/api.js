import axios from 'axios';

const api = axios.create({
  baseURL: 'https://lvtech-backend.onrender.com/api',
  withCredentials: true, 
  headers: {
    'Accept': 'application/json'
  }
});

export default api;