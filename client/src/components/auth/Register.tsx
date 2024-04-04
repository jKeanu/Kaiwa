import React, { useState} from 'react';
import { Link } from 'react-router-dom';
import axios, {AxiosResponse} from 'axios';
import {useNavigate} from 'react-router-dom'
import { RegisterForm, AuthStatus, AuthProps } from '../../types/generalTypes';
import { registerUser } from '../../services/apiService';
import { useEffect } from 'react';

const RegisterPage:React.FC<AuthProps>=({setContainerVisible, containerVisible})=>{
    const [formData, setFormData] = useState<RegisterForm>({
        email:"",
        password:"",
        passwordConfirm:"",
        displayName:"",
    })
    const [errorMessage, setErrorMessage] = useState<{type:string, message:string}>()
    const navigate = useNavigate()


    useEffect(() => {
        setContainerVisible(true)
    }, []);

    //The syntax could also be
    //const handleRegister: (e: FormEvent<HTMLFormElement>) => Promise<void> = async (e) =>
    const handleRegister = async (e:React.FormEvent<HTMLFormElement>):Promise<void> => {
        e.preventDefault();
        setErrorMessage({type:'', message:''})
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
                if(error.response?.status===400){
                    let errMessages = error.response.data.message
                    if(errMessages.split('. ').length>1){
                        errMessages = errMessages.split('. ')[1]
                    }
                    if(errMessages.toLowerCase().includes('@')){
                        setErrorMessage({type:'email', message:errMessages})
                    }else if(errMessages.toLowerCase().includes('password')){
                        setErrorMessage({type:'password', message:errMessages})
                    }else if(errMessages.toLowerCase().includes('display name')){
                        setErrorMessage({type:'displayName', message:errMessages})
                    }else{
                        setErrorMessage({type:'other', message:'Something went wrong'})
                    }
                }else if(error.response?.status === 429){
                    setErrorMessage({type:'other', message:'Too many registration attempts detected, please try again later'})
                }else{
                    setErrorMessage({type:'other', message:'An unknown error occurred. Please try again later.'})
                }
            } else if (error instanceof Error) {
                setErrorMessage({type:'other', message:'An unknown error occurred. Please try again later.'})
            } else {
                setErrorMessage({type:'other', message:'An unknown error occurred. Please try again later.'})
            }
        }
    };

    function handleChange(event:React.ChangeEvent<HTMLInputElement>):void{
        const {name, value} = event.target
        setFormData(prevFormData=>{
            return{
                ...prevFormData,
                [name]: value
            }
        })
    }

    return (
        <div className={`register-container ${containerVisible?'visible':''}`}>
            <h1 className='register-header'>Create an account</h1>
            <div className='register-form-container'>
                <form className='register-form' onSubmit={handleRegister}>
                    <div className="input-container">
                        <input type="email" className='input-field' id='email' placeholder=" "
                        value={formData.email} onChange={handleChange} name='email'required
                        style={{borderBottomColor:`${(errorMessage&&(errorMessage.type==='email'||errorMessage.type==='other'))
                        ?'#c93a3a':'rgba(142, 142, 142, 0.5)'}`}}
                        />
                        <label htmlFor="email" className="input-label">Email</label>
                        {errorMessage?.type!=='email'&&<span className='input-highlight'></span>}
                        {(errorMessage&&(errorMessage.type==='email'||errorMessage.type==='other'))
                        &&
                        <span className='input-error-message'>{errorMessage.message}</span>}
                    </div>
                    <div className="input-container">
                        <input type="text" maxLength={12} className='input-field' id='displayName' placeholder=" "
                        value={formData.displayName} onChange={handleChange} name='displayName'required
                        style={{borderBottomColor:`${(errorMessage&&(errorMessage.type==='displayName'||errorMessage.type==='other'))
                        ?'#c93a3a':'rgba(142, 142, 142, 0.5)'}`}}/>
                        <label htmlFor="displayName" className="input-label">Display Name</label>
                        {errorMessage?.type!=='displayName'&&<span className='input-highlight'></span>}
                        {(errorMessage&&(errorMessage.type==='displayName'||errorMessage.type==='other'))
                        &&
                        <span className='input-error-message'>{errorMessage.message}</span>}
                    </div>
                    <div className="input-container">
                        <input type="password" className='input-field' id='password' placeholder=" "
                        value={formData.password} onChange={handleChange} name='password' required
                        style={{borderBottomColor:`${(errorMessage&&(errorMessage.type==='password'||errorMessage.type==='other'))
                        ?'#c93a3a':'rgba(142, 142, 142, 0.5)'}`}}/>
                        <label htmlFor="password" className="input-label">Password</label>
                        {errorMessage?.type!=='password'&&<span className='input-highlight'></span>}
                        {(errorMessage&&(errorMessage.type==='password'||errorMessage.type==='other'))
                        &&
                        <span className='input-error-message'>{errorMessage.message}</span>}
                    </div>
                    <div className="input-container">
                        <input type="password" className='input-field' id='passwordConfirm' placeholder=" "
                        value={formData.passwordConfirm} onChange={handleChange} name='passwordConfirm' required
                        style={{borderBottomColor:`${(errorMessage&&(errorMessage.type==='password'||errorMessage.type==='other'))
                        ?'#c93a3a':'rgba(142, 142, 142, 0.5)'}`}}/>
                        <label htmlFor="passwordConfirm" className="input-label">Confirm password</label>
                        {errorMessage?.type!=='password'&&<span className='input-highlight'></span>}
                        {(errorMessage&&(errorMessage.type==='password'||errorMessage.type==='other'))
                        &&
                        <span className='input-error-message'>{errorMessage.message}</span>}
                    </div>
                    <button type="submit">Register</button>
                </form>
            </div>
            <span className='already-have-an-account-text'>
                Already have an account? <Link className='log-in-link' to="/login">Log In</Link>
            </span>
        </div>
    );
};

export default RegisterPage;