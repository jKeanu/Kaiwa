import React, { useState } from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router-dom'
import '../styles/login.css'

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios({
                method: 'POST',
                url: 'http://localhost:3001/api/v1/users/login',
                data:{
                    email,
                    password
                }
            });
            console.log(res)
            if (res.data.status === "success") {
                // localStorage.setItem('token', res.data.token)
                navigate('/@me')
            }
        } catch (error) {
            console.log(error.message)
        }
    };
    return (
        <div className='login-page-container'>
            <div className='login-container'>
                <h1 className='login-header'>Log In</h1>
                <div className='login-form-container'>
                    <form className='login-form' onSubmit={handleLogin}>
                        <label htmlFor='email'>Email</label>
                        <input type="email" className="email" value={email} placeholder="Enter your email address" onChange={e => 
                            setEmail(e.target.value)} required/>
                        <label htmlFor='password'>Password</label>
                        <input type="password" placeholder="Enter your password" value={password} onChange={e => 
                            setPassword(e.target.value)}  required/>
                        <button type="submit">Log In</button>
                        <span className='need-an-account-text'>
                            Need an account? <a className='sign-up-link' href='/signup'>Register</a>
                        </span>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;