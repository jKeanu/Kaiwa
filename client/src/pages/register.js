import React, { useState } from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router-dom'
import '../styles/register.css'

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        email:"",
        password:"",
        passwordConfirm:"",
        displayName:"",
    })
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios({
                method: 'POST',
                url: 'http://localhost:3001/api/v1/users/register',
                data:{
                    ...formData
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

    function handleChange(event){
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
                    <form className='register-form' onSubmit={handleLogin}>
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
                    Already have an account? <a className='log-in-link' href='/login'>Log In</a>
                </span>
            </div>
        </div>
    );
};

export default RegisterPage;