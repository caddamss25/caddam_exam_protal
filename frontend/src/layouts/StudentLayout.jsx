import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const StudentLayout = () => {
    return (
        <div>
            {/* Navbar */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
                <div className="container">
                    <Link className="navbar-brand" to="/student/dashboard">Exam Portal</Link>
                    <div className="collapse navbar-collapse">
                        <ul className="navbar-nav ms-auto">
                            <li className="nav-item">
                                <Link className="nav-link" to="/student/dashboard">Dashboard</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link text-danger" to="/">Logout</Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
            {/* Main Content */}
            <div className="container mt-4">
                <Outlet />
            </div>
        </div>
    );
};

export default StudentLayout;
