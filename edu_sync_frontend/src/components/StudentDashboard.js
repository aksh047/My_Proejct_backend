import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Student');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const name = decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
        if (name) {
          setUserName(name);
        } else if (decoded.name) {
          setUserName(decoded.name);
        }
      } catch (err) {
        console.error('Error decoding token in StudentDashboard:', err);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-black-red-gradient">
        <div className="container">
          <a className="navbar-brand" href="#">EduSync - Student Portal</a>
          <div className="d-flex align-items-center">
            <span className="text-white me-3">Welcome, {userName}</span>
            <button className="btn btn-outline-light" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container py-5 flex-grow-1">
        <div className="row">
          <div className="col-md-12">
            <div className="card shadow">
              <div className="card-body">
                <h2 className="card-title mb-4">Student Dashboard</h2>
                <p className="lead">Welcome to your learning journey!</p>
                <div className="row mt-4">
                  <div className="col-md-4">
                    <div className="card bg-black-red-gradient text-white">
                      <div className="card-body">
                        <h5 className="card-title">My Courses</h5>
                        <p className="card-text">View enrolled courses and materials</p>
                        <button className="btn btn-light mt-3" onClick={() => navigate('/student/courses')}>Go to Courses</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card bg-black-red-gradient text-white">
                      <div className="card-body">
                        <h5 className="card-title">Assignments</h5>
                        <p className="card-text">View and submit assignments</p>
                        <button className="btn btn-light mt-3" onClick={() => navigate('/student/assignments')}>Go to Assignments</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card bg-black-red-gradient text-white">
                      <div className="card-body">
                        <h5 className="card-title">Grades</h5>
                        <p className="card-text">Check your grades and progress</p>
                        <button className="btn btn-light mt-3" onClick={() => navigate('/student/grades')}>Go to Grades</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-dark text-white text-center py-3 mt-auto">
        <div className="container">
          <p className="mb-1">EduSync</p>
          <p className="mb-0">© 2025 All rights reserved by EduSync</p>
        </div>
      </footer>
    </div>
  );
} 