import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import EquipmentManagement from "./pages/EquipmentManagement";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={!token ? <Login setToken={setToken} /> : <Navigate to="/equipment" />}
        />
        <Route
          path="/signup"
          element={!token ? <Signup /> : <Navigate to="/equipment" />}
        />

        {/* Protected routes */}
        <Route
          path="/equipment"
          element={token ? <EquipmentManagement token={token} /> : <Navigate to="/login" />}
        />

        {/* Default route */}
        <Route path="*" element={<Navigate to={token ? "/equipment" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
