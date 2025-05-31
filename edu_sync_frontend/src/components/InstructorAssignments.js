import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { api } from '../services/api';

export default function InstructorAssignments() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  const [instructorId, setInstructorId] = useState(null);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    maxScore: '',
    questions: [{ questionText: '', options: ['', '', '', ''], correctAnswer: '', points: '' }]
  });
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [viewingAssignment, setViewingAssignment] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token in InstructorAssignments:', decoded);
        // Use the 'sub' claim for instructor ID
        const instructorIdFromToken = decoded.sub;
        if (instructorIdFromToken) {
          setInstructorId(instructorIdFromToken);
          console.log('Instructor ID from token in InstructorAssignments:', instructorIdFromToken);
        } else {
          console.error('Instructor ID not found in token payload (sub claim missing) in InstructorAssignments:', decoded);
          setError('User ID not found in authentication token.');
          setLoading(false); // Stop loading if instructor ID cannot be found
        }
      } catch (err) {
        console.error('Error decoding token in InstructorAssignments:', err);
        setError('Error decoding token.');
        setLoading(false); // Stop loading on token decoding error
      }
    } else {
      console.error('No authentication token found in InstructorAssignments.');
      setError('No authentication token found.');
      setLoading(false); // Stop loading if no token is found
    }
  }, []);

  useEffect(() => {
    console.log('useEffect triggered for fetching courses/assignments, instructorId:', instructorId);
    if (instructorId) {
      console.log('Instructor ID available, fetching courses...');
      fetchCourses(); // This will then trigger fetchAssignments
    } else {
        console.log('Instructor ID not available, skipping fetch.');
        // Note: setLoading(false) for this case is handled in the first useEffect
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instructorId]);

  useEffect(() => {
    if (courses.length > 0) {
      courses.forEach(course => {
        fetchAssignments(course.courseId);
      });
    }
  }, [courses]);

  const fetchCourses = async () => {
    console.log('Starting fetchCourses in InstructorAssignments...');
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!instructorId || !token) {
        console.log('fetchCourses skipped: Instructor ID or token missing.');
        setLoading(false);
        setError('Instructor ID or token missing.');
        return;
      }
      // Assuming you want all courses for the instructor
      const apiUrl = `/api/CourseModels/instructor/${instructorId}`;
      console.log('Fetching courses from URL:', apiUrl);
      const response = await api.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Course fetch API response status:', response.status);
      console.log('Course fetch API response data:', response.data);

      if (response.status === 200 && Array.isArray(response.data)) {
         setCourses(response.data);
         console.log('Courses state updated:', response.data);
         // Fetch assignments only after courses are successfully fetched
         if (response.data.length > 0) {
            console.log('Courses found, fetching assignments for each course...');
            response.data.forEach(course => {
              fetchAssignments(course.courseId);
            });
         } else {
            console.log('No courses found, skipping assignment fetch.');
            setAssignments({}); // Ensure assignments is empty
         }
      } else {
         console.warn('Course fetch returned non-array data or unexpected status:', response.status, response.data);
         setCourses([]); // Ensure courses is an empty array
         setAssignments({}); // Ensure assignments is empty
      }

    } catch (err) {
      console.error('Error fetching courses in InstructorAssignments:', err);
      console.error('Error response data:', err.response?.data);
      setError('Failed to load courses.');
      setCourses([]); // Ensure courses is empty on error
      setAssignments({}); // Ensure assignments is empty on error
    } finally {
       // Note: The overall loading state should reflect both courses and assignments fetching.
       // For simplicity, we set loading false after the initial course fetch.
       // A more robust approach would track loading for assignments individually.
       console.log('FetchCourses finished.');
       setLoading(false);
    }
  };

  const fetchAssignments = async (courseId) => {
    console.log('Starting fetchAssignments for courseId:', courseId);
    try {
      const token = localStorage.getItem('token');
       if (!token) {
         console.error('fetchAssignments skipped: Token missing.');
         return;
       }
      const apiUrl = `/api/AssessmentModels/course/${courseId}`;
      console.log('Fetching assignments from URL:', apiUrl);
      const response = await api.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(`Assignments API response status for course ${courseId}:`, response.status);
      console.log(`Assignments API response data for course ${courseId}:`, response.data);
      
      // Always set assignments, even if empty array
      if (response.status === 200 && Array.isArray(response.data)) {
           setAssignments(prevAssignments => ({
             ...prevAssignments,
             [courseId]: response.data
           }));
           console.log(`Assignments state updated for course ${courseId}:`, response.data);
      } else {
           console.warn(`Assignment fetch for course ${courseId} returned non-array data or unexpected status:`, response.status, response.data);
           setAssignments(prevAssignments => ({
             ...prevAssignments,
             [courseId]: [] // Ensure empty array on non-array response
           }));
      }

    } catch (err) {
      console.error(`Error fetching assignments for course ${courseId}:`, err);
       console.error('Assignment fetch error response:', err.response?.data);
      // Set empty array for this course on error
      setAssignments(prevAssignments => ({
        ...prevAssignments,
        [courseId]: []
      }));
    }
     console.log('FetchAssignments finished for courseId:', courseId);
  };

  const toggleDropdown = (courseId) => {
    setDropdownOpenId(dropdownOpenId === courseId ? null : courseId);
  };

  const handleAddAssignment = (courseId) => {
    setSelectedCourseId(courseId);
    setEditingAssignment(null);
    // Reset form data to initial state
    setAssignmentData({
      title: '',
      maxScore: '',
      questions: [{ questionText: '', options: ['', '', '', ''], correctAnswer: '', points: '' }]
    });
    setShowAssignmentForm(true);
    setDropdownOpenId(null);
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setSelectedCourseId(assignment.courseId);
    setAssignmentData({
      title: assignment.title,
      maxScore: assignment.maxScore,
      questions: JSON.parse(assignment.questions)
    });
    setShowAssignmentForm(true);
    setDropdownOpenId(null);
  };

  const handleAssignmentInputChange = (e) => {
    setAssignmentData({ ...assignmentData, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...assignmentData.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setAssignmentData({ ...assignmentData, questions: updatedQuestions });
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...assignmentData.questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setAssignmentData({ ...assignmentData, questions: updatedQuestions });
  };

  const addQuestion = () => {
    setAssignmentData({
      ...assignmentData,
      questions: [...assignmentData.questions, { questionText: '', options: ['', '', '', ''], correctAnswer: '', points: '' }]
    });
  };

  const deleteQuestion = (index) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = assignmentData.questions.filter((_, i) => i !== index);
      setAssignmentData({ ...assignmentData, questions: updatedQuestions });
    }
  };

  const handleSaveAssignment = async () => {
    if (!selectedCourseId) {
      alert('Please select a course first.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const data = {
        assessmentId: editingAssignment ? editingAssignment.assessmentId : crypto.randomUUID(),
        courseId: selectedCourseId,
        title: assignmentData.title,
        maxScore: assignmentData.maxScore,
        questions: JSON.stringify(assignmentData.questions)
      };
      if (editingAssignment) {
        await api.put(`/api/AssessmentModels/${editingAssignment.assessmentId}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await api.post('/api/AssessmentModels', data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      alert('Assignment saved successfully!');
      setShowAssignmentForm(false);
      setAssignmentData({
        title: '',
        maxScore: '',
        questions: [{ questionText: '', options: ['', '', '', ''], correctAnswer: '', points: '' }]
      });
      setEditingAssignment(null);
      setDropdownOpenId(null);
      fetchAssignments(selectedCourseId);
    } catch (err) {
      alert('Failed to save assignment.');
      console.error('Error saving assignment:', err);
    }
  };

  const handleViewAssignment = (assignment) => {
    console.log('Viewing assignment:', assignment);
    try {
      // Parse questions and ensure options is an array
      const parsedAssignment = {
        ...assignment,
        questions: JSON.parse(assignment.questions).map(q => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : []
        }))
      };
      setViewingAssignment(parsedAssignment); // Set the single parsed assignment
      setDropdownOpenId(null); // Close dropdown
    } catch (error) {
      console.error('Error parsing assignment questions for viewing:', error);
      alert('Error loading assignment details. Please try again.');
    }
  };

  const handleBackToList = () => {
    setViewingAssignment(null);
  };

  const handleDeleteAssignment = async (assessmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return; // User cancelled deletion
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token missing. Please log in again.');
        return;
      }
      // Assuming the backend endpoint for deleting an assessment is /api/AssessmentModels/{assessmentId}
      const apiUrl = `/api/AssessmentModels/${assessmentId}`;
      console.log('Deleting assignment from URL:', apiUrl);
      
      await api.delete(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Assignment deleted successfully!');
      
      // Update state to remove the deleted assignment
      setAssignments(prevAssignments => {
        const newAssignments = { ...prevAssignments };
        // Find the course this assignment belongs to and remove it
        for (const courseId in newAssignments) {
          newAssignments[courseId] = newAssignments[courseId].filter(
            assignment => assignment.assessmentId !== assessmentId
          );
        }
        return newAssignments;
      });

      setDropdownOpenId(null); // Close dropdown after action
      
    } catch (err) {
      console.error('Error deleting assignment:', err);
      alert('Failed to delete assignment. ' + (err.response?.data || err.message));
    }
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
            .course-card-header {
              background-color: #ffffff; /* White background */
              border-bottom: 1px solid black; /* Black border bottom */
              padding: 15px;
              cursor: pointer;
              border-top-left-radius: 8px;
              border-top-right-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              color: black; /* Ensure text is black */
              font-weight: bold;
            }
            .course-card-body {
              border: 1px solid black; /* Black border */
              border-top: none; /* No double border */
              border-bottom-left-radius: 8px;
              border-bottom-right-radius: 8px;
              padding: 20px;
              background-color: #ffffff; /* White background */
            }
            .assignment-item {
              padding: 10px 0;
              border-bottom: 1px dashed #ccc; /* Keep light dashed border */
              display: flex;
              justify-content: space-between;
              align-items: center;
              color: black; /* Ensure text is black */
            }
            .assignment-item:last-child {
              border-bottom: none;
            }
            .assignment-actions .btn {
              margin-left: 5px; /* Space between buttons */
            }
             .assignment-form-card {
              background-color: #ffffff;
              border: 1px solid black; /* Black border */
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
            }
             .form-label {
               color: black; /* Ensure form labels are black */
             }
             .form-control,
             .form-select {
               border-color: black; /* Black border for inputs and selects */
               color: black; /* Ensure input text is black */
             }
             .form-control::placeholder { /* Style placeholder text */
                color: #6c757d; /* Keep placeholder text muted */
             }
            .question-card {
              border: 1px solid black; /* Black border for question cards */
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 15px;
              background-color: #f8f9fa; /* Light grey background for questions */
            }
            .question-card h6 {
               color: black; /* Ensure question text is black */
            }
            .question-card .form-control, 
            .question-card .form-select {
               border-color: #ccc; /* Lighter border for inputs within questions */
            }
            .view-assignment-card {
               background-color: #ffffff;
               border: 1px solid black; /* Black border */
               border-radius: 8px;
               padding: 20px;
               margin-bottom: 20px;
               color: black; /* Ensure text is black */
            }
             .view-assignment-card h3, 
             .view-assignment-card h4, 
             .view-assignment-card p {
               color: black; /* Ensure viewing text is black */
             }
          `}
        </style>

        {loading ? (
          <div className="text-center">
            <div className="spinner-border text-dark" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
             <p className="mt-2 text-black-force">Loading courses and assignments...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : showAssignmentForm ? (
          // Assignment Form
          <div className="assignment-form-card">
            <h2 className="mb-4">{editingAssignment ? 'Edit Assignment' : 'Add New Assignment'}</h2>
            <div className="mb-3">
              <label htmlFor="title" className="form-label">Assignment Title</label>
              <input
                type="text"
                className="form-control"
                id="title"
                name="title"
                value={assignmentData.title}
                onChange={handleAssignmentInputChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="maxScore" className="form-label">Maximum Score</label>
              <input
                type="number"
                className="form-control"
                id="maxScore"
                name="maxScore"
                value={assignmentData.maxScore}
                onChange={handleAssignmentInputChange}
              />
            </div>
            
            <h4 className="mt-4 mb-3">Questions</h4>
            {assignmentData.questions.map((question, qIndex) => (
              <div key={qIndex} className="question-card">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-3">Question {qIndex + 1}</h6>
                  {assignmentData.questions.length > 1 && (
                    <button className="btn btn-danger btn-sm" onClick={() => deleteQuestion(qIndex)}>Delete Question</button>
                  )}
                </div>
                <div className="mb-3">
                  <label htmlFor={`questionText-${qIndex}`} className="form-label">Question Text</label>
                  <input
                    type="text"
                    className="form-control"
                    id={`questionText-${qIndex}`}
                    value={question.questionText}
                    onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                  />
                </div>
                
                <h6 className="mt-3 mb-2">Options</h6>
                <div className="row">
                  {[0, 1, 2, 3].map((oIndex) => (
                    <div key={oIndex} className="col-md-6 mb-2">
                      <label htmlFor={`option-${qIndex}-${oIndex}`} className="form-label">Option {oIndex + 1}</label>
                      <input
                        type="text"
                        className="form-control"
                        id={`option-${qIndex}-${oIndex}`}
                        value={question.options[oIndex]}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="mb-3">
                  <label htmlFor={`correctAnswer-${qIndex}`} className="form-label">Correct Answer</label>
                  <select
                    className="form-select"
                    id={`correctAnswer-${qIndex}`}
                    value={question.correctAnswer}
                    onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                  >
                    <option value="">Select Correct Option</option>
                    {question.options.map((option, optIndex) => (
                       // Only offer non-empty options as correct answers
                      option.trim() !== '' && (
                         <option key={optIndex} value={option}>{option}</option>
                      )
                    ))}
                  </select>
                </div>

                 <div className="mb-3">
                  <label htmlFor={`points-${qIndex}`} className="form-label">Points for this Question</label>
                  <input
                    type="number"
                    className="form-control"
                    id={`points-${qIndex}`}
                    value={question.points}
                    onChange={(e) => handleQuestionChange(qIndex, 'points', e.target.value)}
                  />
                </div>

              </div>
            ))}

            <button className="btn btn-secondary mb-4" onClick={addQuestion}>Add Question</button>
            
            <div className="d-flex justify-content-between">
              <button className="btn btn-primary bg-black-red-gradient text-white" onClick={handleSaveAssignment}>Save Assignment</button>
              <button className="btn btn-secondary" onClick={() => setShowAssignmentForm(false)}>Cancel</button>
            </div>

          </div>
        ) : viewingAssignment ? (
          // Viewing Assignment Details
           <div className="view-assignment-card">
              <h2 className="mb-4">{viewingAssignment.title}</h2>
              <p><strong>Max Score:</strong> {viewingAssignment.maxScore}</p>

              <h4 className="mt-4 mb-3">Questions</h4>
              {viewingAssignment.questions.map((question, qIndex) => (
                 <div key={qIndex} className="question-card">
                    <h6>Question {qIndex + 1}: {question.questionText}</h6>
                    <p><strong>Points:</strong> {question.points}</p>
                    <p><strong>Correct Answer:</strong> {question.correctAnswer}</p>
                    <h6 className="mt-3">Options:</h6>
                    <div className="row">
                       {question.options.map((option, oIndex) => (
                          // Only display non-empty options
                          option.trim() !== '' && (
                            <div key={oIndex} className="col-md-6">
                               <p>{String.fromCharCode(65 + oIndex)}. {option}</p>
                            </div>
                          )
                       ))}
                    </div>
                 </div>
              ))}

               <button className="btn btn-secondary mt-4" onClick={() => setViewingAssignment(null)}>Back to List</button>
           </div>
        ) : (
          // Course List and Assignments
          <>
            <h2 className="mb-4 text-black-force">Your Courses & Assignments</h2>
            {courses.length === 0 ? (
              <div className="alert alert-info text-black-force border-black-force bg-white">No courses found for this instructor.</div>
            ) : (
              <div>
                {courses.map(course => (
                  <div key={course.courseId} className="card mb-3 border-black-force">
                    <div className="course-card-header" onClick={() => toggleDropdown(course.courseId)}>
                      {course.title}
                      <span>{dropdownOpenId === course.courseId ? '▲' : '▼'}</span>
                    </div>
                    {dropdownOpenId === course.courseId && (
                      <div className="course-card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                           <h5 className="mb-0 text-black-force">Assignments</h5>
                           <button className="btn btn-success bg-black-red-gradient text-white" onClick={() => handleAddAssignment(course.courseId)}>Add Assignment</button>
                        </div>
                       
                        {assignments[course.courseId]?.length === 0 ? (
                           <p className="text-muted text-black-force">No assignments for this course.</p>
                        ) : (
                           <ul className="list-unstyled mb-0">
                              {assignments[course.courseId]?.map(assignment => (
                                 <li key={assignment.assessmentId} className="assignment-item">
                                    <span className="text-black-force">{assignment.title}</span>
                                    <div className="assignment-actions">
                                       <button className="btn btn-sm btn-info bg-black-red-gradient text-white me-2" onClick={() => handleViewAssignment(assignment)}>
                                         <i className="fas fa-eye"></i>
                                       </button>
                                       <button className="btn btn-sm btn-primary bg-black-red-gradient text-white me-2" onClick={() => handleEditAssignment(assignment)}>
                                         <i className="fas fa-pen"></i>
                                       </button>
                                       <button className="btn btn-sm btn-danger text-white" onClick={() => handleDeleteAssignment(assignment.assessmentId)}>
                                         <i className="fas fa-trash"></i>
                                       </button>
                                    </div>
                                 </li>
                              ))}
                           </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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