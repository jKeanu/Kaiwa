import { AxiosResponse } from "axios";
import { AuthStatus, RegisterForm } from "../types/generalTypes";
import axiosInstance from "./axiosInstance";

export const registerUser = (formData:RegisterForm):Promise<AxiosResponse<AuthStatus>> => {
    return axiosInstance.post(`/api/v1/users/register`, formData);
};

export const loginUser = (email:string, password:string):Promise<AxiosResponse<AuthStatus>> => {
    return axiosInstance.post(`/api/v1/users/login`, { email, password });
};


export const isLoggedIn = async ()=>{
    const resData:AxiosResponse<{isAuthenticated:boolean}> = await axiosInstance.get('/api/v1/auth/check')
    return resData
}