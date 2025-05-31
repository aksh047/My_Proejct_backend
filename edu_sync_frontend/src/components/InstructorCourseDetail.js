import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { api } from '../services/api';

export default function InstructorCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [instructorId, setInstructorId] = useState(null); // Although we fetch instructor's courses, we might not strictly need this here unless we add instructor-specific logic.

  console.log('InstructorCourseDetail: Component rendered, courseId from params:', courseId);

  // Get instructor ID from token (optional, depending on future needs)
  useEffect(() => {
    console.log('InstructorCourseDetail: useEffect for token decoding triggered.');
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setInstructorId(decoded.userId);
         console.log('InstructorCourseDetail: Token decoded, instructorId:', decoded.userId);
      } catch (err) {
        console.error('InstructorCourseDetail: Error decoding token:', err);
        // setError('Error decoding token.'); // Decide if this is a critical error here
        // setLoading(false); // Decide if this stops loading
      }
    } else {
        console.log('InstructorCourseDetail: No token found.');
    }
  }, []);

  // Fetch course details and assessments
  useEffect(() => {
    console.log('InstructorCourseDetail: useEffect for data fetching triggered.', { courseId, instructorId });
    if (!courseId) {
        console.log('InstructorCourseDetail: No courseId, stopping fetch.');
        setLoading(false);
        setError('Course ID is missing.');
        return; 
    }

    const fetchDetails = async () => {
      console.log('InstructorCourseDetail: fetchDetails started.');
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
             console.log('InstructorCourseDetail: fetchDetails - No token found.');
             setError('No authentication token found.');
             setLoading(false);
             return;
        }
        console.log('InstructorCourseDetail: fetchDetails - Token found.');

        // Fetch course details
        console.log('InstructorCourseDetail: fetchDetails - Fetching course details for courseId:', courseId);
        const courseResponse = await api.get(`/api/CourseModels/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('InstructorCourseDetail: fetchDetails - Course API response:', courseResponse);

        if (courseResponse.status === 200 && courseResponse.data) {
            setCourse(courseResponse.data);
             console.log('InstructorCourseDetail: fetchDetails - Course details set:', courseResponse.data);
        } else {
             console.log('InstructorCourseDetail: fetchDetails - Course not found or error status:', courseResponse.status);
             setError('Course details not found.');
             setCourse(null);
        }

        // Fetch assignments (assessments) for the course
        console.log('InstructorCourseDetail: fetchDetails - Fetching assignments for courseId:', courseId);
        const assignmentsResponse = await api.get(`/api/AssessmentModels/course/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
         console.log('InstructorCourseDetail: fetchDetails - Assignments API response:', assignmentsResponse);

        if (assignmentsResponse.status === 200 && Array.isArray(assignmentsResponse.data)){
             setAssessments(assignmentsResponse.data);
             console.log('InstructorCourseDetail: fetchDetails - Assessments set:', assignmentsResponse.data.length);
        } else {
             console.log('InstructorCourseDetail: fetchDetails - No assignments found or error status:', assignmentsResponse.status);
            setAssessments([]);
        }

      } catch (err) {
        console.error('InstructorCourseDetail: Error during data fetch:', err);
        setError('Failed to load course details or assignments. Please try again.');
        setCourse(null);
        setAssessments([]);
      } finally {
        setLoading(false);
        console.log('InstructorCourseDetail: fetchDetails finished, loading set to false.');
      }
    };

    fetchDetails();

  }, [courseId]); // Re-run when courseId changes

  // Function to render MediaUrl based on type (link or file)
  const renderMedia = (mediaUrl) => {
      console.log('InstructorCourseDetail: renderMedia called with:', mediaUrl);
      if (!mediaUrl) return <p>No media available.</p>;

      // Always treat as a general URL and show the link directly
      console.log('InstructorCourseDetail: renderMedia - Rendering as general URL:', mediaUrl);
      return (
          <p><strong>Course Media:</strong> <a href={mediaUrl} target="_blank" rel="noopener noreferrer">{mediaUrl}</a></p>
      );
  };


  // --- Conditional Rendering based on state ---
  console.log('InstructorCourseDetail: Rendering based on state:', { loading, error, course });
  if (loading) {
    return (
        <div className="container mt-4 text-center">
             <div className="spinner-border text-primary" role="status">
               <span className="visually-hidden">Loading...</span>
             </div>
            <p className="mt-2">Loading course details...</p>
        </div>
    );
  }

  if (error) {
    return <div className="container mt-4"><div className="alert alert-danger">{error}</div></div>;
  }

   // If not loading, no error, but no course data
  if (!course) {
       console.log('InstructorCourseDetail: No course data available, showing warning.');
      return <div className="container mt-4 text-center"><p className="alert alert-warning">Course details could not be loaded or found.</p></div>;
  }

  // --- Render Course Details and Assessments (if course data is available) ---
   console.log('InstructorCourseDetail: Rendering course details and assessments.');
  return (
    <div className="d-flex flex-column min-vh-100">
      <nav className="navbar navbar-expand-lg navbar-dark bg-black-red-gradient mb-4">
        <div className="container">
          <span className="navbar-brand">Course Details</span>
          <button className="btn btn-outline-light" onClick={() => navigate('/instructor/courses')}>
            Back to Courses
          </button>
        </div>
      </nav>

      <div className="flex-grow-1">
        <div className="container mt-4">
          <style>
            {`
              .course-detail-container {
                background-color: #ffffff;
                border-radius: 15px;
                padding: 25px;
                margin-bottom: 30px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              }
              .assessment-card {
                background-color: #ffffff;
                border-radius: 10px;
                padding: 15px;
                margin-bottom: 15px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                border: 1px solid #e9ecef;
              }
               .assessment-card:hover {
                transform: translateY(-3px);
                transition: transform 0.2s ease-in-out;
               }
            `}
          </style>

          <div className="course-detail-container border-black-force">
            <h2 className="text-black-force">{course.title}</h2>
            <p className="text-black-force">{course.description}</p>
            {renderMedia(course.mediaUrl)} {/* Use the helper function to render media */}
            <p className="text-black-force"><strong>Number of Quizzes:</strong> {assessments.length}</p>
          </div>

          <h3 className="text-black-force">Quizzes/Assessments</h3>
          {assessments.length === 0 ? (
            <p className="text-muted text-black-force">No quizzes found for this course.</p>
          ) : (
            <div>
              {assessments.map(assessment => (
                <div key={assessment.assessmentId} className="assessment-card border-black-force">
                  <h5 className="text-black-force">{assessment.title}</h5>
                  {/* Add more assessment details or a link/button to view assessment details if needed */}
                </div>
              ))}
            </div>
          )}
        </div>
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