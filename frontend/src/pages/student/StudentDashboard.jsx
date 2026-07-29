import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [exams, setExams] = useState([]);
    const [results, setResults] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || !user.id) return;
        fetchExams();
        fetchResults();
    }, [user]);

    const fetchExams = async () => {
        try {
            const res = await axios.get(`http://localhost:8080/api/student/${user.id}/exams`);
            setExams(res.data);
        } catch (error) {
            console.error("Error fetching exams", error);
        }
    };

    const fetchResults = async () => {
        try {
            const res = await axios.get(`http://localhost:8080/api/student/${user.id}/results`);
            setResults(res.data);
        } catch (error) {
            console.error("Error fetching results", error);
        }
    };

    const [confirmModal, setConfirmModal] = useState({ show: false, examId: null });
    const [reviewModal, setReviewModal] = useState({ show: false, questions: [], result: null });

    const handleOpenReview = async (resultId) => {
        try {
            const res = await axios.get(`http://localhost:8080/api/student/results/${resultId}/review`);
            setReviewModal({
                show: true,
                questions: res.data.questions,
                result: res.data.result
            });
        } catch (error) {
            console.error("Error fetching review:", error);
            alert(error.response?.data?.message || "Failed to load review details.");
        }
    };

    const triggerStartExam = (examId) => {
        setConfirmModal({ show: true, examId });
    };

    const handleConfirmStart = () => {
        const id = confirmModal.examId;
        setConfirmModal({ show: false, examId: null });
        navigate(`/student/exam/${id}`);
    };

    return (
        <div className="container-fluid" style={{ minHeight: '100vh', background: 'var(--light-bg)' }}>
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm px-4">
                <a className="navbar-brand fw-bold" href="#">CADDAMSS Portal</a>
                <div className="ms-auto d-flex align-items-center">
                    <span className="text-white me-3 fw-bold">Welcome, {user?.name}</span>
                    <button className="btn btn-sm btn-light text-danger fw-bold" onClick={() => { logout(); navigate('/'); }}>Logout</button>
                </div>
            </nav>

            <div className="container mt-5 fade-in">
                <h3 className="mb-4 text-primary fw-bold">Available Exams</h3>
                <div className="row mb-5">
                    {exams.filter(e => e.status === 'Active' || e.status === 'Locked').map(exam => {
                        const hasTaken = results.some(r => r.exam?.id === exam.id);
                        return (
                            <div className="col-md-4 mb-3" key={exam.id}>
                                <div className="card shadow-sm border-0 glass-card h-100">
                                    <div className="card-body">
                                        <h5 className="fw-bold text-secondary">{exam.examName}</h5>
                                        <p className="text-muted small mb-3">{exam.department} - {exam.year}</p>
                                        <div className="d-flex justify-content-between text-muted small mb-4">
                                            <span> {exam.duration} mins</span>
                                            <span> {exam.totalMarks} Marks</span>
                                        </div>
                                        {hasTaken ? (
                                            <button className="btn btn-secondary w-100 fw-bold" disabled>Already Attempted</button>
                                        ) : exam.status === 'Locked' ? (
                                            <button className="btn btn-secondary w-100 fw-bold" style={{ backgroundColor: '#cbd5e1', color: '#64748b', border: 'none' }} disabled>
                                                Locked by Admin
                                            </button>
                                        ) : (
                                            <button className="btn btn-primary w-100 fw-bold" onClick={() => triggerStartExam(exam.id)}>Start Exam</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {exams.filter(e => e.status === 'Active' || e.status === 'Locked').length === 0 && (
                        <div className="col-12"><div className="alert alert-info">No exams available at the moment.</div></div>
                    )}
                </div>

                <h3 className="mb-4 text-primary fw-bold">My Past Results</h3>
                <div className="card shadow-sm border-0 glass-card mb-5">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table custom-table mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4">Exam Name</th>
                                        <th>Date</th>
                                        <th>Score</th>
                                        <th>Percentage</th>
                                        <th>Status</th>
                                        <th className="text-end pe-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-4">You have not taken any exams yet.</td></tr>
                                    ) : (
                                        results.map(res => (
                                            <tr key={res.id}>
                                                <td className="ps-4 fw-bold">{res.exam?.examName}</td>
                                                <td>{new Date(res.date).toLocaleDateString()}</td>
                                                <td className="fw-bold">{res.score} / {res.exam?.totalMarks}</td>
                                                <td>{res.percentage}%</td>
                                                <td>
                                                    <span className={`badge ${res.status === 'Pass' ? 'bg-success' : 'bg-danger'}`}>{res.status}</span>
                                                </td>
                                                <td className="text-end pe-4">
                                                    {res.exam?.allowReview ? (
                                                        <button
                                                            className="btn btn-sm btn-outline-primary fw-bold"
                                                            onClick={() => handleOpenReview(res.id)}
                                                            style={{ borderRadius: '8px' }}
                                                        >
                                                            👁️ Review Key
                                                        </button>
                                                    ) : (
                                                        <span className="text-muted small fs-7">Key Pending</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Start Exam Confirmation Modal */}
            {confirmModal.show && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '420px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        overflow: 'hidden',
                        border: '1px solid rgba(0, 0, 0, 0.05)'
                    }}>
                        <div style={{ padding: '32px 24px 20px 24px', textAlign: 'center' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                backgroundColor: '#dbeafe',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                color: '#2563eb'
                            }}>
                                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h4 style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: '800', fontSize: '20px' }}>Start Exam?</h4>
                            <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '15px', lineHeight: '1.6' }}>
                                Are you sure you want to start this exam? The timer will begin running immediately.
                            </p>

                            <div style={{
                                padding: '14px',
                                backgroundColor: '#fffbeb',
                                borderRadius: '16px',
                                border: '1px solid #fef3c7',
                                textAlign: 'left',
                                fontSize: '13px',
                                color: '#b45309',
                                lineHeight: '1.5'
                            }}>
                                <strong style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>⚠️ Important Exam Rules:</strong>
                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                    <li style={{ marginBottom: '4px' }}><strong>Anti-Cheat Active:</strong> Do NOT switch tabs or minimize the browser. 4 violations will trigger auto-submission.</li>
                                    <li style={{ marginBottom: '4px' }}>Ensure you have a stable network connection.</li>
                                    <li>All questions must be answered to submit manually.</li>
                                </ul>
                            </div>
                        </div>
                        <div style={{
                            padding: '16px 24px 24px 24px',
                            backgroundColor: '#f8fafc',
                            borderTop: '1px solid #f1f5f9',
                            display: 'flex',
                            gap: '12px'
                        }}>
                            <button
                                onClick={() => setConfirmModal({ show: false, examId: null })}
                                className="btn btn-outline-secondary w-50 py-2.5 fw-bold"
                                style={{ borderRadius: '12px', fontSize: '15px' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmStart}
                                className="btn btn-primary w-50 py-2.5 fw-bold"
                                style={{
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    backgroundColor: '#4361ee',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(67, 97, 238, 0.35)'
                                }}
                            >
                                Yes, Start
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Key Review Modal */}
            {reviewModal.show && (() => {
                let studentAnswers = {};
                try {
                    if (reviewModal.result?.answersJson) {
                        studentAnswers = JSON.parse(reviewModal.result.answersJson);
                    }
                } catch (e) {
                    console.error("Error parsing answersJson", e);
                }

                return (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}>
                        <div style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '24px',
                            width: '100%',
                            maxWidth: '750px',
                            maxHeight: '90vh',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            border: '1px solid rgba(0, 0, 0, 0.05)'
                        }}>
                            {/* Header */}
                            <div style={{
                                padding: '24px 32px',
                                borderBottom: '1px solid #f1f5f9',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: '#f8fafc'
                            }}>
                                <div>
                                    <h4 style={{ margin: 0, color: '#1e293b', fontWeight: '800' }}>Review Answer Key</h4>
                                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                                        {reviewModal.result?.exam?.examName} &bull; Score: <strong>{reviewModal.result?.score} / {reviewModal.result?.exam?.totalMarks}</strong> ({reviewModal.result?.percentage}%)
                                    </p>
                                </div>
                                <button
                                    onClick={() => setReviewModal({ show: false, questions: [], result: null })}
                                    className="btn-close"
                                    style={{ cursor: 'pointer' }}
                                ></button>
                            </div>

                            {/* Body (Scrollable Questions) */}
                            <div style={{
                                padding: '32px',
                                overflowY: 'auto',
                                flex: 1,
                                backgroundColor: '#fafafa'
                            }}>
                                {reviewModal.questions.map((q, index) => {
                                    const studentChoice = studentAnswers[q.id];

                                    return (
                                        <div key={q.id} className="card shadow-sm border-0 mb-4" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                                            <div className="card-body p-4">
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '16px', lineHeight: '1.5', width: '80%' }}>
                                                        Q{index + 1}. {q.question}
                                                    </h6>
                                                    <span className="badge bg-secondary">
                                                        {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
                                                    </span>
                                                </div>

                                                <div className="options-container">
                                                    {['A', 'B', 'C', 'D'].map(opt => {
                                                        const optionText = q[`option${opt}`];
                                                        const isCorrect = q.correctAnswer === opt;
                                                        const isStudentChoice = studentChoice === opt;

                                                        let bgColor = '#ffffff';
                                                        let border = '1px solid #e2e8f0';
                                                        let badge = null;

                                                        if (isCorrect) {
                                                            bgColor = '#e8f5e9';
                                                            border = '1.5px solid #2e7d32';
                                                            badge = <span className="badge bg-success ms-2">✓ Correct Answer</span>;
                                                        } else if (isStudentChoice) {
                                                            bgColor = '#ffebee';
                                                            border = '1.5px solid #c62828';
                                                            badge = <span className="badge bg-danger ms-2">✗ Your Choice</span>;
                                                        }

                                                        return (
                                                            <div
                                                                key={opt}
                                                                style={{
                                                                    padding: '12px 16px',
                                                                    borderRadius: '10px',
                                                                    border,
                                                                    backgroundColor: bgColor,
                                                                    marginBottom: '10px',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    fontSize: '14.5px'
                                                                }}
                                                            >
                                                                <div className="text-dark"><strong>{opt}.</strong> {optionText}</div>
                                                                {badge}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div style={{
                                padding: '20px 32px',
                                borderTop: '1px solid #f1f5f9',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                backgroundColor: '#f8fafc'
                            }}>
                                <button
                                    onClick={() => setReviewModal({ show: false, questions: [], result: null })}
                                    className="btn btn-secondary px-4 py-2 fw-bold"
                                    style={{ borderRadius: '12px' }}
                                >
                                    Close Review
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default StudentDashboard;
