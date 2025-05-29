import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

export default function InstructorCourses() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', mediaUrl: '' });
  const [formError, setFormError] = useState('');
  const [instructorId, setInstructorId] = useState(null);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token in InstructorCourses:', decoded);
        // Assuming instructor ID is also in the 'sub' claim
        const instructorIdFromToken = decoded.sub;
        if (instructorIdFromToken) {
            setInstructorId(instructorIdFromToken);
            console.log('Instructor ID from token:', instructorIdFromToken);
        } else {
            console.error('Instructor ID not found in token payload (sub claim missing):', decoded);
        }
      } catch (err) {
        console.error('Error decoding token in InstructorCourses:', err);
      }
    }
  }, []);

  useEffect(() => {
    console.log('useEffect triggered for fetching courses, instructorId:', instructorId);
    if (instructorId) {
      console.log('Instructor ID available, fetching courses...');
      fetchCourses();
    } else {
        console.log('Instructor ID not available, skipping fetch.');
    }
  }, [instructorId]);

  const fetchCourses = async () => {
    console.log('Starting fetchCourses...');
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
      const apiUrl = `https://localhost:7120/api/CourseModels/instructor/${instructorId}`;
      console.log('Fetching courses from URL:', apiUrl);
      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Course fetch API response status:', response.status);
      console.log('Course fetch API response data:', response.data);

      if (response.status === 200 && Array.isArray(response.data)) {
         setCourses(response.data);
         console.log('Courses state updated:', response.data);
      } else {
         console.warn('Course fetch returned non-array data or unexpected status:', response.status, response.data);
         setCourses([]); // Ensure courses is an empty array
      }

    } catch (err) {
      console.error('Error fetching courses:', err);
      console.error('Error response data:', err.response?.data);
      setError('Failed to load courses.');
      setCourses([]); // Ensure courses is empty on error
    }
    console.log('FetchCourses finished.');
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAddOrEditCourse = async (e) => {
    e.preventDefault();
    console.log('handleAddOrEditCourse: Submitting form', formData);
    setFormError('');

    if (!formData.title.trim() || !formData.description.trim()) {
      setFormError('Title and description are required.');
      console.log('handleAddOrEditCourse: Validation failed - missing title or description');
      return;
    }

    if (!instructorId) {
      setFormError('Instructor ID not found. Please log in again.');
      console.log('handleAddOrEditCourse: Validation failed - instructorId missing');
      return;
    }

    const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!guidRegex.test(instructorId)) {
      setFormError('Instructor ID is not a valid GUID.');
      console.log('handleAddOrEditCourse: Validation failed - instructorId not valid GUID', instructorId);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setFormError('Authentication token not found.');
        console.log('handleAddOrEditCourse: Token not found');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('instructorId', instructorId);
      if (selectedFile) {
        formDataToSend.append('file', selectedFile);
      }

      if (editingCourseId) {
        console.log('handleAddOrEditCourse: Editing course', editingCourseId);
        const response = await axios.put(
          `https://localhost:7120/api/CourseModels/${editingCourseId}`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        if (response.status === 200 || response.status === 204) {
          alert('✅ Course updated successfully!');
          console.log('handleAddOrEditCourse: Update successful', response);
        } else {
          console.log('handleAddOrEditCourse: Update failed with status', response.status, response);
          setFormError(`Update failed with status: ${response.status}`);
        }
      } else {
        console.log('handleAddOrEditCourse: Adding new course');
        const response = await axios.post(
          'https://localhost:7120/api/CourseModels',
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        if (response.status === 200 || response.status === 201) {
          alert('✅ Course added successfully!');
          console.log('handleAddOrEditCourse: Add successful', response);
        } else {
          console.log('handleAddOrEditCourse: Add failed with status', response.status, response);
          setFormError(`Add failed with status: ${response.status}`);
        }
      }

      setFormData({ title: '', description: '', mediaUrl: '' });
      setSelectedFile(null);
      setShowForm(false);
      setEditingCourseId(null);
      setDropdownOpenId(null);
      fetchCourses();
    } catch (err) {
      console.error('handleAddOrEditCourse: Error saving course:', err);
      setFormError('Failed to save course. ' + (err.response?.data || err.message));
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://localhost:7120/api/CourseModels/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(courses.filter((course) => course.courseId !== courseId));
      setDropdownOpenId(null);
    } catch (err) {
      alert('Failed to delete course.');
      console.error('Error deleting course:', err);
    }
  };

  const handleViewDetails = (course) => {
    navigate(`/instructor/courses/${course.courseId}`);
  };

  const toggleDropdown = (courseId) => {
    setDropdownOpenId(dropdownOpenId === courseId ? null : courseId);
  };

  const handleEditClick = (course) => {
    setEditingCourseId(course.courseId);
    setFormData({
      title: course.title,
      description: course.description,
      mediaUrl: course.mediaUrl,
    });
    setShowForm(true);
    setDropdownOpenId(null);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <nav className="navbar navbar-expand-lg navbar-dark bg-black-red-gradient mb-4">
        <div className="container">
          <span className="navbar-brand">Your Courses</span>
          <button className="btn btn-outline-light" onClick={() => navigate('/instructor/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="container flex-grow-1">
        <style>
          {`
            .course-card {
              transition: box-shadow 0.3s ease-in-out;
            }
            .course-card:hover {
              box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
            }
          `}
        </style>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Your Courses</h2>
          <button
            className={`btn ${showForm ? 'btn-secondary' : 'bg-black-red-gradient text-white'}`}
            onClick={() => {
              setShowForm((prev) => {
                if (!prev) {
                  setFormData({ title: '', description: '', mediaUrl: '' });
                  setEditingCourseId(null);
                }
                return !prev;
              });
            }}
          >
            {showForm ? 'Cancel' : 'Add Course'}
          </button>
        </div>

        {showForm && (
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">{editingCourseId ? 'Edit Course' : 'Add New Course'}</h5>
              {formError && <div className="alert alert-danger">{formError}</div>}
              <form onSubmit={handleAddOrEditCourse}>
                <div className="mb-3">
                  <input
                    type="text"
                    name="title"
                    className="form-control"
                    placeholder="Course Title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <textarea
                    name="description"
                    className="form-control"
                    placeholder="Course Description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="file"
                    className="form-control"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  />
                  <small className="text-muted">Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT</small>
                </div>
                <button type="submit" className="btn bg-black-red-gradient text-white">
                  {editingCourseId ? 'Update Course' : 'Add Course'}
                </button>
              </form>
            </div>
          </div>
        )}

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
                <div className="col-md-6 mb-4" key={course.courseId}>
                  <div className="card h-100 position-relative course-card">
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                      <button
                        className="btn btn-link p-0"
                        style={{ fontSize: '1.5rem', color: '#333' }}
                        onClick={() => toggleDropdown(course.courseId)}
                        title="Options"
                      >
                        &#8942;
                      </button>
                      {dropdownOpenId === course.courseId && (
                        <div className="dropdown-menu show" style={{ display: 'block' }}>
                          <button
                            className="dropdown-item text-black-force"
                            onClick={() => handleViewDetails(course)}
                          >
                            <i className="fas fa-eye me-2"></i> View
                          </button>
                          <button
                            className="dropdown-item text-black-force"
                            onClick={() => handleEditClick(course)}
                          >
                            <i className="fas fa-pen me-2"></i> Edit
                          </button>
                          <button
                            className="dropdown-item text-danger"
                            onClick={() => handleDeleteCourse(course.courseId)}
                          >
                            <i className="fas fa-trash me-2"></i> Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="card-body">
                      <h5 className="card-title">{course.title}</h5>
                      <p className="card-text">{course.description}</p>
                      {course.mediaUrl && (
                        <a
                          href={course.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-primary btn-sm mt-2"
                        >
                          View Course Link
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
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
