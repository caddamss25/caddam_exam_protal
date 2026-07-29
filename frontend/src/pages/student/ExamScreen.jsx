import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ExamScreen = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({}); // { questionId: 'A' }
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const answersRef = React.useRef(answers);
    const submittingRef = React.useRef(submitting);
    
    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    useEffect(() => {
        submittingRef.current = submitting;
    }, [submitting]);

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }
        
        const fetchExamData = async () => {
            try {
                // 1. Get questions
                const qRes = await axios.get(`http://localhost:8080/api/student/exams/${examId}/questions`);
                setQuestions(qRes.data);

                // 2. Load saved answers if any
                const savedAnswers = localStorage.getItem(`exam_answers_${user.id}_${examId}`);
                if (savedAnswers) {
                    setAnswers(JSON.parse(savedAnswers));
                }

                // 3. Load saved tab violations if any
                const savedTabs = localStorage.getItem(`exam_tabs_${user.id}_${examId}`);
                if (savedTabs) {
                    setTabSwitches(parseInt(savedTabs));
                }

                // 4. Get exam details for duration / remaining time
                const examsRes = await axios.get(`http://localhost:8080/api/student/${user.id}/exams`);
                const currentExam = examsRes.data.find(e => e.id === parseInt(examId));
                
                if (currentExam) {
                    if (currentExam.status === 'Locked') {
                        showCustomAlert("This exam is currently locked by the administrator.", "Exam Locked", "danger", () => navigate('/student/dashboard'));
                        return;
                    }
                    if (currentExam.status === 'Inactive') {
                        showCustomAlert("This exam is currently inactive.", "Exam Inactive", "danger", () => navigate('/student/dashboard'));
                        return;
                    }

                    const savedEndTime = localStorage.getItem(`exam_end_time_${user.id}_${examId}`);
                    if (savedEndTime) {
                        const remaining = Math.max(0, Math.floor((parseInt(savedEndTime) - Date.now()) / 1000));
                        setTimeLeft(remaining);
                    } else {
                        const durationSeconds = currentExam.duration * 60;
                        const endTime = Date.now() + durationSeconds * 1000;
                        localStorage.setItem(`exam_end_time_${user.id}_${examId}`, endTime.toString());
                        setTimeLeft(durationSeconds);
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error("Failed to load exam", err);
                showCustomAlert("Failed to load exam. Please contact admin.", "Error", "danger", () => navigate('/student/dashboard'));
            }
        };

        fetchExamData();
    }, [examId, user, navigate]);

    const [tabSwitches, setTabSwitches] = useState(0);

    // Warn before unload/reload
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!submitting) {
                e.preventDefault();
                e.returnValue = 'Are you sure you want to leave? Your exam progress is saved, but you should not refresh.';
                return 'Are you sure you want to leave? Your exam progress is saved, but you should not refresh.';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [submitting]);

    // Save state changes to localStorage
    useEffect(() => {
        if (!loading && !submitting && user) {
            localStorage.setItem(`exam_answers_${user.id}_${examId}`, JSON.stringify(answers));
        }
    }, [answers, loading, submitting, user, examId]);

    useEffect(() => {
        if (!loading && !submitting && user) {
            localStorage.setItem(`exam_tabs_${user.id}_${examId}`, tabSwitches.toString());
        }
    }, [tabSwitches, loading, submitting, user, examId]);

    // Tab switching detection
    useEffect(() => {
        if (loading || submitting) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setTabSwitches(prev => {
                    const newVal = prev + 1;
                    if (newVal >= 4) {
                        showCustomAlert("Violation: You have switched tabs 4 times. Your exam is being automatically submitted now.", "Exam Terminated", "danger", () => forceSubmitExam());
                        return newVal;
                    } else {
                        showCustomAlert(`Warning: Tab switching detected! You must stay on this screen. Violation ${newVal}/4.`, "Tab Switch Warning", "warning");
                        return newVal;
                    }
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [loading, submitting]);

    // Timer Effect
    useEffect(() => {
        if (loading || submitting || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitExam(); // Auto submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [loading, submitting, timeLeft]);

    const handleOptionSelect = (questionId, option) => {
        setAnswers({ ...answers, [questionId]: option });
    };

    const forceSubmitExam = async () => {
        if (submittingRef.current) return;
        setSubmitting(true);
        try {
            await axios.post(`http://localhost:8080/api/student/${user.id}/exams/${examId}/submit`, answersRef.current);
            localStorage.removeItem(`exam_answers_${user.id}_${examId}`);
            localStorage.removeItem(`exam_end_time_${user.id}_${examId}`);
            localStorage.removeItem(`exam_tabs_${user.id}_${examId}`);
            showCustomAlert("Exam auto-submitted successfully due to tab-switch violations.", "Exam Submitted", "success", () => navigate('/student/dashboard'));
        } catch (err) {
            console.error("Submit failed", err);
            showCustomAlert("Failed to submit exam. Please check connection.", "Error", "danger");
            setSubmitting(false);
        }
    };

    const handleSubmitExam = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            await axios.post(`http://localhost:8080/api/student/${user.id}/exams/${examId}/submit`, answers);
            localStorage.removeItem(`exam_answers_${user.id}_${examId}`);
            localStorage.removeItem(`exam_end_time_${user.id}_${examId}`);
            localStorage.removeItem(`exam_tabs_${user.id}_${examId}`);
            showCustomAlert("Exam submitted successfully!", "Success", "success", () => navigate('/student/dashboard'));
        } catch (err) {
            console.error("Submit failed", err);
            showCustomAlert("Failed to submit exam. Please check connection.", "Error", "danger");
            setSubmitting(false);
        }
    };

    const [customAlert, setCustomAlert] = useState({ show: false, title: 'Notice', message: '', type: 'danger', onClose: null, onConfirm: null });

    const showCustomAlert = (message, title = 'Notice', type = 'danger', onClose = null, onConfirm = null) => {
        setCustomAlert({ show: true, title, message, type, onClose, onConfirm });
    };

    const closeCustomAlert = () => {
        const callback = customAlert.onClose;
        setCustomAlert({ show: false, title: 'Notice', message: '', type: 'danger', onClose: null, onConfirm: null });
        if (callback) callback();
    };

    const handleConfirmAlert = () => {
        const callback = customAlert.onConfirm;
        setCustomAlert({ show: false, title: 'Notice', message: '', type: 'danger', onClose: null, onConfirm: null });
        if (callback) callback();
    };

    const confirmSubmit = () => {
        const answeredCount = questions.filter(q => answers[q.id] !== undefined).length;
        const totalCount = questions.length;

        if (answeredCount < totalCount) {
            showCustomAlert(`You must answer all questions before submitting. (Answered: ${answeredCount}/${totalCount})`, "Submission Blocked", "danger");
            return;
        }

        showCustomAlert(
            "Are you sure you want to submit your exam? You cannot change your answers after this.",
            "Submit Exam?",
            "confirm",
            null,
            () => handleSubmitExam()
        );
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

    if (questions.length === 0) {
        return (
            <div className="container mt-5 text-center">
                <h3>No questions found for this exam.</h3>
                <button className="btn btn-primary mt-3" onClick={() => navigate('/student/dashboard')}>Go Back</button>
            </div>
        );
    }

    const currentQ = questions[currentIndex];

    return (
        <div className="container-fluid" style={{ minHeight: '100vh', background: 'var(--light-bg)' }}>
            <nav className="navbar navbar-dark bg-primary shadow-sm px-4 mb-4">
                <span className="navbar-brand fw-bold mb-0 h1">CADDAMSS Exam</span>
                <div className="d-flex align-items-center">
                    <div className={`badge ${timeLeft < 300 ? 'bg-danger' : 'bg-warning text-dark'} fs-5 me-4 px-3 py-2`}>
                        ⏱ Time Left: {formatTime(timeLeft)}
                    </div>
                    <span className="text-white fw-bold">{user?.name}</span>
                </div>
            </nav>

            <div className="container-fluid px-4 fade-in">
                <div className="row">
                    {/* Main Question Area */}
                    <div className="col-lg-8 mb-4">
                        <div className="card shadow-sm border-0 glass-card h-100">
                            <div className="card-header bg-white border-bottom-0 pt-4 px-4">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="text-secondary fw-bold mb-0">Question {currentIndex + 1} of {questions.length}</h5>
                                    <span className="badge bg-info text-white">{currentQ.marks} Marks</span>
                                </div>
                            </div>
                            <div className="card-body p-4">
                                <h4 className="mb-4" style={{ lineHeight: '1.6' }}>{currentQ.question}</h4>
                                
                                <div className="options-container">
                                    {['A', 'B', 'C', 'D'].map(opt => {
                                        const optionText = currentQ[`option${opt}`];
                                        const isSelected = answers[currentQ.id] === opt;
                                        
                                        return (
                                            <div 
                                                key={opt}
                                                className={`p-3 border rounded mb-3 cursor-pointer ${isSelected ? 'border-primary bg-primary text-white' : 'bg-white'}`}
                                                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                                onClick={() => handleOptionSelect(currentQ.id, opt)} // saving 'A', 'B' etc.
                                            >
                                                <strong>{opt}.</strong> {optionText}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="card-footer bg-white border-top-0 p-4 d-flex justify-content-between">
                                <button 
                                    className="btn btn-outline-secondary px-4 fw-bold" 
                                    disabled={currentIndex === 0}
                                    onClick={() => setCurrentIndex(currentIndex - 1)}
                                >
                                    &larr; Previous
                                </button>
                                <button 
                                    className="btn btn-primary px-5 fw-bold" 
                                    disabled={currentIndex === questions.length - 1}
                                    onClick={() => setCurrentIndex(currentIndex + 1)}
                                >
                                    Next &rarr;
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Question Palette Sidebar */}
                    <div className="col-lg-4 mb-4">
                        <div className="card shadow-sm border-0 glass-card h-100">
                            <div className="card-header bg-white border-bottom-0 pt-4 px-4">
                                <h5 className="text-secondary fw-bold mb-0">Question Palette</h5>
                            </div>
                            <div className="card-body p-4">
                                <div className="d-flex flex-wrap gap-2 mb-4">
                                    {questions.map((q, idx) => {
                                        const isAnswered = answers[q.id] !== undefined;
                                        const isCurrent = idx === currentIndex;
                                        let btnClass = 'btn-outline-secondary';
                                        
                                        if (isAnswered) btnClass = 'btn-success';
                                        if (isCurrent && !isAnswered) btnClass = 'btn-primary';
                                        
                                        return (
                                            <button 
                                                key={q.id}
                                                className={`btn ${btnClass} fw-bold`}
                                                style={{ width: '45px', height: '45px' }}
                                                onClick={() => setCurrentIndex(idx)}
                                            >
                                                {idx + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                                <hr />
                                <div className="d-flex justify-content-between small text-muted mb-4">
                                    <span><span className="badge bg-success me-1">&nbsp;</span> Answered</span>
                                    <span><span className="badge bg-secondary me-1">&nbsp;</span> Not Answered</span>
                                </div>
                                
                                <button 
                                    className="btn btn-danger w-100 py-3 fw-bold fs-5 shadow-sm"
                                    onClick={confirmSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Final Exam'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Custom Alert Modal */}
            {customAlert.show && (
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
                        maxWidth: '440px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        overflow: 'hidden',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                        transform: 'scale(1)',
                        transition: 'transform 0.3s ease'
                    }}>
                        <div style={{
                            padding: '32px 24px 24px 24px',
                            textAlign: 'center'
                        }}>
                            {/* Dynamic Icon Header */}
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                backgroundColor: 
                                    customAlert.type === 'success' ? '#d1fae5' :
                                    customAlert.type === 'warning' ? '#fef3c7' :
                                    customAlert.type === 'confirm' ? '#dbeafe' : '#fee2e2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                color: 
                                    customAlert.type === 'success' ? '#10b981' :
                                    customAlert.type === 'warning' ? '#d97706' :
                                    customAlert.type === 'confirm' ? '#2563eb' : '#ef4444'
                            }}>
                                {customAlert.type === 'success' && (
                                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                {(customAlert.type === 'danger' || customAlert.type === 'warning') && (
                                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                )}
                                {customAlert.type === 'confirm' && (
                                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>
                            <h4 style={{ margin: '0 0 12px', color: '#1e293b', fontWeight: '800', fontSize: '22px' }}>{customAlert.title}</h4>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '15px', lineHeight: '1.6' }}>
                                {customAlert.message}
                            </p>
                        </div>
                        <div style={{
                            padding: '16px 24px 24px 24px',
                            backgroundColor: '#f8fafc',
                            borderTop: '1px solid #f1f5f9',
                            display: 'flex',
                            gap: '12px'
                        }}>
                            {customAlert.type === 'confirm' ? (
                                <>
                                    <button 
                                        onClick={closeCustomAlert}
                                        className="btn btn-outline-secondary w-50 py-2.5 fw-bold"
                                        style={{ borderRadius: '12px', fontSize: '16px' }}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleConfirmAlert}
                                        className="btn btn-primary w-50 py-2.5 fw-bold"
                                        style={{
                                            borderRadius: '12px',
                                            fontSize: '16px',
                                            backgroundColor: '#4361ee',
                                            border: 'none',
                                            boxShadow: '0 4px 12px rgba(67, 97, 238, 0.35)'
                                        }}
                                    >
                                        Yes, Submit
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={closeCustomAlert}
                                    className="btn btn-primary w-100 py-2.5 fw-bold"
                                    style={{
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        backgroundColor: customAlert.type === 'warning' ? '#f59e0b' : '#4361ee',
                                        border: 'none',
                                        boxShadow: customAlert.type === 'warning' 
                                            ? '0 4px 12px rgba(245, 158, 11, 0.35)' 
                                            : '0 4px 12px rgba(67, 97, 238, 0.35)'
                                    }}
                                >
                                    {customAlert.type === 'warning' ? 'Acknowledge' : 'Continue'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamScreen;
