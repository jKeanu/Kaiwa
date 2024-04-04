import { useState, useEffect} from 'react';
import { Routes, Route } from 'react-router-dom';
import {useNavigate} from 'react-router-dom';
import LoginPage from '../components/auth/Login';
import RegisterPage from '../components/auth/Register';

const AuthenticationPage = () => {
    const [containerVisible, setContainerVisible] = useState(false)

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
                <Route path='login' element={<LoginPage setContainerVisible={setContainerVisible} containerVisible={containerVisible}/>}/>
                <Route path='register' element={<RegisterPage setContainerVisible={setContainerVisible} containerVisible={containerVisible}/>} />
                <Route path='/resetpassword/:resetPasswordToken' />
            </Routes>
        </div>
    );
};

export default AuthenticationPage;