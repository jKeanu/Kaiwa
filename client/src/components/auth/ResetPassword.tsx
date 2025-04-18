import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { resetPassword } from "../../api/auth";
import {useNavigate} from 'react-router-dom';
import axios, { AxiosResponse } from "axios";


const ResetPassword:React.FC<{isError:boolean}>=({isError:authenticationError})=>{
    const [resetPassForm, setResetPassForm]= useState({passwordConfirm:'', password:''})
    const {resetPasswordToken} = useParams()
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [containerVisible, setContainerVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(()=>{
        if(authenticationError){
            setErrorMessage('Spam detected, please try again later.')
        }
    }, [authenticationError])

    const handleChange = (e:React.ChangeEvent<HTMLInputElement>)=>{
        e.preventDefault()
        const {name, value} = e.target
        setResetPassForm(prevForm=>{
            return {...prevForm,
            [name]:value}
        })
    }

    useEffect(()=>{
        setContainerVisible(true)
    }, [])

    const handleSubmit = async (e:React.FormEvent<HTMLFormElement>)=>{
        e.preventDefault()
        if(resetPasswordToken){
            if(resetPassForm.password !== resetPassForm.passwordConfirm){
                return setErrorMessage('Confirm password is incorrect.')
            }
            setIsLoading(true)
            try{
                const res:AxiosResponse<{status:string}> = await resetPassword(resetPasswordToken, 
                    {password: resetPassForm.password})
                if(res.data.status==='success'){
                    navigate('/@me')
                }
            }catch(err){
                if(axios.isAxiosError(err)){
                    if(err.response?.status===400){
                        let errMessages = err.response.data.message
                        if(errMessages.split('. ').length>1){
                            errMessages = errMessages.split('. ')[1]
                            setErrorMessage(errMessages)
                        }else if(errMessages.includes('expired')){
                            setErrorMessage(errMessages)
                        }
                        else{
                            setErrorMessage('There was an error changing the password.')
                        }
                    }else if(err.response?.status===429){
                        setErrorMessage('Too many change password attempts.')
                    }else{
                        setErrorMessage('There was an error changing the password.')
                    }
                }else{
                    setErrorMessage('There was an error changing the password.')
                }
            }finally{
                setIsLoading(false)
            }
        }
    }

    return (
    <div className={`reset-password-container ${containerVisible?'visible':''}`}>
        <form className="reset-password-form" onSubmit={handleSubmit}>
            <div className="input-container">
                <input type="password" className='input-field' id='resetPassword' placeholder=" "
                value={resetPassForm.password} onChange={handleChange} name="password" required
                style={{borderBottomColor:`${errorMessage&&'#c93a3a'}`}}/>
                <label htmlFor="resetPassword" className="input-label">New Password</label>
                {!errorMessage&&<span className='input-highlight'></span>}
                {errorMessage&&
                <span className='input-error-message' id='input-error-message'>{errorMessage}</span>}
            </div>
            <div className="input-container">
                <input type="password" className='input-field' id='resetPasswordConfirm' placeholder=" "
                value={resetPassForm.passwordConfirm} onChange={handleChange} name="passwordConfirm" required
                style={{borderBottomColor:`${errorMessage&&'#c93a3a'}`}}/>
                <label htmlFor="resetPasswordConfirm" className="input-label">Cofirm Password</label>
                {!errorMessage&&<span className='input-highlight'></span>}
                {errorMessage&&
                <span className='input-error-message' id='input-error-message'>{errorMessage}</span>}
            </div>
            <button type="submit" disabled={isLoading||authenticationError}>
                {isLoading?<div className="reset-password-loading"></div>:'Change Password'}
            </button>
        </form>
    </div>
    )
}

export default ResetPassword