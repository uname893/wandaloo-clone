// Auto-detect API URL based on environment
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api'
  : 'https://autoguide-maroc.onrender.com/api';

