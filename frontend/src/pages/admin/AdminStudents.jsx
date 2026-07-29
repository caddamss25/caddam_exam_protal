import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminStudents = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [submitError, setSubmitError] = useState('');

    const [formData, setFormData] = useState({
        name: '', registerNumber: '', department: '', year: '', 
        email: '', phone: '', password: '', status: 'Active'
    });

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/admin/students');
            setStudents(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching students:", error);
            setLoading(false);
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        setSaving(true);
        try {
            if (editId) {
                await axios.put(`http://localhost:8080/api/admin/students/${editId}`, formData);
                setEditId(null);
            } else {
                await axios.post('http://localhost:8080/api/admin/students', formData);
            }
            setShowForm(false);
            fetchStudents();
            setFormData({ name: '', registerNumber: '', department: '', year: '', email: '', phone: '', password: '', status: 'Active' });
        } catch (error) {
            console.error("Error saving student:", error);
            setSubmitError(error.response?.data?.message || error.message || 'Failed to save student');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (student) => {
        setFormData({
            name: student.name || '',
            registerNumber: student.registerNumber || '',
            department: student.department || '',
            year: student.year || '',
            email: student.email || '',
            phone: student.phone || '',
            password: student.password || '',
            status: student.status || 'Active'
        });
        setEditId(student.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this student?")) {
            try {
                await axios.delete(`http://localhost:8080/api/admin/students/${id}`);
                fetchStudents(); // refresh the list
            } catch (error) {
                console.error("Error deleting student:", error);
            }
        }
    };

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="text-primary fw-bold">Manage Students</h3>
                <button className="btn btn-gradient fw-bold px-4" onClick={() => {
                    setShowForm(!showForm);
                    if (showForm) {
                        setEditId(null);
                        setFormData({ name: '', registerNumber: '', department: '', year: '', email: '', phone: '', password: '', status: 'Active' });
                    }
                }}>
                    {showForm ? 'Cancel' : '+ Add Student'}
                </button>
            </div>

            {showForm && (
                <div className="card shadow-sm glass-card mb-4">
                    <div className="card-body">
                        {submitError && <div className="alert alert-danger">{submitError}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="row mb-3">
                                <div className="col-md-3">
                                    <label>Name</label>
                                    <input type="text" name="name" className="form-control" required value={formData.name} onChange={handleChange} />
                                </div>
                                <div className="col-md-3">
                                    <label>Register No</label>
                                    <input type="text" name="registerNumber" className="form-control" required value={formData.registerNumber} onChange={handleChange} />
                                </div>
                                <div className="col-md-3">
                                    <label>Email</label>
                                    <input type="email" name="email" className="form-control" required value={formData.email} onChange={handleChange} />
                                </div>
                                <div className="col-md-3">
                                    <label>Password</label>
                                    <input type="password" name="password" className="form-control" required={!editId} value={formData.password} onChange={handleChange} placeholder={editId ? "Leave empty to keep" : ""} />
                                </div>
                            </div>
                            <div className="row mb-3">
                                <div className="col-md-3">
                                    <label>Department</label>
                                    <input type="text" name="department" className="form-control" required value={formData.department} onChange={handleChange} />
                                </div>
                                <div className="col-md-3">
                                    <label>Year</label>
                                    <select name="year" className="form-control" required value={formData.year} onChange={handleChange}>
                                        <option value="">Select Year</option>
                                        <option value="1st Year">1st Year</option>
                                        <option value="2nd Year">2nd Year</option>
                                        <option value="3rd Year">3rd Year</option>
                                        <option value="4th Year">4th Year</option>
                                        <option value="5th Year">5th Year</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label>Phone</label>
                                    <input type="text" name="phone" className="form-control" value={formData.phone} onChange={handleChange} />
                                </div>
                                <div className="col-md-3">
                                    <label>Status</label>
                                    <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-success fw-bold" disabled={saving}>
                                {saving ? 'Saving...' : (editId ? 'Update Student' : 'Save Student')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="card shadow-sm border-0 glass-card">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary" role="status"></div></div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table custom-table mb-0">
                                <thead className="bg-light">
                                <tr>
                                    <th className="ps-4">ID</th>
                                    <th>Register No</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th className="text-end pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-4">No students found</td></tr>
                                ) : (
                                    students.map(student => (
                                        <tr key={student.id}>
                                            <td className="ps-4 text-secondary">#{student.id}</td>
                                            <td className="fw-bold">{student.registerNumber}</td>
                                            <td>{student.name}</td>
                                            <td>{student.email}</td>
                                            <td>
                                                <span className={`badge ${student.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                                                    {student.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="text-end pe-4">
                                                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(student)}>Edit</button>
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(student.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminStudents;
