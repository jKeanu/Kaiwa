import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login'; // Import your login component
import RegisterPage from './pages/Register'
import HomePage from './pages/Home'
//Import other components as needed

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/@me/*" element={<HomePage />} />
                <Route path="/" element={<Navigate replace to="/@me"/>} />
            </Routes>
        </Router>
    );
};

export default App;