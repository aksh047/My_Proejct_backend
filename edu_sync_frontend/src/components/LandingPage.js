import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Navbar with Gradient */}
      <div className="w-100 py-3 text-white text-center fw-bold bg-black-red-gradient" style={{ fontSize: '1.5rem' }}>
        Welcome to Your Learning Journey!
      </div>

      {/* Content Area with Background Image and Centered Box */}
      <div className="flex-grow-1 landing-bg d-flex justify-content-center align-items-center">
        {/* Reverted to single column, centered content */}
        <div className="container d-flex flex-column justify-content-center align-items-center text-center py-5">
          <div className="card shadow-lg p-5 border-0 main-box">
            <h1 className="display-4 fw-bold text-dark mb-3">EduSync</h1>
            <p className="lead text-secondary mb-5">
              Empowering Smart Learning & Assessment with a Seamless User Experience
            </p>
            <div>
              <button
                className="btn btn-lg me-3 px-5 btn-dark"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
              <button
                className="btn btn-lg px-5 bg-black-red-gradient"
                onClick={() => navigate('/signup')}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto text-center text-secondary pb-3">
        © 2025 EduSync. All rights reserved.
      </footer>
    </div>
  );
}
