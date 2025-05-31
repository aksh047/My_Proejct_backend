import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { api } from '../services/api';

export default function InstructorStudents() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [assessments, setAssessments] = useState([]); // To store assessments for the selected course
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null); // To store the selected assessment ID
  const [allResults, setAllResults] = useState([]); // To store all results for the selected course
  const [filteredResults, setFilteredResults] = useState([]); // To store results filtered by assessment and student
  const [studentsInAssessment, setStudentsInAssessment] = useState([]); // To store students who took the selected assessment
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true); // Separate loading state for courses
  const [loadingResults, setLoadingResults] = useState(false); // Separate loading state for results
  const [error, setError] = useState(null);
  const [instructorId, setInstructorId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token in InstructorStudents:', decoded);
        // Use the 'sub' claim for instructor ID
        const instructorIdFromToken = decoded.sub;
        
        if (instructorIdFromToken) {
            setInstructorId(instructorIdFromToken);
            console.log('Instructor ID from token in InstructorStudents:', instructorIdFromToken);
        } else {
            console.error('Instructor ID not found in token payload (sub claim missing) in InstructorStudents:', decoded);
            setError('User ID not found in authentication token.');
            setLoadingCourses(false); // Stop loading if instructor ID cannot be found
        }
      } catch (err) {
        console.error('Error decoding token in InstructorStudents:', err);
        setError('Error decoding token.');
        setLoadingCourses(false); // Stop loading on token decoding error
      }
    } else {
      console.error('No authentication token found in InstructorStudents.');
      setError('No authentication token found.');
      setLoadingCourses(false); // Stop loading if no token
    }
  }, []);

  // Fetch instructor's courses
  useEffect(() => {
    console.log('useEffect triggered for fetching instructor courses, instructorId:', instructorId);
    const fetchInstructorCourses = async () => {
      console.log('Starting fetchInstructorCourses...');
      setLoadingCourses(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!instructorId || !token) {
          console.log('fetchInstructorCourses skipped: Instructor ID or token missing.');
          setLoadingCourses(false);
          return;
        }
        const response = await api.get(`/api/CourseModels/instructor/${instructorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Courses fetch API response status:', response.status);
        console.log('Courses fetch API response data:', response.data);

        if (response.status === 200 && Array.isArray(response.data)) {
             setCourses(response.data);
             console.log('Courses state updated:', response.data);
        } else {
            console.warn('Courses fetch returned non-array data or unexpected status:', response.status, response.data);
            setCourses([]); // Ensure courses is an empty array
        }

      } catch (err) {
        console.error('Error fetching courses in InstructorStudents:', err);
        console.error('Error response data:', err.response?.data);
        setError('Failed to load courses.');
        setCourses([]); // Ensure courses is empty on error
      } finally {
        console.log('fetchInstructorCourses finished.');
        setLoadingCourses(false);
      }
    };

    if (instructorId) {
      fetchInstructorCourses();
    } else {
        console.log('Instructor ID not available, skipping fetchInstructorCourses.');
        // Note: setLoadingCourses(false) for this case is handled in the first useEffect
    }

  }, [instructorId]);

  // Fetch all results for the selected course
  useEffect(() => {
    const fetchCourseResults = async () => {
      if (!selectedCourse || !instructorId) {
        setAllResults([]);
        setFilteredResults([]);
        setAssessments([]);
        setSelectedAssessmentId(null);
        setStudentsInAssessment([]);
        setSelectedStudentId(null);
        return;
      }

      setLoadingResults(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await api.get(`/api/ResultModels/course/${selectedCourse.courseId}/instructor`, { headers: { Authorization: `Bearer ${token}` } });

        const results = response.data;

        if (!Array.isArray(results)) {
          throw new Error('Invalid response format from server');
        }
        
        // Sort results by attemptDate before setting state
        const sortedResults = results.sort((a, b) => new Date(b.attemptDate) - new Date(a.attemptDate));

        setAllResults(sortedResults);
        
        // Initially filter by the first assessment if available, or show all if not
        if (results.length > 0) {
            const uniqueAssessmentIds = [...new Set(results.map(r => r.assessmentId))];
            // Fetch assessment details to get titles
            const assessmentDetailsPromises = uniqueAssessmentIds.map(id =>
                 api.get(`/api/AssessmentModels/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            );
             const assessmentDetailsResponses = await Promise.all(assessmentDetailsPromises);
             const assessmentList = assessmentDetailsResponses.map(res => res.data);
             setAssessments(assessmentList);

            const firstAssessmentId = uniqueAssessmentIds[0];
            setSelectedAssessmentId(firstAssessmentId);
            filterResults(results, firstAssessmentId, null); // Filter by first assessment initially
        } else {
            setFilteredResults([]);
            setAssessments([]);
            setSelectedAssessmentId(null);
            setStudentsInAssessment([]);
            setSelectedStudentId(null);
             filterResults([], null, null); // Clear filtered results if no data
        }

      } catch (err) {
        console.error('Error during data fetch:', err);
        setError(err.response?.data?.message || 'Failed to load results. Please try again.');
        setAllResults([]);
        setFilteredResults([]);
        setAssessments([]);
        setSelectedAssessmentId(null);
        setStudentsInAssessment([]);
        setSelectedStudentId(null);
      } finally {
        setLoadingResults(false);
      }
    };

    if (selectedCourse && instructorId) {
      fetchCourseResults();
    }
     // Reset when course selection changes
    if (!selectedCourse) {
        setAllResults([]);
        setFilteredResults([]);
        setAssessments([]);
        setSelectedAssessmentId(null);
        setStudentsInAssessment([]);
        setSelectedStudentId(null);
    }

  }, [selectedCourse, instructorId]);

  // Effect to filter results when selected assessment or student changes
  useEffect(() => {
      filterResults(allResults, selectedAssessmentId, selectedStudentId);
  }, [allResults, selectedAssessmentId, selectedStudentId]);

  const filterResults = (resultsToFilter, assessmentId, studentId) => {
      let tempResults = resultsToFilter;
      if (assessmentId) {
          tempResults = tempResults.filter(r => r.assessmentId === assessmentId);
      }
      if (studentId) {
          tempResults = tempResults.filter(r => r.studentId === studentId);
      }
      setFilteredResults(tempResults);

      // Update students list for the currently selected assessment
      if (assessmentId) {
           const students = {};
            resultsToFilter.filter(r => r.assessmentId === assessmentId).forEach(result => {
              if (result.studentId && !students[result.studentId]) {
                students[result.studentId] = { userId: result.studentId, name: result.studentName };
              }
            });
            setStudentsInAssessment(Object.values(students));
      } else {
           setStudentsInAssessment([]);
      }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculatePercentage = (score, maxScore) => {
      if (maxScore === 0) return 0;
      return (score / maxScore) * 100;
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <nav className="navbar navbar-expand-lg navbar-dark bg-black-red-gradient mb-4">
        <div className="container">
          <a className="navbar-brand" href="#">EduSync</a>
        </div>
      </nav>

      <div className="container flex-grow-1">
        <style>
          {`
            .course-heading {
              margin-bottom: 2rem;
              color: black;
            }
            .selection-card {
              background: white;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 20px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.05);
              border: 1px solid black;
            }
            .result-card {
              background: white;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 20px;
              border: 1px solid black;
            }
            .result-score,
            .result-percentage,
            .attempt-date {
               color: black;
            }
            .progress {
              height: 8px;
              border-radius: 4px;
              background-color: #e9ecef;
            }
            .progress-bar {
              transition: width 1s ease-in-out;
            }
            .quiz-header {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 15px;
              border-left: 4px solid #007bff;
            }
          `}
        </style>

        <h2 className="course-heading text-black-force">Instructor Students & Results</h2>

        {loadingCourses ? (
          <div className="text-center">
            <div className="spinner-border text-dark" role="status">
              <span className="visually-hidden">Loading Courses...</span>
            </div>
             <p className="mt-2 text-black-force">Loading courses...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <>
            <div className="selection-card border-black-force">
              <div className="row g-3">
                <div className="col-md-4">
                  <label htmlFor="courseSelect" className="form-label text-black-force">Select Course</label>
                  <select
                    id="courseSelect"
                    className="form-select border-black-force text-black-force"
                    value={selectedCourse?.courseId || ''}
                    onChange={(e) => {
                      const courseId = e.target.value;
                      const course = courses.find(c => c.courseId === courseId);
                      setSelectedCourse(course);
                      setSelectedAssessmentId(null);
                      setSelectedStudentId(null);
                    }}
                    disabled={courses.length === 0}
                  >
                    <option value="">-- Select a Course --</option>
                    {courses.map(course => (
                      <option key={course.courseId} value={course.courseId}>{course.title}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label htmlFor="assessmentSelect" className="form-label text-black-force">Select Assessment</label>
                  <select
                    id="assessmentSelect"
                    className="form-select border-black-force text-black-force"
                    value={selectedAssessmentId || ''}
                    onChange={(e) => {
                      setSelectedAssessmentId(e.target.value || null);
                      setSelectedStudentId(null);
                    }}
                    disabled={!selectedCourse || assessments.length === 0}
                  >
                    <option value="">-- All Assessments --</option>
                    {assessments.map(assessment => (
                      <option key={assessment.assessmentId} value={assessment.assessmentId}>{assessment.title}</option>
                    ))}
                  </select>
                </div>

                 <div className="col-md-4">
                  <label htmlFor="studentSelect" className="form-label text-black-force">Select Student</label>
                  <select
                    id="studentSelect"
                    className="form-select border-black-force text-black-force"
                    value={selectedStudentId || ''}
                    onChange={(e) => setSelectedStudentId(e.target.value || null)}
                    disabled={!selectedAssessmentId || studentsInAssessment.length === 0}
                  >
                    <option value="">-- All Students --</option>
                    {studentsInAssessment.map(student => (
                      <option key={student.userId} value={student.userId}>{student.name}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {loadingResults ? (
              <div className="text-center mt-4">
                <div className="spinner-border text-dark" role="status">
                  <span className="visually-hidden">Loading Results...</span>
                </div>
                 <p className="mt-2 text-black-force">Loading results...</p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="alert alert-info mt-4 text-black-force border-black-force bg-white">No results found for the selected criteria.</div>
            ) : (
              <div className="results-list mt-4">
                 <h3 className="mb-3 text-black-force">Results</h3>
                {filteredResults.map(result => (
                  <div key={result.resultId} className="card result-card border-black-force text-black-force">
                    <div className="card-body">
                      <h5 className="card-title text-black-force">{result.assessmentTitle}</h5>
                      <p className="card-text"><strong className="text-black-force">Student:</strong> {result.studentName || 'N/A'}</p>
                      <p className="card-text result-score"><strong className="text-black-force">Score:</strong> {result.score} / {result.maxScore}</p>
                       <div className="progress mb-2 border-black-force">
                            <div 
                              className={`progress-bar ${calculatePercentage(result.score, result.maxScore) >= 36 ? 'bg-black-red-gradient text-white' : 'bg-danger text-white'}`}
                              role="progressbar"
                              style={{ width: `${calculatePercentage(result.score, result.maxScore)}%` }}
                              aria-valuenow={calculatePercentage(result.score, result.maxScore)}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            >
                            {calculatePercentage(result.score, result.maxScore).toFixed(1)}%
                            </div>
                          </div>
                      <p className="card-text result-percentage text-center"><strong className="text-black-force">Percentage:</strong> {calculatePercentage(result.score, result.maxScore).toFixed(1)}%</p>
                      <p className="card-text"><strong className="text-black-force">Status:</strong> 
                        <span className={`badge ms-2 ${calculatePercentage(result.score, result.maxScore) >= 36 ? 'bg-black-red-gradient text-white' : 'bg-danger text-white'}`}>
                          {calculatePercentage(result.score, result.maxScore) >= 36 ? 'PASSED' : 'FAILED'}
                        </span>
                      </p>
                      <p className="card-text attempt-date"><strong className="text-black-force">Attempted on:</strong> {formatDate(result.attemptDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Message if no courses available for the instructor */}
            {!loadingCourses && courses.length === 0 && !error && ( 
              <div className="alert alert-info mt-4 text-black-force border-black-force bg-white">No courses found for this instructor.</div>
            )}

          </>
        )}
      </div>

      <footer className="bg-dark text-white text-center py-3">
        <div className="container">
          <p className="mb-1">EduSync</p>
          <p className="mb-0">© 2025 All rights reserved by EduSync</p>
        </div>
      </footer>
    </div>
  );
} 
