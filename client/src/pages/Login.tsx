import React, { useState, useEffect} from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {useNavigate} from 'react-router-dom';
import { AuthStatus } from '../types/generalTypes';
import { AxiosResponse } from 'axios';
import { forgotPassword, loginUser } from '../services/apiService';


const LoginPage = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [forgotPassError, setForgotPassError] = useState<string>('')
    const [forgotPassSuccess, setForgotPassSuccess] = useState<string>('')
    const [containerVisible, setContainerVisible] = useState(false)
    const navigate = useNavigate()
    
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/@me');
        }else{
            setContainerVisible(true)
        }
    }, [navigate]);

    const handleLogin = async (e:React.FormEvent<HTMLFormElement>):Promise<void> => {
        e.preventDefault();
        setErrorMessage('')
        setForgotPassError('')
        setForgotPassSuccess('')
        try {
            const res:AxiosResponse<AuthStatus> = await loginUser(email, password);
            if (res.data.status === "success") {
                localStorage.setItem('token', res.data.token)
                navigate('/@me')
            }
        } catch (error: unknown) { 
            if (axios.isAxiosError(error)) { // Type guard for AxiosError
                if(error.response?.status===401){
                    setErrorMessage(error.response.data.message)
                }else if(error.response?.status === 429){
                    setErrorMessage('Too many login attempts. Please try again later')
                }else{
                    setErrorMessage('Something went wrong. Please try again later')
                }

            }else {
                setErrorMessage('An unknown error occurred. Please try again later.')
            }
        }
    };

    const handleForgotPassword = async (e:React.MouseEvent<HTMLButtonElement>):Promise<void>=>{
        e.preventDefault()
        setForgotPassError('')
        setErrorMessage('')
        setForgotPassSuccess('')
        try{
            const res:AxiosResponse<{status:string, message:string}> = await forgotPassword(email)
            if(res.data.message==='success'){
                setForgotPassSuccess('A reset password link has been sent to your email.')
            }
        }catch(err){
            if(axios.isAxiosError(err)){
                if(err.status===429){
                    setForgotPassError('Too many forgot password attempts. Please try again later.')
                }else{
                    setForgotPassError('Something went wrong. Please try again later')
                }
            }else{
                setForgotPassError('Something went wrong. Please try again later')
            }
        }
    }

    return (
        <div className='login-page-container'>
            <div className={`login-container ${containerVisible?'visible':''}`}>
                <h1 className='login-header'>Log In</h1>
                <div className='login-form-container'>
                    <form className='login-form' onSubmit={handleLogin}>
                        <div className="input-container">
                            <input type="email" className='input-field' id='email' placeholder=" "
                            value={email} onChange={e => setEmail(e.target.value)} required
                            style={{borderBottomColor:`${errorMessage||forgotPassError&&'#c93a3a'}`}}/>
                            <label htmlFor="email" className="input-label">Email</label>
                            {!errorMessage&&!forgotPassError&&<span className='input-highlight'></span>}
                            {errorMessage||forgotPassError&&
                            <span className='input-error-message' id='input-error-message'>{errorMessage?errorMessage:forgotPassError}</span>}
                        </div>
                        <div className="input-container">
                            <input type="password" className='input-field' id='password' placeholder=" "
                            value={password} onChange={e => setPassword(e.target.value)} required
                            style={{borderBottomColor:`${errorMessage&&'#c93a3a'}`}}/>
                            <label htmlFor="password" className="input-label" >Password</label>
                            {!errorMessage&&<span className='input-highlight'></span>}
                            {errorMessage&&
                            <span className='input-error-message' id='input-error-message'>{errorMessage}</span>}
                        </div>
                        <div className='forgot-password-container'>
                            <button className='forgot-password-button' type='button' onClick={handleForgotPassword}>
                                Forgot your password?
                            </button>
                        </div>
                        <button type="submit">Log In</button>
                    </form>
                </div>
                <span className='need-an-account-text'>
                    Need an account? <Link className='register-link' to='/register'>Register</Link>
                </span>
            </div>
        </div>
    );
};

export default LoginPage;