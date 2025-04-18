import { AxiosResponse } from "axios"
import axiosInstance from "./axiosInstance"
import { UpdateUserStatus, UserDataStatus } from "../types/userTypes"

export const getCurrUserFetcher = async(endpoint:string):Promise<UserDataStatus> =>{
    const response:AxiosResponse<UserDataStatus> = await axiosInstance.get(`/${endpoint}`)
    return response.data
}

export const changeUserPassword = async (
    passwordInfo:{currentPassword:string, password:string}):Promise<AxiosResponse<{status:string}>>=>{
        return axiosInstance.patch(`/api/v1/users/changepassword`, passwordInfo)  
    }


export const updateCurrentUser = async (userInfo:FormData):Promise<AxiosResponse<UpdateUserStatus>>=>{
    return axiosInstance.patch(`/api/v1/users/updateMe`, userInfo)
}