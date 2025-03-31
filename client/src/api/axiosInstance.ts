import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === 'production'? import.meta.env.VITE_API_URL_PROD : import.meta.env.VITE_API_URL_DEV, // Replace with your API's base URL
  withCredentials: true, // Ensure credentials (cookies) are sent with each request
});

export default axiosInstance;