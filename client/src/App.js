import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/login'; // Import your login component
// Import other components as needed

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" Component={LoginPage} />
                <Route path="/@me" Component={LoginPage} />
                <Route path="/" element={<Navigate replace to="/login" />} />
            </Routes>
        </Router>
    );
};

export default App;