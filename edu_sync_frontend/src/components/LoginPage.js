import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { api } from '../services/api';
// Import the login image
import loginImage from '../image/undraw_mobile-login_4ntr.png';

// Function to decode JWT token
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/api/auth/login", formData);
      console.log("Full login response:", response);
      console.log("Response data:", response.data);
      
      // Save token in localStorage
      if (response.data.token) {
        const token = response.data.token;
        
        // Clear existing localStorage data to prevent conflicts with previous projects
        localStorage.clear();
        
        localStorage.setItem("token", token);
        setSuccess("Login successful!");
        
        // Decode the token to get user information
        const decodedToken = decodeToken(token);
        console.log("Decoded token:", decodedToken);
        
        if (decodedToken) {
          // Extract role from token payload
          // Use the standard claim type for Role
          const userRole = decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']?.toLowerCase();
           // Fallback just in case, though standard claim type is preferred
           if (!userRole && decodedToken.role) {
               userRole = decodedToken.role.toLowerCase();
           }

          console.log("User role from token:", userRole);
          
          if (!userRole) {
            console.error("No role found in token payload:", decodedToken);
            setError("User role not found in authentication token");
            return;
          }
          
          if (userRole === "student") {
            console.log("Navigating to student dashboard");
            navigate('/student-dashboard');
          } else if (userRole === "instructor") {
            console.log("Navigating to instructor dashboard");
            navigate('/instructor-dashboard');
          } else {
            console.error("Invalid role received:", userRole);
            setError(`Invalid user role received: ${userRole}`);
          }
        } else {
          console.error("Failed to decode token");
          setError("Failed to process authentication token");
        }
      } else {
        console.log("No token found in response");
        setError("Authentication token not received");
      }
    } catch (err) {
      console.error("Login error details:", err);
      console.error("Error response:", err.response?.data);
      setError(err.response?.data?.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-black-red-gradient">
        <div className="container">
          <a className="navbar-brand" href="#">EduSync</a>
          {/* You can add other navbar elements here if needed */}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex justify-content-center align-items-center">
        <div className="container">
          <div className="row justify-content-center align-items-center">
            {/* Left Column: Image */}
            <div className="col-md-6 d-flex justify-content-center">
              <img 
                src={loginImage} 
                alt="Login illustration" 
                className="img-fluid"
                style={{ maxWidth: '500px' }} // Optional: control max width
              />
            </div>

            {/* Right Column: Login Form */}
            <div className="col-md-6 d-flex justify-content-center">
              <div className="card shadow-lg p-4 border-0" style={{ minWidth: 350, maxWidth: 400, width: "100%" }}>
                <h2 className="text-center fw-bold mb-4" style={{ fontSize: "2rem" }}>
                  Log in
                </h2>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="alert alert-success" role="alert">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-control form-control-lg"
                      placeholder="Email"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="form-control form-control-lg"
                      placeholder="Password"
                      required
                    />
                  </div>
                  <div className="d-grid mb-3">
                    <button type="submit" className="btn btn-lg fw-bold bg-black-red-gradient">
                      Log In
                    </button>
                  </div>

                  <p className="text-center text-muted mt-3 mb-0">
                    Forgot your password?{" "}
                    <a href="/reset-password" className="fw-semibold text-decoration-none text-black-force">
                      Reset Password
                    </a>
                  </p>

                  <p className="text-center text-muted mt-1 mb-0">
                    Don't have an account?{" "}
                    <a href="/signup" className="fw-semibold text-decoration-none text-black-force">
                      Sign up
                    </a>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-dark text-white text-center py-3 mt-auto">
        <div className="container">
          <p className="mb-1">EduSync</p>
          <p className="mb-0">© 2025 All rights reserved by EduSync</p>
        </div>
      </footer>
    </div>
  );
}
