import { useEffect} from 'react';
import { Routes, Route } from 'react-router-dom';
import {useNavigate} from 'react-router-dom';
import LoginPage from '../components/auth/Login';
import RegisterPage from '../components/auth/Register';
import ResetPassword from '../components/auth/ResetPassword';
import NotFound from './notFound';
import useAuth from '../hooks/useAuth';
import LoadingScreen from '../components/loadings/LoadingScreen';

const AuthenticationPage = () => {
    const navigate = useNavigate()
    const {isAuthenticated, isError, isLoading} = useAuth()

    useEffect(()=>{
        if(isAuthenticated){
            navigate('/@me', { replace: true })
        }
    }, [isAuthenticated, navigate])

    return (
        <div className='auth-page-container'>
            {
                isLoading?
                <LoadingScreen />:
                <Routes>
                    <Route path='/login' element={<LoginPage isError={isError}/>}/>
                    <Route path='/register' element={<RegisterPage isError={isError}/>} />
                    <Route path='/resetpassword/:resetPasswordToken' element={<ResetPassword isError={isError}/>}/>
                    <Route path="*" element={<NotFound />} />
                </Routes>
            }
            <div className="auth-copy">
                © 2025 Kaiwa
            </div>
        </div>
    );
};

export default AuthenticationPage;