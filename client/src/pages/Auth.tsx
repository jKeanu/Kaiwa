import { useState, useEffect} from 'react';
import { Routes, Route } from 'react-router-dom';
import {useNavigate} from 'react-router-dom';
import LoginPage from '../components/auth/Login';
import RegisterPage from '../components/auth/Register';
import ResetPassword from '../components/auth/ResetPassword';

const AuthenticationPage = () => {
    const navigate = useNavigate()
    
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/@me');
        }
    }, []);


    return (
        <div className='auth-page-container'>
            <Routes>
                <Route path='/login' element={<LoginPage />}/>
                <Route path='register' element={<RegisterPage />} />
                <Route path='/resetpassword/:resetPasswordToken' element={<ResetPassword />}/>
            </Routes>
        </div>
    );
};

export default AuthenticationPage;