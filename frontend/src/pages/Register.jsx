import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        registerNumber: '',
        department: '',
        year: '',
        email: '',
        phone: '',
        password: ''
    });
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8080/api/auth/register/student', formData);
            setSuccess('Registration successful! Redirecting to login...');
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            setError(err.response?.data || 'An error occurred during registration');
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center py-5" style={{ minHeight: '100vh' }}>
            <div className="card shadow p-4 glass-card fade-in" style={{ width: '500px' }}>
                <h3 className="text-center mb-4" style={{ color: 'var(--primary-color)', fontWeight: '700' }}>Student Registration</h3>
                
                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleRegister}>
                    <div className="mb-3">
                        <label className="fw-bold text-secondary">Full Name</label>
                        <input type="text" name="name" className="form-control mt-1" required onChange={handleChange}/>
                    </div>

                    <div className="mb-3">
                        <label className="fw-bold text-secondary">Email Address</label>
                        <input type="email" name="email" className="form-control mt-1" required onChange={handleChange}/>
                    </div>

                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label className="fw-bold text-secondary">Department</label>
                            <input type="text" name="department" className="form-control mt-1" required onChange={handleChange} placeholder="e.g. CSE"/>
                        </div>
                        <div className="col-md-6">
                            <label className="fw-bold text-secondary">Year</label>
                            <select name="year" className="form-control mt-1" required value={formData.year} onChange={handleChange}>
                                <option value="">Select Year</option>
                                <option value="1st Year">1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year</option>
                                <option value="5th Year">5th Year</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="fw-bold text-secondary">Password</label>
                        <input type="password" name="password" className="form-control mt-1" required onChange={handleChange}/>
                    </div>

                    <button type="submit" className="btn btn-gradient w-100 fw-bold py-2 mb-3">Register</button>
                    
                    <div className="text-center">
                        <span className="text-secondary">Already have an account? </span>
                        <Link to="/" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 'bold' }}>Login Here</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
