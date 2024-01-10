import { useState, ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axios, {AxiosResponse} from 'axios';
import {useNavigate} from 'react-router-dom'
import { RegisterForm, AuthStatus } from '../types/generalTypes';
import { registerUser } from '../services/apiService';

const RegisterPage = () => {
    const [formData, setFormData] = useState<RegisterForm>({
        email:"",
        password:"",
        passwordConfirm:"",
        displayName:"",
    })
    const navigate = useNavigate()
    //The syntax could also be
    //const handleRegister: (e: FormEvent<HTMLFormElement>) => Promise<void> = async (e) =>
    const handleRegister = async (e:FormEvent<HTMLFormElement>):Promise<void> => {
        e.preventDefault();
        try {
            const res:AxiosResponse<AuthStatus> = await registerUser(formData)
            console.log(res)
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

    function handleChange(event:ChangeEvent<HTMLInputElement>):void{
        const {name, value} = event.target
        setFormData(prevFormData=>{
            return{
                ...prevFormData,
                [name]: value
            }
        })
    }

    return (
        <div className='register-page-container'>
            <div className='register-container'>
                <h1 className='register-header'>Create an account</h1>
                <div className='register-form-container'>
                    <form className='register-form' onSubmit={handleRegister}>
                        <label htmlFor='email'>Email</label>
                        <input type="email" name='email' value={formData.email} placeholder="Enter your email address" 
                        onChange={handleChange} required/>
                        <label htmlFor='displayName'>Display Name
                        </label>
                        <input type="text" name='displayName' className='display-name-input' placeholder="Enter your display name" 
                        value={formData.displayName} onChange={handleChange}  required/>
                        <label htmlFor='password'>Password</label>
                        <input type="password"name='password' placeholder="Enter your password" value={formData.password} 
                        onChange={handleChange}  required/>
                        <label htmlFor='passwordConfirm'>Confirm Password</label>
                        <input type="password" name='passwordConfirm' placeholder="Confirm your password" value={formData.passwordConfirm}
                         onChange={handleChange}  required/>
                        <button type="submit">Register</button>
                    </form>
                </div>
                <span className='already-have-an-account-text'>
                    Already have an account? <Link className='log-in-link' to="/login">Log In</Link>
                </span>
            </div>
        </div>
    );
};

export default RegisterPage;