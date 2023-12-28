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
                <Route path="/login" Component={LoginPage} />
                <Route path="/register" Component={RegisterPage} />
                <Route path="/@me" Component={HomePage} />
                <Route path="/" element={<Navigate replace to="/login" />} />
            </Routes>
        </Router>
    );
};

export default App;