import { AxiosResponse } from "axios";
import { AuthStatus, RegisterForm } from "../types/authTypes";
import axiosInstance from "./axiosInstance";

export const registerUser = (formData: Omit<RegisterForm, 'passwordConfirm'>):Promise<AxiosResponse<AuthStatus>> => {
    return axiosInstance.post('/api/v1/auth/register', formData, {_skipAuthInterceptor: true});
};

export const loginUser = (email:string, password:string):Promise<AxiosResponse<AuthStatus>> => {
    return axiosInstance.post('/api/v1/auth/login', { email, password }, {_skipAuthInterceptor: true});
};

export const logoutUser = ():Promise<AxiosResponse<{status:string}>>=>{
 
    return axiosInstance.post('/api/v1/auth/logout')
}

export const isLoggedIn = async ()=>{
    const res:AxiosResponse = await axiosInstance.get('/api/v1/auth/check')
    return res.status
}

export const resetPassword = async(passwordToken:string, data:{password:string}):Promise<AxiosResponse<{status:string, token:string}>>=>{
    return axiosInstance.patch(`/api/v1/auth/resetpassword/${passwordToken}`, data)
}

export const forgotPassword = async(email:string):Promise<AxiosResponse<{status:string, message:string}>>=>{
    return axiosInstance.post(`/api/v1/auth/forgotPassword`, {email})
}