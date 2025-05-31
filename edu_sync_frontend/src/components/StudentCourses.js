import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await api.get('/api/CourseModels', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(response.data);
      } catch (err) {
        setError('Failed to load courses.');
      }
      setLoading(false);
    };
    fetchCourses();
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-black-red-gradient mb-4">
        <div className="container">
          <a className="navbar-brand" href="#">All Courses</a>
          {/* You can add other navbar elements here if needed */}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow-1 container mt-4">
        <h2 className="text-black-force">All Courses</h2>
        {loading ? (
          <div className="text-center">
             <div className="spinner-border text-dark" role="status">
               <span className="visually-hidden">Loading...</span>
             </div>
             <p className="mt-2 text-black-force">Loading courses...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div className="row">
            {courses.length === 0 ? (
              <div className="alert alert-info text-black-force border-black-force bg-white">No courses found.</div>
            ) : (
              courses.map((course) => (
                <div className="col-md-6 mb-4" key={course.courseId}>
                  <div
                    className="card h-100 shadow-sm border-black-force text-black-force"
                    style={{
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
                      e.currentTarget.style.transform = 'translateY(-5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={() => navigate(`/student/courses/${course.courseId}`)}
                  >
                    <div className="card-body">
                      <h5 className="card-title">{course.title}</h5>
                      <p className="card-text">{course.description}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
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
