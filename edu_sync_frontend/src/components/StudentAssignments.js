import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { api } from '../services/api';

export default function StudentAssignments() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [questionFeedback, setQuestionFeedback] = useState({});
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setStudentId(decoded.sub);
      } catch (err) {
        setError('Error decoding token.');
        setLoading(false);
      }
    } else {
      setError('No authentication token found.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (studentId) {
      fetchCourses();
    }
  }, [studentId]);

  useEffect(() => {
    if (courses.length > 0) {
      courses.forEach(course => {
        fetchAssignments(course.courseId);
      });
    }
  }, [courses]);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
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

  const fetchAssignments = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/api/AssessmentModels/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setAssignments(prevAssignments => ({
        ...prevAssignments,
        [courseId]: response.data || []
      }));
    } catch (err) {
      console.error('Failed to load assignments:', err);
      setAssignments(prevAssignments => ({
        ...prevAssignments,
        [courseId]: []
      }));
    }
  };

  const startQuiz = (assignment) => {
    try {
      const parsedQuestions = JSON.parse(assignment.questions);
      setSelectedQuiz({
        ...assignment,
        questions: parsedQuestions
      });
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
      setTotalPoints(0);
    } catch (error) {
      console.error('Error parsing quiz questions:', error);
      alert('Error loading quiz. Please try again.');
    }
  };

  const handleAnswerSelect = (questionIndex, selectedOption) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedOption
    }));
  };

  const calculateScore = () => {
    let totalScore = 0;
    let maxPossibleScore = 0;

    selectedQuiz.questions.forEach((question, index) => {
      maxPossibleScore += parseInt(question.points);
      if (quizAnswers[index] === question.correctAnswer) {
        totalScore += parseInt(question.points);
      }
    });

    return {
      score: totalScore,
      maxScore: maxPossibleScore,
      percentage: (totalScore / maxPossibleScore) * 100
    };
  };

  const submitQuiz = async () => {
    const result = calculateScore();
    setQuizScore(result);
    setQuizSubmitted(true);

    try {
      const token = localStorage.getItem('token');
      const data = {
        resultId: crypto.randomUUID(),
        assessmentId: selectedQuiz.assessmentId,
        userId: studentId,
        score: result.score,
        attemptDate: new Date().toISOString()
      };

      await api.post('/api/ResultModels', data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Quiz submitted successfully!');
    } catch (err) {
      console.error('Error submitting quiz:', err);
      alert('Error submitting quiz. Please try again.');
    }
  };

  const handleBackToList = () => {
    setSelectedQuiz(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setTotalPoints(0);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-black-red-gradient mb-4">
        <div className="container">
          <a className="navbar-brand" href="#">EduSync</a>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container flex-grow-1">
        <style>
          {`
            .course-heading {
              margin-bottom: 2rem;
              color: black;
            }
            .quiz-card {
              transition: transform 0.2s;
              border: 1px solid black;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .quiz-card:hover {
              transform: translateY(-5px);
            }
            .option-item {
              cursor: pointer;
              padding: 10px;
              margin: 5px 0;
              border: 1px solid black;
              border-radius: 4px;
              transition: background-color 0.2s;
            }
            .option-item:hover {
              background-color: #f8f9fa;
            }
            .option-item.selected {
              background-color: #e9ecef;
              border-color: black !important;
            }
            .option-item.correct {
              background-color: #d4edda;
              border-color: #28a745;
            }
            .option-item.incorrect {
              background-color: #f8d7da;
              border-color: #dc3545;
            }
            .feedback-message {
              margin-top: 10px;
              padding: 10px;
              border-radius: 4px;
            }
            .feedback-correct {
              background-color: #d4edda;
              color: #155724;
            }
            .feedback-incorrect {
              background-color: #f8d7da;
              color: #721c24;
            }
            .points-display {
              font-size: 0.9rem;
              color: black;
              margin-top: 5px;
            }
            .total-points {
              position: static;
              margin-top: 20px;
              font-weight: bold;
              text-align: center;
              color: black;
            }
            .submit-warning {
              background-color: #fff3cd;
              color: #856404;
              padding: 10px;
              border-radius: 4px;
              margin-bottom: 20px;
              text-align: center;
            }
          `}
        </style>

        {selectedQuiz ? (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2>{selectedQuiz.title}</h2>
              <button className="btn btn-secondary bg-black-red-gradient text-white" onClick={handleBackToList}>
                Back to Courses
              </button>
            </div>

            {!quizSubmitted ? (
              <div className="quiz-container">
                {Object.keys(quizAnswers).length < selectedQuiz.questions.length && (
                  <div className="submit-warning">
                    Please answer all questions before submitting
                  </div>
                )}
                {selectedQuiz.questions.map((question, index) => (
                  <div key={index} className="card mb-4">
                    <div className="card-header">
                      <h5 className="mb-0">Question {index + 1} ({question.points} points)</h5>
                    </div>
                    <div className="card-body">
                      <p className="card-text">{question.questionText}</p>
                      <div className="options-list">
                        <div className="row">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`col-md-6 option-item ${quizAnswers[index] === option ? 'selected' : ''}`}
                              onClick={() => handleAnswerSelect(index, option)}
                            >
                              {String.fromCharCode(65 + optIndex)}. {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  className="btn btn-lg w-100 bg-black-red-gradient text-white"
                  onClick={submitQuiz}
                  disabled={Object.keys(quizAnswers).length !== selectedQuiz.questions.length}
                >
                  Submit Quiz
                </button>
              </div>
            ) : (
              <div className="quiz-results">
                <div className="card mb-4">
                  <div className="card-body text-center">
                    <h3>Quiz Results</h3>
                    <p className="display-4 mb-3">{quizScore.percentage.toFixed(1)}%</p>
                    <p>Score: {quizScore.score} out of {quizScore.maxScore}</p>
                  </div>
                </div>

                {selectedQuiz.questions.map((question, index) => (
                  <div key={index} className="card mb-4">
                    <div className="card-header">
                      <h5 className="mb-0">Question {index + 1} ({question.points} points)</h5>
                    </div>
                    <div className="card-body">
                      <p className="card-text">{question.questionText}</p>
                      <div className="options-list">
                        <div className="row">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`col-md-6 option-item ${
                                option === question.correctAnswer
                                  ? 'correct'
                                  : quizAnswers[index] === option
                                  ? 'incorrect'
                                  : ''
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}. {option}
                              {option === question.correctAnswer && ' ✓'}
                              {quizAnswers[index] === option && option !== question.correctAnswer && ' ✗'}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={`feedback-message ${
                        quizAnswers[index] === question.correctAnswer ? 'feedback-correct' : 'feedback-incorrect'
                      }`}>
                        {quizAnswers[index] === question.correctAnswer ? (
                          <div>
                            <strong>Correct!</strong>
                            <div className="points-display">
                              You earned {question.points} points
                            </div>
                          </div>
                        ) : (
                          <div>
                            <strong>Incorrect.</strong> The correct answer is: {question.correctAnswer}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <h2 className="course-heading">Available Quizzes</h2>
            {loading ? (
              <div>Loading courses...</div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : (
              <div className="row">
                {courses.length === 0 ? (
                  <div>No courses found.</div>
                ) : (
                  courses.map((course) => (
                    <div className="col-md-4 mb-4" key={course.courseId}>
                      <div className="card h-100 shadow-sm">
                        <div className="card-body">
                          <h5 className="card-title">{course.title}</h5>
                          <p className="card-text">{course.description}</p>
                          {assignments[course.courseId] && assignments[course.courseId].length > 0 ? (
                            <div className="mt-3">
                              <h6>Available Quizzes:</h6>
                              {assignments[course.courseId].map((assignment) => (
                                <div key={assignment.assessmentId} className="card quiz-card mb-2">
                                  <div className="card-body">
                                    <h6 className="card-title">{assignment.title}</h6>
                                    <button
                                      className="btn btn-lg w-100 bg-black-red-gradient"
                                      onClick={() => startQuiz(assignment)}
                                    >
                                      Take Quiz
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted">No quizzes available for this course.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
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
