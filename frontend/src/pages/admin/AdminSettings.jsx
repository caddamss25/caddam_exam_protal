import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const AdminSettings = () => {
    const { user } = useContext(AuthContext);
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            setError('New password and confirm password do not match');
            return;
        }

        try {
            const res = await axios.post('http://localhost:8080/api/auth/admin/change-password', {
                username: user?.username || 'admin', // Fallback to 'admin' if context doesn't have it
                currentPassword: currentPassword,
                newPassword: newPassword
            });
            setMessage(res.data.message || 'Password updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data || 'Failed to change password');
        }
    };

    return (
        <div className="fade-in">
            <h3 className="mb-4 text-primary fw-bold">Admin Settings</h3>
            
            <div className="card shadow-sm border-0 glass-card" style={{ maxWidth: '600px' }}>
                <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                    <h5 className="mb-0 fw-bold text-secondary">Change Password</h5>
                </div>
                <div className="card-body p-4">
                    {message && <div className="alert alert-success">{message}</div>}
                    {error && <div className="alert alert-danger">{error}</div>}

                    <form onSubmit={handleChangePassword}>
                        <div className="mb-3">
                            <label className="fw-bold text-secondary mb-1">Current Password</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                required 
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="fw-bold text-secondary mb-1">New Password</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                required 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="fw-bold text-secondary mb-1">Confirm New Password</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                required 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-gradient px-4 py-2 fw-bold w-100">
                            Update Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
