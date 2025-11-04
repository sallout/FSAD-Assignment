// API Test Component - Add this to your EquipmentManagement component temporarily

const testAPI = async () => {
  console.log("Testing API connection...");
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log("Token:", token ? "present" : "missing");
  console.log("Role:", role);
  
  try {
    // Test a simple endpoint
    const response = await axios.get(`${API_BASE_URL}/student/equipment`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true' // Add this for ngrok
      },
    });
    console.log("API Test Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("API Test Failed:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return null;
  }
};

// Add a test button to your JSX:
// <button onClick={testAPI}>Test API Connection</button>