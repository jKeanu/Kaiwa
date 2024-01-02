import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/login'; // Import your login component
import RegisterPage from './pages/register'
import HomePage from './pages/home'
import './styles/general.css'
// Import other components as needed

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/@me/*" element={<HomePage />} />
                <Route path="/" element={<Navigate replace to="/@me" />} />
            </Routes>
        </Router>
    );
};

export default App;