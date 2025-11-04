// API Configuration - Dynamic based on environment
const getApiBaseUrl = () => {
  // Check if we're running locally or via ngrok
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Running locally - use local backend
    return "http://localhost:5000";
  } else {
    // Running via ngrok or production - use ngrok backend
    return "https://3f9091d61249.ngrok-free.app";
  }
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;