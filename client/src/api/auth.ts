import { AxiosResponse } from "axios";
import { AuthStatus, RegisterForm } from "../types/authTypes";
import axiosInstance from "./axiosInstance";

export const registerUser = (formData:RegisterForm):Promise<AxiosResponse<AuthStatus>> => {
    return axiosInstance.post(`/api/v1/users/register`, formData);
};

export const loginUser = (email:string, password:string):Promise<AxiosResponse<AuthStatus>> => {
    return axiosInstance.post(`/api/v1/users/login`, { email, password });
};

export const logoutUser = ():Promise<AxiosResponse<{status:string}>>=>{
    return axiosInstance.post('/api/v1/users/logout')
}


export const isLoggedIn = async ()=>{
    const resData:AxiosResponse<{isAuthenticated:boolean}> = await axiosInstance.get('/api/v1/auth/check')
    return resData
}

export const resetPassword = async(passwordToken:string, data:{passwordConfirm:string, password:string}):Promise<AxiosResponse<{status:string, token:string}>>=>{
    return axiosInstance.patch(`/api/v1/users/resetpassword/${passwordToken}`, data)
}

export const forgotPassword = async(email:string):Promise<AxiosResponse<{status:string, message:string}>>=>{
    return axiosInstance.post(`/api/v1/users/forgotPassword`, {email})
}