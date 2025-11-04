import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Login = ({ setToken }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/login", formData);
      setMessage(res.data.message);

      const token = res.data.token;
      localStorage.setItem("token", token);
      if (setToken) setToken(token);

      jwtDecode(token); // just ensures it's a valid token
      navigate("/equipment");
      setFormData({ email: "", password: "" });
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
    }
  };

  // --- Basic inline CSS styles ---
  const styles = {
    container: {
      maxWidth: "400px",
      margin: "80px auto",
      padding: "25px",
      border: "1px solid #ccc",
      borderRadius: "8px",
      boxShadow: "0 0 10px rgba(0,0,0,0.1)",
      backgroundColor: "#fff",
      textAlign: "center",
      fontFamily: "Arial, sans-serif",
    },
    heading: {
      marginBottom: "20px",
      color: "#333",
    },
    message: {
      color: "#d9534f",
      marginBottom: "15px",
    },
    input: {
      width: "100%",
      padding: "10px",
      marginBottom: "15px",
      borderRadius: "5px",
      border: "1px solid #ccc",
      fontSize: "14px",
    },
    button: {
      width: "100%",
      padding: "10px",
      borderRadius: "5px",
      border: "none",
      backgroundColor: "#4CAF50",
      color: "white",
      fontSize: "16px",
      cursor: "pointer",
    },
    linkText: {
      marginTop: "15px",
      fontSize: "14px",
      color: "#333",
    },
    link: {
      color: "#007BFF",
      cursor: "pointer",
      textDecoration: "underline",
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Login</h2>
      {message && <p style={styles.message}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Login
        </button>
      </form>

      <p style={styles.linkText}>
        Don’t have an account?{" "}
        <span style={styles.link} onClick={() => navigate("/signup")}>
          Sign Up
        </span>
      </p>
    </div>
  );
};

export default Login;
