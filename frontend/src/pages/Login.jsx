import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleAdminLogin = async () => {
        try {
            const res = await axios.post('http://localhost:8080/api/auth/login/admin', {
                username: id,
                password: password
            });
            login(res.data);
            navigate('/admin/dashboard');
        } catch (err) {
            setError('Invalid Admin Credentials');
        }
    };

    const handleStudentLogin = async () => {
        try {
            const res = await axios.post('http://localhost:8080/api/auth/login/student', {
                email: id,
                password: password
            });
            login(res.data);
            navigate('/student/dashboard');
        } catch (err) {
            setError('Invalid Student Credentials');
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <div className="card shadow p-4 glass-card fade-in" style={{ width: '400px' }}>
                <h3 className="text-center mb-4" style={{ color: 'var(--primary-color)', fontWeight: '700' }}>CADDAMSS Exam Portal</h3>
                
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="mb-3">
                    <label className="fw-bold text-secondary">Admin Username / Student Email</label>
                    <input 
                        type="text" 
                        className="form-control mt-1" 
                        placeholder="Enter ID" 
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                    />
                </div>
                <div className="mb-4">
                    <label className="fw-bold text-secondary">Password</label>
                    <input 
                        type="password" 
                        className="form-control mt-1" 
                        placeholder="Enter Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button className="btn btn-gradient w-100 mb-3 fw-bold py-2" onClick={handleStudentLogin}>
                    Login as Student
                </button>
                <button className="btn btn-outline-primary w-100 fw-bold py-2 mb-3" onClick={handleAdminLogin}>
                    Login as Admin
                </button>
                <div className="text-center">
                    <span className="text-secondary">New Student? </span>
                    <Link to="/register" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 'bold' }}>Register Here</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
