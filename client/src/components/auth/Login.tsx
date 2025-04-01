import React, { useState, useEffect} from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthStatus } from '../../types/authTypes';
import { AxiosResponse } from 'axios';
import {useNavigate} from 'react-router-dom'
import { loginUser, forgotPassword } from '../../api/auth';

const LoginPage:React.FC<{isError:boolean}>=({isError:authenticationError})=> {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [forgotPassError, setForgotPassError] = useState<string>('')
    const [loading, setLoading] = useState<{isLoading:boolean, type:string}>({isLoading:false, type:''})
    const [forgotPassSuccess, setForgotPassSuccess] = useState<string>('')
    const [containerVisible, setContainerVisible] = useState(false)
    const navigate = useNavigate()
    
    useEffect(()=>{
        setContainerVisible(true)
    },[])


    useEffect(()=>{
        if(authenticationError){
            setErrorMessage('Spam detected, please try again later.')
        }
    }, [authenticationError])

    const handleLogin = async (e:React.FormEvent<HTMLFormElement>):Promise<void> => {
        e.preventDefault();
        setLoading({isLoading:true, type:'logIn'})
        setErrorMessage('')
        setForgotPassError('')
        setForgotPassSuccess('')
        try {
            const res:AxiosResponse<AuthStatus> = await loginUser(email, password);
            if (res.data.status === "success") {
                navigate('/@me')
            }
        } catch (error: unknown) { 
            if (axios.isAxiosError(error)) { // Type guard for AxiosError
                if(error.response?.status===401){
                    setErrorMessage(error.response.data.message)
                }else if(error.response?.status === 429){
                    setErrorMessage('Too many login attempts.')
                }else{
                    setErrorMessage('Something went wrong.')
                }
            }else {
                setErrorMessage('An unknown error occurred.')
            }
        }
        setLoading({isLoading:false, type:''})
    };

    const handleForgotPassword = async (e:React.MouseEvent<HTMLButtonElement>):Promise<void>=>{
        e.preventDefault()
        setForgotPassError('')
        setErrorMessage('')
        setForgotPassSuccess('')
        setLoading({type:'forgotPassword', isLoading:true})
        if(!email){
            setForgotPassError('Input field is empty.')
            setLoading({type:'', isLoading:false})
            return
        }
        try{
            const res:AxiosResponse<{status:string, message:string}> = await forgotPassword(email)
            if(res.data.status==='success'){
                setForgotPassSuccess('A reset password link has been sent to your email.')
            }
        }catch(err){
            if(axios.isAxiosError(err)){
                if(err.response?.status===429){
                    setForgotPassError('Too many forgot password attempts. Please try again later.')
                }else if(err.response?.status===404){
                    setForgotPassError('Invalid email.')
                }
                else{
                    setForgotPassError('Something went wrong.')
                }
            }else{
                setForgotPassError('Something went wrong.')
            }
        }
        setLoading({type:'', isLoading:false})
    }

    return (
        <div className={`login-container ${containerVisible?'visible':''}`}>
            <h1 className='login-header'>Log in</h1>
            <div className='login-form-container'>
                <form className='login-form' onSubmit={handleLogin}>
                    <div className="input-container">
                        <input type="email" className='input-field' id='email' placeholder=" "
                        autoComplete='off'
                        value={email} onChange={e => setEmail(e.target.value)} required
                        style={{borderBottomColor:`${(errorMessage||forgotPassError)&&'#c93a3a'}`}}/>
                        <label htmlFor="email" className="input-label">Email</label>
                        {!errorMessage&&!forgotPassError&&<span className='input-highlight'></span>}
                        {errorMessage&&
                        <span className='input-error-message'>{errorMessage}</span>}
                        {forgotPassError&&
                        <span className='input-error-message'>{forgotPassError}</span>}
                        {forgotPassSuccess&&
                        <span className='input-success-message'>{forgotPassSuccess}</span>}
                    </div>
                    <div className="input-container login-password-input-container">
                        <input type="password" className='input-field' id='password' placeholder=" "
                        autoComplete='off'
                        value={password} onChange={e => setPassword(e.target.value)} required
                        style={{borderBottomColor:`${errorMessage&&'#c93a3a'}`}}/>
                        <label htmlFor="password" className="input-label" >Password</label>
                        <button className='forgot-password-button' type='button' disabled={loading.isLoading||authenticationError} onClick={handleForgotPassword}>
                            {loading.type==='forgotPassword'?<div className="forgot-password-loading"></div>:'Forgot your password?'}
                        </button>
                        {!errorMessage&&<span className='input-highlight'></span>}
                        {errorMessage&&
                        <span className='input-error-message'>{errorMessage}</span>}
                    </div>
                    <button type="submit" disabled={loading.isLoading||authenticationError}>
                        {loading.type==='logIn'?<div className="login-loading"></div>:'Log In'}
                    </button>
                </form>
            </div>
            <span className='need-an-account-text'>
                Need an account? <Link className='register-link' to='/register' aria-label="Register account">Register</Link>
            </span>
        </div>
    );
};

export default LoginPage;