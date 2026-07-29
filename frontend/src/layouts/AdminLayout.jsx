import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiUsers, FiBookOpen, FiGrid, FiSettings, FiLogOut, FiAward } from 'react-icons/fi';

const AdminLayout = () => {
    const [showSidebar, setShowSidebar] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => setShowSidebar(!showSidebar);
    const closeSidebar = () => setShowSidebar(false);

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <div className="d-flex" style={{ minHeight: '100vh', overflowX: 'hidden' }}>
            {/* Overlay for mobile */}
            <div className={`sidebar-overlay ${showSidebar ? 'show' : ''}`} onClick={closeSidebar}></div>

            {/* Sidebar */}
            <div className={`sidebar bg-dark text-white p-3 d-flex flex-column ${showSidebar ? 'show' : ''}`} style={{ width: '250px' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0 text-primary fw-bold">Admin Panel</h4>
                    <button className="btn d-md-none text-white p-0 border-0" onClick={toggleSidebar}>
                        <FiX size={24} />
                    </button>
                </div>
                
                <ul className="nav flex-column gap-2 flex-grow-1">
                    <li className="nav-item">
                        <Link to="/admin/dashboard" className={`nav-link text-white d-flex align-items-center gap-2 ${isActive('/admin/dashboard')}`} onClick={closeSidebar}>
                            <FiGrid /> Dashboard
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/admin/students" className={`nav-link text-white d-flex align-items-center gap-2 ${isActive('/admin/students')}`} onClick={closeSidebar}>
                            <FiUsers /> Manage Students
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/admin/results" className={`nav-link text-white d-flex align-items-center gap-2 ${isActive('/admin/results')}`} onClick={closeSidebar}>
                            <FiAward /> Leaderboard
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/admin/exams" className={`nav-link text-white d-flex align-items-center gap-2 ${isActive('/admin/exams')}`} onClick={closeSidebar}>
                            <FiBookOpen /> Manage Exams
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/admin/settings" className={`nav-link text-white d-flex align-items-center gap-2 ${isActive('/admin/settings')}`} onClick={closeSidebar}>
                            <FiSettings /> Settings
                        </Link>
                    </li>
                </ul>

                <div className="mt-auto pt-3 border-top border-secondary">
                    <Link to="/" className="nav-link text-danger d-flex align-items-center gap-2">
                        <FiLogOut /> Logout
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow-1 bg-light d-flex flex-column" style={{ minWidth: 0 }}>
                {/* Top header bar for mobile */}
                <header className="bg-white border-bottom p-3 d-flex d-md-none justify-content-between align-items-center">
                    <span className="fw-bold text-dark">CADDAMSS Exam Portal</span>
                    <button className="btn btn-outline-dark p-1 d-flex align-items-center justify-content-center" onClick={toggleSidebar}>
                        <FiMenu size={20} />
                    </button>
                </header>
                
                <main className="p-3 p-md-4 flex-grow-1">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
