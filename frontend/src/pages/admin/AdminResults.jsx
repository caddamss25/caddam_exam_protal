import React, { useState, useEffect } from 'react';
import axios from 'axios';

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const pad = (num) => String(num).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    } catch (e) {
        return dateStr;
    }
};

const AdminResults = () => {
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Fetch all active exams to populate dropdown
        const fetchExams = async () => {
            try {
                const res = await axios.get('http://localhost:8080/api/admin/exams');
                setExams(res.data);
                if (res.data.length > 0) {
                    setSelectedExam(res.data[0].id);
                }
            } catch (err) {
                console.error("Error fetching exams", err);
            }
        };
        fetchExams();
    }, []);

    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedResultId, setSelectedResultId] = useState(null);
    const [adminPassword, setAdminPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetting, setResetting] = useState(false);

    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [voucherData, setVoucherData] = useState({ resultId: null, studentName: '', examName: '', voucherCode: '', amount: '500' });
    const [sendingVoucher, setSendingVoucher] = useState(false);
    const [voucherError, setVoucherError] = useState('');

    const [selectedResults, setSelectedResults] = useState([]);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkVoucherData, setBulkVoucherData] = useState({ voucherPrefix: 'CADDAMSS-GIFT-', amount: '500' });
    const [sendingBulkVoucher, setSendingBulkVoucher] = useState(false);
    const [bulkVoucherError, setBulkVoucherError] = useState('');

    const handleSendBulkVoucherSubmit = async (e) => {
        e.preventDefault();
        setBulkVoucherError('');
        setSendingBulkVoucher(true);
        try {
            const promises = selectedResults.map(resId => {
                const randomNum = Math.floor(1000 + Math.random() * 9000);
                const code = `${bulkVoucherData.voucherPrefix}${randomNum}`;
                return axios.post(`http://localhost:8080/api/admin/results/${resId}/send-voucher`, {
                    voucherCode: code,
                    amount: parseFloat(bulkVoucherData.amount)
                });
            });
            await Promise.all(promises);
            alert(`Successfully sent vouchers to ${selectedResults.length} students!`);
            setShowBulkModal(false);
            setSelectedResults([]);
        } catch (err) {
            console.error("Error sending bulk vouchers:", err);
            setBulkVoucherError(err.response?.data?.message || 'Failed to send bulk voucher emails.');
        } finally {
            setSendingBulkVoucher(false);
        }
    };

    const handleOpenVoucherModal = (res) => {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setVoucherData({
            resultId: res.id,
            studentName: res.student?.name || '',
            examName: res.exam?.examName || '',
            voucherCode: `CADDAMSS-GIFT-${randomNum}`,
            amount: '500'
        });
        setVoucherError('');
        setShowVoucherModal(true);
    };

    const handleSendVoucherSubmit = async (e) => {
        e.preventDefault();
        setVoucherError('');
        setSendingVoucher(true);
        try {
            await axios.post(`http://localhost:8080/api/admin/results/${voucherData.resultId}/send-voucher`, {
                voucherCode: voucherData.voucherCode,
                amount: parseFloat(voucherData.amount)
            });
            alert(`Voucher successfully sent to ${voucherData.studentName}!`);
            setShowVoucherModal(false);
        } catch (err) {
            console.error("Error sending voucher:", err);
            setVoucherError(err.response?.data?.message || 'Failed to send voucher email.');
        } finally {
            setSendingVoucher(false);
        }
    };

    const fetchResults = async () => {
        if (!selectedExam) return;
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:8080/api/admin/exams/${selectedExam}/results`);
            setResults(res.data);
        } catch (err) {
            console.error("Error fetching results", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchResults();
    }, [selectedExam]);

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setResetError('');
        setResetting(true);
        try {
            await axios.post(`http://localhost:8080/api/admin/results/${selectedResultId}/reset`, { password: adminPassword });
            setShowResetModal(false);
            setAdminPassword('');
            setSelectedResultId(null);
            fetchResults();
        } catch (err) {
            console.error("Error resetting exam:", err);
            setResetError(err.response?.data?.message || 'Verification failed. Incorrect admin password.');
        } finally {
            setResetting(false);
        }
    };

    const filteredResults = results.filter(res => {
        const name = res.student?.name?.toLowerCase() || '';
        const regNo = res.student?.registerNumber?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return name.includes(query) || regNo.includes(query);
    });

    return (
        <div className="fade-in">
            <h3 className="text-primary fw-bold mb-4">Exam Results & Leaderboard</h3>

            <div className="card shadow-sm border-0 glass-card mb-4 p-3">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="d-flex align-items-center">
                        <label className="fw-bold text-secondary me-3 mb-0">Select Exam:</label>
                        <select
                            className="form-control w-auto border-primary"
                            value={selectedExam}
                            onChange={(e) => setSelectedExam(e.target.value)}
                        >
                            <option value="">-- Choose Exam --</option>
                            {exams.map(ex => (
                                <option key={ex.id} value={ex.id}>{ex.examName} ({ex.department})</option>
                            ))}
                        </select>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        {selectedResults.length > 0 && (
                            <button
                                className="btn btn-success fw-bold text-nowrap"
                                style={{ borderRadius: '10px' }}
                                onClick={() => {
                                    setBulkVoucherError('');
                                    setShowBulkModal(true);
                                }}
                            >
                                Send Mail ({selectedResults.length})
                            </button>
                        )}
                        <input
                            type="text"
                            placeholder="Search by Name or Register No..."
                            className="form-control border-primary"
                            style={{ minWidth: '260px', borderRadius: '10px' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="card shadow-sm border-0 glass-card">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table custom-table mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4" style={{ width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={filteredResults.length > 0 && selectedResults.length === filteredResults.length}
                                                onChange={() => {
                                                    if (selectedResults.length === filteredResults.length) {
                                                        setSelectedResults([]);
                                                    } else {
                                                        setSelectedResults(filteredResults.map(res => res.id));
                                                    }
                                                }}
                                            />
                                        </th>
                                        <th>Rank</th>
                                        <th>Student Name</th>
                                        <th>Register No</th>
                                        <th>Score</th>
                                        <th>Percentage</th>
                                        <th>Submitted At</th>
                                        <th className="text-end pe-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredResults.length === 0 ? (
                                        <tr><td colSpan="8" className="text-center py-4 text-muted">No matching results found.</td></tr>
                                    ) : (
                                        filteredResults.map((res, idx) => (
                                            <tr key={res.id} className={idx < 10 ? (idx === 0 ? 'table-warning' : (idx === 1 ? 'table-secondary' : (idx === 2 ? 'table-danger' : ''))) : ''}>
                                                <td className="ps-4">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={selectedResults.includes(res.id)}
                                                        onChange={() => {
                                                            if (selectedResults.includes(res.id)) {
                                                                setSelectedResults(selectedResults.filter(id => id !== res.id));
                                                            } else {
                                                                setSelectedResults([...selectedResults, res.id]);
                                                            }
                                                        }}
                                                    />
                                                </td>
                                                <td className="fw-bold">
                                                    #{idx + 1}
                                                    {idx === 0 && ' 🥇'}
                                                    {idx === 1 && ' 🥈'}
                                                    {idx === 2 && ' 🥉'}
                                                </td>
                                                <td className="fw-bold">{res.student?.name}</td>
                                                <td>{res.student?.registerNumber}</td>
                                                <td className="fw-bold text-primary">{res.score} / {res.exam?.totalMarks}</td>
                                                <td>{res.percentage}%</td>
                                                <td>{formatDate(res.date)}</td>
                                                <td className="text-end pe-4 d-flex justify-content-end align-items-center gap-3">
                                                    <span className={`badge ${res.status === 'Pass' ? 'bg-success' : 'bg-danger'}`}>
                                                        {res.status}
                                                    </span>
                                                    <button
                                                        className="btn btn-sm btn-outline-warning fw-bold"
                                                        onClick={() => {
                                                            setSelectedResultId(res.id);
                                                            setShowResetModal(true);
                                                            setResetError('');
                                                        }}
                                                    >
                                                        Restart
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-success fw-bold"
                                                        onClick={() => handleOpenVoucherModal(res)}
                                                        style={{ borderRadius: '8px' }}
                                                    >
                                                        Send Voucher
                                                    </button>
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

            {/* Admin Password Verification Modal for Resetting Exam */}
            {showResetModal && (
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
                        maxWidth: '400px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        overflow: 'hidden',
                        border: '1px solid rgba(0, 0, 0, 0.05)'
                    }}>
                        <form onSubmit={handleResetSubmit}>
                            <div style={{ padding: '32px 24px 20px 24px', textAlign: 'center' }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '50%',
                                    backgroundColor: '#fef3c7',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px',
                                    color: '#d97706'
                                }}>
                                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h4 style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: '800', fontSize: '20px' }}>Authorize Restart</h4>
                                <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
                                    This will delete the student's current score and allow them to take the test again. Please enter the Admin password to proceed.
                                </p>

                                <input
                                    type="password"
                                    className="form-control text-center py-2"
                                    placeholder="Enter Admin Password"
                                    required
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    style={{ borderRadius: '10px', fontSize: '16px' }}
                                />

                                {resetError && (
                                    <div className="text-danger small mt-2 fw-bold">
                                        {resetError}
                                    </div>
                                )}
                            </div>
                            <div style={{
                                padding: '16px 24px 24px 24px',
                                backgroundColor: '#f8fafc',
                                borderTop: '1px solid #f1f5f9',
                                display: 'flex',
                                gap: '12px'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowResetModal(false);
                                        setAdminPassword('');
                                        setSelectedResultId(null);
                                    }}
                                    className="btn btn-outline-secondary w-50 py-2.5 fw-bold"
                                    style={{ borderRadius: '12px', fontSize: '15px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-danger w-50 py-2.5 fw-bold"
                                    disabled={resetting}
                                    style={{
                                        borderRadius: '12px',
                                        fontSize: '15px',
                                        backgroundColor: '#ef4444',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)'
                                    }}
                                >
                                    {resetting ? 'Verifying...' : 'Reset Exam'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Admin Gift Voucher Modal */}
            {showVoucherModal && (
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
                        <form onSubmit={handleSendVoucherSubmit}>
                            <div style={{ padding: '32px 24px 20px 24px' }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '50%',
                                    backgroundColor: '#d1fae5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px',
                                    color: '#059669'
                                }}>
                                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 3h2zm-8 2h16c.6 0 1 .4 1 1v9c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1v-9c0-.6.4-1 1-1z" />
                                    </svg>
                                </div>
                                <h4 style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: '800', fontSize: '20px', textAlign: 'center' }}>Send Gift Voucher</h4>
                                <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '14px', lineHeight: '1.5', textAlign: 'center' }}>
                                    Reward <strong>{voucherData.studentName}</strong> via email for outstanding results in <strong>{voucherData.examName}</strong>.
                                </p>

                                <div className="mb-3">
                                    <label className="fw-bold small text-secondary mb-1">Voucher Code</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        required
                                        value={voucherData.voucherCode}
                                        onChange={(e) => setVoucherData({ ...voucherData, voucherCode: e.target.value })}
                                        style={{ borderRadius: '10px' }}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="fw-bold small text-secondary mb-1">Voucher Value (Rs.)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        required
                                        min="1"
                                        value={voucherData.amount}
                                        onChange={(e) => setVoucherData({ ...voucherData, amount: e.target.value })}
                                        style={{ borderRadius: '10px' }}
                                    />
                                </div>

                                {voucherError && (
                                    <div className="text-danger small mt-2 fw-bold text-center">
                                        {voucherError}
                                    </div>
                                )}
                            </div>
                            <div style={{
                                padding: '16px 24px 24px 24px',
                                backgroundColor: '#f8fafc',
                                borderTop: '1px solid #f1f5f9',
                                display: 'flex',
                                gap: '12px'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setShowVoucherModal(false)}
                                    className="btn btn-outline-secondary w-50 py-2.5 fw-bold"
                                    style={{ borderRadius: '12px', fontSize: '15px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-success w-50 py-2.5 fw-bold"
                                    disabled={sendingVoucher}
                                    style={{
                                        borderRadius: '12px',
                                        fontSize: '15px',
                                        backgroundColor: '#10b981',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                                    }}
                                >
                                    {sendingVoucher ? 'Sending...' : 'Send Email'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Admin Bulk Gift Voucher Modal */}
            {showBulkModal && (
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
                        <form onSubmit={handleSendBulkVoucherSubmit}>
                            <div style={{ padding: '32px 24px 20px 24px' }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '50%',
                                    backgroundColor: '#d1fae5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px',
                                    color: '#059669'
                                }}>
                                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 3h2zm-8 2h16c.6 0 1 .4 1 1v9c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1v-9c0-.6.4-1 1-1z" />
                                    </svg>
                                </div>
                                <h4 style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: '800', fontSize: '20px', textAlign: 'center' }}>Send Bulk Gift Vouchers</h4>
                                <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '14px', lineHeight: '1.5', textAlign: 'center' }}>
                                    Reward <strong>{selectedResults.length} selected students</strong> simultaneously via email.
                                </p>

                                <div className="mb-3">
                                    <label className="fw-bold small text-secondary mb-1">Voucher Code Prefix</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        required
                                        value={bulkVoucherData.voucherPrefix}
                                        onChange={(e) => setBulkVoucherData({ ...bulkVoucherData, voucherPrefix: e.target.value })}
                                        style={{ borderRadius: '10px' }}
                                    />
                                    {/* <span className="text-muted small fs-7 mt-1 d-block">Each student will receive: <em>Prefix + Random 4-digit code</em></span> */}
                                </div>

                                <div className="mb-3">
                                    <label className="fw-bold small text-secondary mb-1">Voucher Value (Rs.)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        required
                                        min="1"
                                        value={bulkVoucherData.amount}
                                        onChange={(e) => setBulkVoucherData({ ...bulkVoucherData, amount: e.target.value })}
                                        style={{ borderRadius: '10px' }}
                                    />
                                </div>

                                {bulkVoucherError && (
                                    <div className="text-danger small mt-2 fw-bold text-center">
                                        {bulkVoucherError}
                                    </div>
                                )}
                            </div>
                            <div style={{
                                padding: '16px 24px 24px 24px',
                                backgroundColor: '#f8fafc',
                                borderTop: '1px solid #f1f5f9',
                                display: 'flex',
                                gap: '12px'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setShowBulkModal(false)}
                                    className="btn btn-outline-secondary w-50 py-2.5 fw-bold"
                                    style={{ borderRadius: '12px', fontSize: '15px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-success w-50 py-2.5 fw-bold"
                                    disabled={sendingBulkVoucher}
                                    style={{
                                        borderRadius: '12px',
                                        fontSize: '15px',
                                        backgroundColor: '#10b981',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                                    }}
                                >
                                    {sendingBulkVoucher ? 'Sending...' : 'Send Bulk Emails'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminResults;
