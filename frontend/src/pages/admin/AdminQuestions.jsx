import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const AdminQuestions = () => {
    const { examId } = useParams();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showCsvImport, setShowCsvImport] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState('');

    const [formData, setFormData] = useState({
        examId: examId,
        question: '', optionA: '', optionB: '', optionC: '', optionD: '', 
        correctAnswer: '', marks: 1
    });

    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchQuestions(); }, [examId]);

    const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    const handleCsvUpload = () => {
        if (!csvFile) return;
        setImporting(true);
        setImportError('');
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target.result;
                const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
                if (lines.length <= 1) {
                    throw new Error("CSV file is empty or only contains the header.");
                }

                // Check header fields
                const headerFields = parseCSVLine(lines[0]);
                let startIdx = 0;
                if (headerFields[0].toLowerCase().includes('question') || headerFields[0].toLowerCase().includes('q')) {
                    startIdx = 1;
                }

                const uploadPromises = [];
                for (let i = startIdx; i < lines.length; i++) {
                    const fields = parseCSVLine(lines[i]);
                    if (fields.length < 6) continue; // skip invalid lines

                    const questionPayload = {
                        examId: parseInt(examId),
                        question: fields[0],
                        optionA: fields[1],
                        optionB: fields[2],
                        optionC: fields[3],
                        optionD: fields[4],
                        correctAnswer: fields[5]?.toUpperCase().trim(),
                        marks: parseInt(fields[6]) || 1
                    };

                    if (!['A', 'B', 'C', 'D'].includes(questionPayload.correctAnswer)) {
                        console.warn(`Skipping line ${i + 1}: Invalid correct answer '${questionPayload.correctAnswer}'`);
                        continue;
                    }

                    uploadPromises.push(
                        axios.post('http://localhost:8080/api/admin/questions', questionPayload)
                    );
                }

                if (uploadPromises.length === 0) {
                    throw new Error("No valid questions found in CSV. Please verify column order and correct answer format.");
                }

                await Promise.all(uploadPromises);
                alert(`Successfully imported ${uploadPromises.length} questions!`);
                setShowCsvImport(false);
                setCsvFile(null);
                fetchQuestions();
            } catch (err) {
                console.error("CSV Import failed", err);
                setImportError(err.message || 'Failed to parse CSV file. Ensure it is formatted correctly.');
            } finally {
                setImporting(false);
            }
        };
        reader.readAsText(csvFile);
    };

    const fetchQuestions = async () => {
        try {
            const res = await axios.get(`http://localhost:8080/api/admin/exams/${examId}/questions`);
            setQuestions(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching questions:", error);
            setLoading(false);
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.correctAnswer) {
            alert("Please select a correct answer (A, B, C, or D).");
            return;
        }
        setSaving(true);
        try {
            const payload = { ...formData, marks: parseInt(formData.marks) };
            if (editId) {
                await axios.put(`http://localhost:8080/api/admin/questions/${editId}`, payload);
                setEditId(null);
                setShowForm(false);
            } else {
                await axios.post('http://localhost:8080/api/admin/questions', payload);
            }
            
            // Reset form
            setFormData({ examId: examId, question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: '', marks: 1 });
            fetchQuestions();
        } catch (error) {
            console.error("Error saving question:", error);
            alert("Failed to save question");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (q) => {
        setFormData({
            examId: q.examId || examId,
            question: q.question,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer,
            marks: q.marks
        });
        setEditId(q.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this question?")) {
            try {
                await axios.delete(`http://localhost:8080/api/admin/questions/${id}`);
                fetchQuestions();
            } catch (error) {
                console.error("Error deleting question:", error);
            }
        }
    };

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <Link to="/admin/exams" className="btn btn-sm btn-outline-secondary mb-2">&larr; Back to Exams</Link>
                    <h3 className="text-primary fw-bold">Manage Questions (Exam #{examId})</h3>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-warning fw-bold px-4" onClick={() => {
                        setShowCsvImport(!showCsvImport);
                        if (showCsvImport) {
                            setCsvFile(null);
                            setImportError('');
                        }
                    }}>
                        {showCsvImport ? 'Close Import' : '📥 Bulk Import (CSV)'}
                    </button>
                    <button className="btn btn-gradient fw-bold px-4" onClick={() => {
                        setShowForm(!showForm);
                        if (showForm) {
                            setEditId(null);
                            setFormData({ examId: examId, question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: '', marks: 1 });
                        }
                    }}>
                        {showForm ? 'Close Form' : '+ Add Question'}
                    </button>
                </div>
            </div>

            {showCsvImport && (
                <div className="card shadow-sm glass-card mb-4 border-warning">
                    <div className="card-header bg-warning text-dark fw-bold">
                        📥 Bulk Import Questions (CSV Mode)
                    </div>
                    <div className="card-body">
                        <p className="text-muted small mb-3">
                            Prepare your Excel/CSV file with the following exact columns:
                            <br />
                            <strong>Question, Option A, Option B, Option C, Option D, Correct Answer (A/B/C/D), Marks</strong>
                            <br />
                            <em>Note: Ensure you include a header row. If your text contains commas, wrap it in double quotes (e.g. <code>"Which of the following is correct, A or B?"</code>).</em>
                        </p>
                        
                        {importError && <div className="alert alert-danger">{importError}</div>}
                        
                        <div className="d-flex align-items-center gap-3">
                            <input 
                                type="file" 
                                className="form-control" 
                                accept=".csv" 
                                onChange={(e) => {
                                    setCsvFile(e.target.files[0]);
                                    setImportError('');
                                }} 
                            />
                            <button 
                                className="btn btn-success fw-bold px-4 text-nowrap"
                                onClick={handleCsvUpload}
                                disabled={!csvFile || importing}
                            >
                                {importing ? 'Importing...' : 'Upload & Import'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="card shadow-sm glass-card mb-4 border-primary">
                    <div className="card-header bg-primary text-white fw-bold">
                        Rapid Question Entry Mode
                    </div>
                    <div className="card-body bg-light">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="fw-bold">Question Text</label>
                                <textarea name="question" className="form-control shadow-sm" rows="2" required value={formData.question} onChange={handleChange} autoFocus></textarea>
                            </div>
                            
                            <label className="fw-bold mb-2">Options (Select the radio button for the correct answer)</label>
                            <div className="row mb-3">
                                {['A', 'B', 'C', 'D'].map(opt => (
                                    <div className="col-md-6 mb-3" key={opt}>
                                        <div className={`input-group shadow-sm ${formData.correctAnswer === opt ? 'border border-success rounded' : ''}`}>
                                            <div className="input-group-text bg-white">
                                                <input 
                                                    className="form-check-input mt-0" 
                                                    type="radio" 
                                                    name="correctAnswer" 
                                                    value={opt} 
                                                    checked={formData.correctAnswer === opt}
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <span className="ms-2 fw-bold">{opt}</span>
                                            </div>
                                            <input 
                                                type="text" 
                                                name={`option${opt}`} 
                                                className={`form-control ${formData.correctAnswer === opt ? 'bg-success text-white placeholder-white' : ''}`} 
                                                placeholder={`Option ${opt}`} 
                                                required 
                                                value={formData[`option${opt}`]} 
                                                onChange={handleChange} 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="row mb-3 align-items-center">
                                <div className="col-md-2">
                                    <label className="fw-bold">Marks</label>
                                    <input type="number" name="marks" className="form-control shadow-sm" min="1" required value={formData.marks} onChange={handleChange} />
                                </div>
                                <div className="col-md-10 text-end mt-4">
                                    <button type="submit" className="btn btn-primary fw-bold px-5 shadow-sm" disabled={saving}>
                                        {saving ? 'Saving...' : (editId ? 'Update Question' : 'Save & Add Next Question')}
                                    </button>
                                </div>
                            </div>
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
                                        <th className="ps-4" style={{width: '60%'}}>Question</th>
                                        <th>Answer</th>
                                        <th>Marks</th>
                                        <th className="text-end pe-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {questions.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-4">No questions added yet</td></tr>
                                    ) : (
                                        questions.map((q, index) => (
                                            <tr key={q.id}>
                                                <td className="ps-4">
                                                    <strong>Q{index + 1}.</strong> {q.question}
                                                    <div className="text-muted small mt-1">
                                                        A: {q.optionA} | B: {q.optionB} | C: {q.optionC} | D: {q.optionD}
                                                    </div>
                                                </td>
                                                <td className="text-success fw-bold">{q.correctAnswer}</td>
                                                <td>{q.marks}</td>
                                                <td className="text-end pe-4">
                                                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(q)}>Edit</button>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(q.id)}>Delete</button>
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

export default AdminQuestions;
