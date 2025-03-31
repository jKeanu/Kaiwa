import { useEffect} from 'react';
import { Routes, Route } from 'react-router-dom';
import {useNavigate} from 'react-router-dom';
import LoginPage from '../components/auth/Login';
import RegisterPage from '../components/auth/Register';
import ResetPassword from '../components/auth/ResetPassword';
import NotFound from './notFound';

const AuthenticationPage = () => {
    const navigate = useNavigate()

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/@me');
        }
    }, [navigate]);


    return (
        <div className='auth-page-container'>
            <Routes>
                <Route path='/login' element={<LoginPage />}/>
                <Route path='/register' element={<RegisterPage />} />
                <Route path='/resetpassword/:resetPasswordToken' element={<ResetPassword />}/>
                <Route path="*" element={<NotFound />} />
            </Routes>
            <div className="auth-copy">
                © 2025 Kaiwa
            </div>
        </div>
    );
};

export default AuthenticationPage;