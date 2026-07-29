import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUsers, FiBookOpen, FiHelpCircle } from 'react-icons/fi';

const AdminDashboard = () => {
    const [metrics, setMetrics] = useState({
        students: 0,
        activeExams: 0,
        questions: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const [studentsRes, examsRes, questionsRes] = await Promise.all([
                    axios.get('http://localhost:8080/api/admin/students'),
                    axios.get('http://localhost:8080/api/admin/exams'),
                    axios.get('http://localhost:8080/api/admin/questions')
                ]);

                const activeExamsCount = examsRes.data.filter(e => e.status === 'Active').length;

                setMetrics({
                    students: studentsRes.data.length,
                    activeExams: activeExamsCount,
                    questions: questionsRes.data.length
                });
            } catch (error) {
                console.error("Error fetching dashboard metrics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    return (
        <div className="fade-in">
            <h2 className="text-primary fw-bold mb-4">Admin Dashboard</h2>
            {loading ? (
                <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
            ) : (
                <div className="row">
                    <div className="col-md-4 mb-3">
                        <div className="card text-white bg-primary shadow-sm border-0 glass-card h-100">
                            <div className="card-body d-flex align-items-center justify-content-between">
                                <div>
                                    <h5 className="card-title text-white-50">Total Students</h5>
                                    <p className="card-text fs-1 fw-bold mb-0">{metrics.students}</p>
                                </div>
                                <FiUsers size={48} className="text-white-50" />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="card text-white bg-success shadow-sm border-0 glass-card h-100">
                            <div className="card-body d-flex align-items-center justify-content-between">
                                <div>
                                    <h5 className="card-title text-white-50">Active Exams</h5>
                                    <p className="card-text fs-1 fw-bold mb-0">{metrics.activeExams}</p>
                                </div>
                                <FiBookOpen size={48} className="text-white-50" />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="card text-white bg-info shadow-sm border-0 glass-card h-100">
                            <div className="card-body d-flex align-items-center justify-content-between">
                                <div>
                                    <h5 className="card-title text-white-50">Total Questions</h5>
                                    <p className="card-text fs-1 fw-bold mb-0">{metrics.questions}</p>
                                </div>
                                <FiHelpCircle size={48} className="text-white-50" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
