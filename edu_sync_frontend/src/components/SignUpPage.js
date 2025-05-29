import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { registerUser } from "../services/api"; // Adjust the path if necessary
import { useNavigate } from "react-router-dom"; // Import useNavigate
// Import the signup image
import signupImage from '../image/undraw_step-to-the-sun_wp49.png';

export default function SignUpPage() {
  const navigate = useNavigate(); // Use the useNavigate hook
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!formData.fullName || !formData.email || !formData.password || !formData.role) {
      setError("All fields are required.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await registerUser(formData);
      console.log("User registered successfully:", response);
      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
        setSuccess("User registered successfully!");
        setFormData({
          fullName: "",
          email: "",
          password: "",
          role: "",
        });
      } else {
        setError("Token not received from the server.");
      }
    } catch (err) {
      console.error("Registration error:", err, err.response);
      if (err.response?.data?.errors) {
        setError(
          Object.values(err.response.data.errors)
            .flat()
            .join(" ")
        );
      } else {
        setError(err.response?.data?.message || "Registration failed.");
      }
    } finally {
      setIsLoading(false);
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
                src={signupImage} 
                alt="Sign up illustration" 
                className="img-fluid"
                style={{ maxWidth: '500px' }} // Optional: control max width
              />
            </div>

            {/* Right Column: Signup Form */}
            <div className="col-md-6 d-flex justify-content-center">
              <div className="card shadow-lg p-4 border-0" style={{ minWidth: 350, maxWidth: 400, width: "100%" }}>
                <h2 className="text-center fw-bold mb-4" style={{ fontSize: "2rem" }}>
                  Create your account
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
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="form-control form-control-lg"
                      placeholder="Full Name"
                      required
                    />
                  </div>
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
                  <div className="mb-4">
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="form-select form-select-lg"
                      required
                    >
                      <option value="">Select: Student or Instructor</option>
                      <option value="Student">Student</option>
                      <option value="Instructor">Instructor</option>
                    </select>
                  </div>
                  <div className="d-grid mb-3">
                    <button type="submit" className="btn btn-primary btn-lg fw-bold" disabled={isLoading}>
                      {isLoading ? "Signing Up..." : "Sign Up"}
                    </button>
                  </div>

                  <p className="text-center text-muted mt-3 mb-0">
                    Already have an account?{" "}
                    <a href="/login" className="text-primary fw-semibold text-decoration-none" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                      Log in
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
