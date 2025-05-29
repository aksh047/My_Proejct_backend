import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export default function StudentCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentId, setStudentId] = useState(null);

  // Get student ID from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token in StudentCourseDetail:', decoded);
        
        // Try to get user ID from different possible claim names
        // Based on console output, 'sub' contains the User ID
        const userIdFromToken = decoded.sub; // Use the 'sub' claim
        // Removed: decoded.userId || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

        if (userIdFromToken) {
          setStudentId(userIdFromToken);
          console.log('Student ID from token:', userIdFromToken);
        } else {
          console.error('User ID not found in token payload (sub claim missing):', decoded);
          setError('User ID not found in authentication token.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error decoding token in StudentCourseDetail:', err);
        setError('Error decoding token.');
        setLoading(false);
      }
    } else {
      console.error('No authentication token found in StudentCourseDetail.');
      setError('No authentication token found.');
      setLoading(false);
    }
  }, []);

  // Fetch course details and assignments
  useEffect(() => {
    console.log('useEffect triggered with courseId:', courseId, 'studentId:', studentId);
    // Only fetch if we have a courseId and studentId (from token)
    if (!courseId || !studentId) {
        console.log('Skipping fetch: courseId or studentId is missing.');
        // If missing data after initial load, maybe there's an issue, but stop loading
        if (loading) { // Only set loading false if it's currently true
           setLoading(false);
        }
        return; 
    }

    const fetchDetails = async () => {
      console.log('Fetching course details and assignments...');
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) { 
             console.error('Token disappeared during fetch attempt.');
             setError('Authentication token missing.');
             setLoading(false);
             return;
        }
        console.log('Fetching course details for courseId:', courseId);
        // Fetch course details
        const courseResponse = await axios.get(`https://localhost:7120/api/CourseModels/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        console.log('Course details API response status:', courseResponse.status);
        console.log('Course details API response data:', courseResponse.data);

        if (courseResponse.status === 200 && courseResponse.data) {
            setCourse(courseResponse.data);
            console.log('Course state updated:', courseResponse.data);
        } else {
             console.warn('Course details not found or unexpected status:', courseResponse.status);
             setError('Course details not found.');
             setCourse(null);
        }
        
        console.log('Fetching assignments for courseId:', courseId);
        // Fetch assignments for the course
        const assignmentsResponse = await axios.get(`https://localhost:7120/api/AssessmentModels/course/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        console.log('Assignments API response status:', assignmentsResponse.status);
        console.log('Assignments API response data:', assignmentsResponse.data);

        if (assignmentsResponse.status === 200 && Array.isArray(assignmentsResponse.data)){
             setAssignments(assignmentsResponse.data);
             console.log('Assignments state updated:', assignmentsResponse.data);
        } else {
            console.warn('Assignments not found or unexpected status:', assignmentsResponse.status);
            setAssignments([]);
        }

      } catch (err) {
        console.error('Error during data fetch in StudentCourseDetail:', err);
        console.error('Fetch error response:', err.response?.data);
        setError('Failed to load course details or assignments. Please try again.');
        setCourse(null); // Ensure course is null on error
        setAssignments([]); // Ensure assignments is empty on error
      } finally {
        console.log('Fetch attempt finished.');
        setLoading(false);
      }
    };

    fetchDetails();

  }, [courseId, studentId]); // Re-run when courseId or studentId changes


  // --- Conditional Rendering based on state ---
  if (loading) {
    console.log('Rendering: Loading state');
    return (
        <div className="container mt-4 text-center">
             <div className="spinner-border text-dark" role="status">
               <span className="visually-hidden">Loading...</span>
             </div>
            <p className="mt-2">Loading course details...</p>
        </div>
    );
  }

  if (error) {
    console.log('Rendering: Error state');
    return <div className="container mt-4"><div className="alert alert-danger">{error}</div></div>;
  }

   // If not loading, no error, but no course data - likely API returned no data or error was caught
  if (!course) {
      console.log('Rendering: No course data state');
      return <div className="container mt-4 text-center"><p className="alert alert-warning">Course details could not be loaded or found.</p></div>;
  }

  console.log('Rendering: Course data available', course);
  // --- Render Course Details and Assignments (if course data is available) ---
  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-black-red-gradient">
        <div className="container">
          <span className="navbar-brand">About Course</span>
          <button className="btn btn-outline-light" onClick={() => navigate(-1)}>
            Back to Courses
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mt-4">
        <style>
          {`
            .course-detail-card {
              background-color: #ffffff;
              border-radius: 15px;
              padding: 25px;
              margin-bottom: 30px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .assignment-card {
              background-color: #ffffff;
              border-radius: 10px;
              padding: 15px;
              margin-bottom: 15px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.05);
              border: 1px solid #e9ecef;
            }
             .assignment-card:hover {
              transform: translateY(-3px);
              transition: transform 0.2s ease-in-out;
             }
          `}
        </style>
        
        <div className="course-detail-card border-black-force">
          <h2 className="text-black-force">{course.title}</h2>
          <p className="text-black-force">{course.description}</p>
          {course.mediaUrl && (
            <div className="mt-3">
              <h5 className="text-black-force">Course Materials</h5>
              <a 
                href={course.mediaUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary bg-black-red-gradient text-white"
                download
              >
                <i className="fas fa-download me-2"></i>
                Download Course Material
              </a>
            </div>
          )}
          <p className="text-black-force mt-3"><strong>Assignments Included:</strong> {assignments.length}</p>
        </div>

        <h3 className="text-black-force">Assignments</h3>
        {assignments.length === 0 ? (
          <p className="text-muted text-black-force">No assignments found for this course.</p>
        ) : (
          <div>
            {assignments.map(assignment => (
              <div key={assignment.assessmentId} className="assignment-card border-black-force">
                <h5 className="text-black-force">{assignment.title}</h5>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-dark text-white text-center py-3 mt-auto">
        <div className="container">
          <p className="mb-1">EduSync</p>
          <p className="mb-0">© 2023 All rights reserved by EduSync</p>
        </div>
      </footer>
    </div>
  );
} 