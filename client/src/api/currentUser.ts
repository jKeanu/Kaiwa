import { AxiosResponse } from "axios"
import axiosInstance from "./axiosInstance"
import { UpdateUserStatus, UserDataStatus } from "../types/generalTypes"

export const getCurrUserFetcher = async(endpoint:string):Promise<UserDataStatus> =>{
    const response:AxiosResponse<UserDataStatus> = await axiosInstance.get(`/${endpoint}`)
    return response.data
}

export const resetPassword = async(passwordToken:string, data:{passwordConfirm:string, password:string}):Promise<AxiosResponse<{status:string, token:string}>>=>{
    return axiosInstance.patch(`/api/v1/users/resetpassword/${passwordToken}`, data)
}

export const forgotPassword = async(email:string):Promise<AxiosResponse<{status:string, message:string}>>=>{
    return axiosInstance.post(`/api/v1/users/forgotPassword`, {email})
}

export const changeUserPassword = async (
    passwordInfo:{currentPassword:string, password:string, passwordConfirm:string}):Promise<AxiosResponse<{status:string, token:string}>>=>{
        return axiosInstance.patch(`/api/v1/users/changepassword`, passwordInfo)  
    }


export const updateCurrentUser = async (userInfo:FormData):Promise<AxiosResponse<UpdateUserStatus>>=>{
    return axiosInstance.patch(`/api/v1/users/updateMe`, userInfo)
}