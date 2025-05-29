import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export default function StudentGrades() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [quizDetails, setQuizDetails] = useState({});
  const [overallStatus, setOverallStatus] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token in StudentGrades:', decoded);
        const studentIdFromToken = decoded.sub;
        if (studentIdFromToken) {
          setStudentId(studentIdFromToken);
          console.log('Student ID from token in StudentGrades:', studentIdFromToken);
        } else {
          console.error('Student ID not found in token payload (sub claim missing) in StudentGrades:', decoded);
          setError('User ID not found in authentication token.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error decoding token in StudentGrades:', err);
        setError('Error decoding token.');
        setLoading(false);
      }
    } else {
      console.error('No authentication token found in StudentGrades.');
      setError('No authentication token found.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (studentId) {
      fetchResults();
    }
  }, [studentId]);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://localhost:7120/api/ResultModels/user/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Sort results by attemptDate before setting state
      const sortedResults = response.data.sort((a, b) => new Date(b.attemptDate) - new Date(a.attemptDate));
      
      setResults(sortedResults);
      
      // Fetch quiz details for each result
      const quizPromises = response.data.map(result => 
        axios.get(`https://localhost:7120/api/AssessmentModels/${result.assessmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      const quizResponses = await Promise.all(quizPromises);
      const quizDetailsMap = {};
      quizResponses.forEach(response => {
        const quiz = response.data;
        quizDetailsMap[quiz.assessmentId] = quiz;
      });
      
      setQuizDetails(quizDetailsMap);
      
      // Calculate overall status
      const totalScore = response.data.reduce((sum, result) => sum + result.score, 0);
      const totalMaxScore = response.data.reduce((sum, result) => {
        const quiz = quizDetailsMap[result.assessmentId];
        return sum + (quiz ? parseInt(quiz.maxScore) : 0);
      }, 0);
      
      const overallPercentage = (totalScore / totalMaxScore) * 100;
      setOverallStatus(overallPercentage >= 36 ? 'passed' : 'failed');
      
    } catch (err) {
      console.error('Error fetching results:', err);
      setError('Failed to load results.');
    }
    setLoading(false);
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
            .status-banner {
              padding: 20px;
              margin-bottom: 30px;
              border-radius: 8px;
              text-align: center;
              animation: fadeIn 0.5s ease-in;
            }
            .status-banner.passed {
              background-color: #ffffff;
            }
            .status-banner.failed {
              background-color: #f8d7da;
              color: #721c24;
            }
            .grade-card {
              transition: transform 0.2s;
              margin-bottom: 20px;
            }
            .grade-card:hover {
              transform: translateY(-5px);
            }
            .progress {
              height: 10px;
            }
            .progress-bar {
              transition: width 1s ease-in-out;
            }
            .grade-header {
              margin-bottom: 2rem;
              color: black;
            }
            .emoji {
              font-size: 2rem;
              margin-bottom: 10px;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .grade-details {
              font-size: 0.9rem;
              color: black;
            }
            .attempt-date {
              font-size: 0.8rem;
              color: black;
            }
          `}
        </style>

        {loading ? (
          <div className="text-center">
            <div className="spinner-border text-dark" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <>
            <div className={`status-banner ${overallStatus === 'passed' ? 'border-black-force bg-black-red-gradient text-white' : 'bg-danger text-white'}`}>
              <div className="emoji">
                {overallStatus === 'passed' ? '🎉' : '💪'}
              </div>
              <h2>
                {overallStatus === 'passed' 
                  ? 'Hurray! You\'ve Passed Overall!' 
                  : 'Don\'t Worry! Keep Learning!'}
              </h2>
              <p className="mb-0">
                {overallStatus === 'passed'
                  ? 'Great job on your quizzes! Keep up the good work!'
                  : 'Focus on areas that need improvement. You can do it!'}
              </p>
            </div>

            <h2 className="grade-header text-black-force">Your Quiz Results</h2>
            
            <div className="row">
              {results.map((result) => {
                const quiz = quizDetails[result.assessmentId];
                if (!quiz) return null;

                const percentage = (result.score / parseInt(quiz.maxScore)) * 100;
                const status = percentage >= 36 ? 'passed' : 'failed';

                return (
                  <div key={result.resultId} className="col-md-6">
                    <div className={`card grade-card border-black-force ${status === 'passed' ? 'text-black-force' : 'text-black-force'}`}>
                      <div className="card-body">
                        <h5 className="card-title text-black-force">{quiz.title}</h5>
                        <div className="grade-details mb-3 text-black-force">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span>Score: {result.score} / {quiz.maxScore}</span>
                            <span className={`badge ${status === 'passed' ? 'bg-black-red-gradient text-white' : 'bg-danger text-white'}`}>
                              {status.toUpperCase()}
                            </span>
                          </div>
                          <div className="progress mb-2">
                            <div 
                              className={`progress-bar ${status === 'passed' ? 'bg-black-red-gradient text-white' : 'bg-danger text-white'}`}
                              role="progressbar"
                              style={{ width: `${percentage}%` }}
                              aria-valuenow={percentage}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            />
                          </div>
                          <div className="text-center text-black-force">
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                        <div className="attempt-date text-black-force">
                          Attempted on: {formatDate(result.attemptDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {results.length === 0 && (
              <div className="text-center mt-5 text-black-force">
                <h3>No Quiz Results Yet</h3>
                <p className="text-muted text-black-force">Take some quizzes to see your results here!</p>
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
