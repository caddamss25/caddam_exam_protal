import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AdminExams = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);

    const [formData, setFormData] = useState({
        examName: '', department: '', year: '',
        duration: 60, totalMarks: 100, passingMarks: 40,
        status: 'Active',
        allowReview: false
    });

    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchExams(); }, []);

    const fetchExams = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/admin/exams');
            setExams(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching exams:", error);
            setLoading(false);
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const [submitError, setSubmitError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        setSaving(true);
        try {
            const payload = {
                ...formData,
                duration: parseInt(formData.duration),
                totalMarks: parseInt(formData.totalMarks),
                passingMarks: parseInt(formData.passingMarks)
            };
            if (editId) {
                await axios.put(`http://localhost:8080/api/admin/exams/${editId}`, payload);
                setEditId(null);
            } else {
                await axios.post('http://localhost:8080/api/admin/exams', payload);
            }
            setShowForm(false);
            fetchExams();
            setFormData({
                examName: '', department: '', year: '',
                duration: 60, totalMarks: 100, passingMarks: 40,
                status: 'Active',
                allowReview: false
            });
        } catch (error) {
            console.error("Error creating exam:", error);
            setSubmitError(error.response?.data?.message || error.message || 'Failed to create exam');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (exam) => {
        setFormData({
            examName: exam.examName,
            department: exam.department,
            year: exam.year,
            duration: exam.duration,
            totalMarks: exam.totalMarks,
            passingMarks: exam.passingMarks,
            status: exam.status,
            allowReview: exam.allowReview || false
        });
        setEditId(exam.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this exam?")) {
            try {
                await axios.delete(`http://localhost:8080/api/admin/exams/${id}`);
                fetchExams();
            } catch (error) {
                console.error("Error deleting exam:", error);
            }
        }
    };

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="text-primary fw-bold">Manage Exams</h3>
                <button className="btn btn-gradient fw-bold px-4" onClick={() => {
                    setShowForm(!showForm);
                    if (showForm) {
                        setEditId(null);
                        setFormData({ examName: '', department: '', year: '', duration: 60, totalMarks: 100, passingMarks: 40, status: 'Active' });
                    }
                }}>
                    {showForm ? 'Cancel' : '+ Create Exam'}
                </button>
            </div>

            {showForm && (
                <div className="card shadow-sm glass-card mb-4">
                    <div className="card-body">
                        {submitError && <div className="alert alert-danger">{submitError}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label>Exam Name</label>
                                    <input type="text" name="examName" className="form-control" required value={formData.examName} onChange={handleChange} />
                                </div>
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
                            </div>
                            <div className="row mb-3">
                                <div className="col-md-2">
                                    <label>Duration (mins)</label>
                                    <input type="number" name="duration" className="form-control" required value={formData.duration} onChange={handleChange} />
                                </div>
                                <div className="col-md-2">
                                    <label>Total Marks</label>
                                    <input type="number" name="totalMarks" className="form-control" required value={formData.totalMarks} onChange={handleChange} />
                                </div>
                                <div className="col-md-2">
                                    <label>Passing Marks</label>
                                    <input type="number" name="passingMarks" className="form-control" required value={formData.passingMarks} onChange={handleChange} />
                                </div>
                                <div className="col-md-3">
                                    <label>Status</label>
                                    <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                                        <option value="Active">Active (Released)</option>
                                        <option value="Locked">Locked</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label>Allow Review (Keys)</label>
                                    <select
                                        name="allowReview"
                                        className="form-control"
                                        value={formData.allowReview ? "true" : "false"}
                                        onChange={(e) => setFormData({ ...formData, allowReview: e.target.value === "true" })}
                                    >
                                        <option value="false">Blocked (Default)</option>
                                        <option value="true">Released</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-gradient fw-bold" disabled={saving}>
                                {saving ? 'Saving...' : (editId ? 'Update Exam' : 'Save Exam')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="card shadow-sm border-0 glass-card">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table custom-table mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4">ID</th>
                                        <th>Exam Name</th>
                                        <th>Dept & Year</th>
                                        <th>Duration</th>
                                        <th>Status</th>
                                        <th className="text-end pe-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {exams.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-4">No exams found</td></tr>
                                    ) : (
                                        exams.map(exam => (
                                            <tr key={exam.id}>
                                                <td className="ps-4">#{exam.id}</td>
                                                <td className="fw-bold">{exam.examName}</td>
                                                <td>{exam.department} - {exam.year}</td>
                                                <td>{exam.duration} mins</td>
                                                <td>
                                                    <span className={`badge ${exam.status === 'Active' ? 'bg-success' : exam.status === 'Locked' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                                        {exam.status}
                                                    </span>
                                                </td>
                                                <td className="text-end pe-4">
                                                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(exam)}>Edit</button>
                                                    <Link to={`/admin/exams/${exam.id}/questions`} className="btn btn-sm btn-outline-info me-2">+ Questions</Link>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(exam.id)}>Delete</button>
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

export default AdminExams;
