import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import HomePage from './pages/Home'
import './styles/main.sass'
import AuthenticationPage from './pages/Auth';
//Import other components as needed

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/@me/*" element={<HomePage />} />
                <Route path="/*" element={<AuthenticationPage />} />
                <Route path="/" element={<Navigate replace to="/login"/>} />
            </Routes>
        </Router>
    );
};

export default App;