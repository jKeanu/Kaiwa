import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import HomePage from './pages/Home';
import './styles/main.sass';
import AuthenticationPage from './pages/Auth';

Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DNS,
});

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/@me/*" element={<HomePage />} />
                <Route path="/*" element={<AuthenticationPage />} />
                <Route path="/" element={<Navigate replace to="/login" />} />
            </Routes>
        </Router>
    );
};

export default App;
