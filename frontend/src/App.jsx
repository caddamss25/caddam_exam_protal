import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSettings from './pages/admin/AdminSettings';
import AdminStudents from './pages/admin/AdminStudents';
import AdminExams from './pages/admin/AdminExams';
import AdminQuestions from './pages/admin/AdminQuestions';
import AdminResults from './pages/admin/AdminResults';
import StudentDashboard from './pages/student/StudentDashboard';
import ExamScreen from './pages/student/ExamScreen';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="exams" element={<AdminExams />} />
            <Route path="exams/:examId/questions" element={<AdminQuestions />} />
            <Route path="results" element={<AdminResults />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/exam/:examId" element={<ExamScreen />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
