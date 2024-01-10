import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {useNavigate} from 'react-router-dom';
import { AuthStatus } from '../types/generalTypes';
import { AxiosResponse } from 'axios';
import { loginUser } from '../services/apiService';


const LoginPage = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const navigate = useNavigate()
    
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/@me');
        }
    }, [navigate]);

    const handleLogin = async (e:FormEvent<HTMLFormElement>):Promise<void> => {
        e.preventDefault();
        try {
            const res:AxiosResponse<AuthStatus> = await loginUser(email, password);
            if (res.data.status === "success") {
                localStorage.setItem('token', res.data.token)
                navigate('/@me')
            }
        } catch (error: unknown) { 
            if (axios.isAxiosError(error)) { // Type guard for AxiosError
                // Now you can safely assume error is of type AxiosError
                console.log(error.message);
            } else if (error instanceof Error) {
                console.log(error.message);
            } else {
                console.error('An unknown error occurred:', error);
            }
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