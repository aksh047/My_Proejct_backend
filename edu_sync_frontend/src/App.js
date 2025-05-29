import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import SignUpPage from './components/SignUpPage';
import LoginPage from './components/LoginPage';
import StudentDashboard from './components/StudentDashboard';
import InstructorDashboard from './components/InstructorDashboard';
import StudentCourses from './components/StudentCourses';
import StudentAssignments from './components/StudentAssignments';
import StudentGrades from './components/StudentGrades';
import StudentCourseDetail from './components/StudentCourseDetail';
import InstructorCourses from './components/InstructorCourses';
import InstructorAssignments from './components/InstructorAssignments';
import InstructorStudents from './components/InstructorStudents';
import InstructorCourseDetail from './components/InstructorCourseDetail';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
      <Route path="/student/courses" element={<StudentCourses />} />
      <Route path="/student/assignments" element={<StudentAssignments />} />
      <Route path="/student/grades" element={<StudentGrades />} />
      <Route path="/student/courses/:courseId" element={<StudentCourseDetail />} />
      <Route path="/instructor/courses" element={<InstructorCourses />} />
      <Route path="/instructor/assignments" element={<InstructorAssignments />} />
      <Route path="/instructor/students" element={<InstructorStudents />} />
      <Route path="/instructor/courses/:courseId" element={<InstructorCourseDetail />} />
    </Routes>
  );
}

export default App;
