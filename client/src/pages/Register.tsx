import { useState} from 'react';
import { Link } from 'react-router-dom';
import axios, {AxiosResponse} from 'axios';
import {useNavigate} from 'react-router-dom'
import { RegisterForm, AuthStatus } from '../types/generalTypes';
import { registerUser } from '../services/apiService';
import { useEffect } from 'react';

const RegisterPage = () => {
    const [formData, setFormData] = useState<RegisterForm>({
        email:"",
        password:"",
        passwordConfirm:"",
        displayName:"",
    })
    const [containerVisible, setContainerVisible] = useState(false)
    const [errorMessage, setErrorMessage] = useState<{type:string, message:string}>()
;
    const navigate = useNavigate()
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/@me');
        }else{
            setContainerVisible(true)
        }
    }, [navigate])
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
                    setErrorMessage({type:'other', message:'Too many login attempts. Please try again later'})
                }else{
                    console.log(error.response?.data.message,' -----')
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
        <div className='register-page-container'>
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
                            {(errorMessage&&(errorMessage.type==='email'||errorMessage.type==='other'))
                            &&
                            <span className='input-error-message'>{errorMessage.message}</span>}
                        </div>
                        <div className="input-container">
                            <input type="text" className='input-field' id='displayName' placeholder=" "
                            value={formData.displayName} onChange={handleChange} name='displayName'required
                            style={{borderBottomColor:`${(errorMessage&&(errorMessage.type==='displayName'||errorMessage.type==='other'))
                            ?'#c93a3a':'rgba(142, 142, 142, 0.5)'}`}}/>
                            <label htmlFor="displayName" className="input-label">Display Name</label>
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
        </div>
    );
};

export default RegisterPage;