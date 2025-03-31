import { AxiosResponse } from "axios";
import axiosInstance from "./axiosInstance";
import { CreateGroupStatus, UpdateGroupStatus } from "../types/generalTypes";

export const inviteFriendtoGroup = (token:string, newTime:number, channelId:string, userId:string):Promise<AxiosResponse<{status:string}>>=>{
    const config ={
        headers:{
            'Authorization': `Bearer ${token}`
        }
    }
    return axiosInstance.patch(`/api/v1/groups/${channelId}/invite`, {userId, newTime}, config)   
}

//Group
export const createGroup = (token:string, members:string[], channelName:string):Promise<AxiosResponse<CreateGroupStatus>>=>{
    const config ={
        headers:{
            'Authorization': `Bearer ${token}`
        }
    }
    return axiosInstance.post(`/api/v1/groups`, {members, channelName}, config)
}

export const deleteGroup = (token:string, channelId:string):Promise<AxiosResponse<void>>=>{
    const config ={
        headers:{
            'Authorization': `Bearer ${token}`
        }
    };
    return axiosInstance.delete(`/api/v1/groups/${channelId}`, config)
}

export const leaveGroup = (token:string, channelId:string):Promise<AxiosResponse<void>>=>{
    const config = {
        headers:{
            'Authorization': `Bearer ${token}`
        }
    };
    return axiosInstance.delete(`/api/v1/me/groups/${channelId}/leave`, config)
}

export const changeGroupLeader = (token:string, channelId:string, userId:string):Promise<AxiosResponse<{status:string}>>=>{
    const config ={
        headers:{
            'Authorization': `Bearer ${token}`
        }
    };
    return axiosInstance.patch(`/api/v1/groups/${channelId}/changeleader`, {userId}, config)
}

export const changeGroupSettings = (token:string, groupId:string,groupInfo:FormData)
    :Promise<AxiosResponse<UpdateGroupStatus>>=>{
    const config={
        headers:{
            'Authorization': `Bearer ${token}`
        }
    }
    return axiosInstance.patch(`/api/v1/groups/${groupId}/update`, groupInfo, config)
}