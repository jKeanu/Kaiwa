import { AxiosResponse } from "axios";
import axiosInstance from "./axiosInstance";
import { CreateGroupStatus, UpdateGroupStatus } from "../types/groupTypes";

export const inviteFriendtoGroup = (newTime:number, channelId:string, userId:string):Promise<AxiosResponse<{status:string}>>=>{
    return axiosInstance.patch(`/api/v1/groups/${channelId}/invite`, {userId, newTime})   
}

//Group
export const createGroup = (members:string[], channelName:string):Promise<AxiosResponse<CreateGroupStatus>>=>{
    return axiosInstance.post(`/api/v1/groups`, {members, channelName})
}

export const deleteGroup = (channelId:string):Promise<AxiosResponse<void>>=>{
    return axiosInstance.delete(`/api/v1/groups/${channelId}`)
}

export const leaveGroup = (channelId:string):Promise<AxiosResponse<void>>=>{
    return axiosInstance.delete(`/api/v1/me/groups/${channelId}/leave`)
}

export const changeGroupLeader = (channelId:string, userId:string):Promise<AxiosResponse<{status:string}>>=>{
    return axiosInstance.patch(`/api/v1/groups/${channelId}/changeleader`, {userId})
}

export const changeGroupSettings = (groupId:string,groupInfo:FormData)
    :Promise<AxiosResponse<UpdateGroupStatus>>=>{
    return axiosInstance.patch(`/api/v1/groups/${groupId}/update`, groupInfo)
}