import axios, {AxiosResponse} from 'axios';
import { AuthStatus, UserDataStatus, RegisterForm, ChannelDataStatus, User, AcceptFriendStatus, AddFriendStatus, CreateGroupStatus, ChannelMessagesStatus, UpdateUserStatus, UpdateGroupStatus } from '../types/generalTypes';
import { ChannelMessage } from '../types/generalTypes';

const API_URL = import.meta.env.VITE_API_URL;

export const registerUser = async (formData:RegisterForm):Promise<AxiosResponse<AuthStatus>> => {
    return axios.post(`${API_URL}/api/v1/users/register`, formData);
};

export const loginUser = async (email:string, password:string):Promise<AxiosResponse<AuthStatus>> => {
    return axios.post(`${API_URL}/api/v1/users/login`, { email, password });
};

export const getCurrentChannel = async(token:string, channelNumber:string|undefined):Promise<AxiosResponse<ChannelDataStatus>>=>{
    const config ={
        headers:{
            'Authorization': `Bearer ${token}`
        }
    };
    return axios.get(`${API_URL}/api/v1/channels/${channelNumber}`, config)
}

export const inviteFriendtoGroup = async(token:string, newTime:number, channelId:string, userId:string):Promise<AxiosResponse<{status:string}>>=>{
    const config ={
        headers:{
            'Authorization': `Bearer ${token}`
        }
    };
    return axios.patch(`${API_URL}/api/v1/groups/${channelId}/invite`, {userId, newTime}, config)
    
}

//Group
export const createGroup = async(token:string, members:string[], channelName:string):Promise<AxiosResponse<CreateGroupStatus>>=>{
    const config ={
        headers:{
            'Authorization': `Bearer ${token}`
        }
    }
    return axios.post(`${API_URL}/api/v1/groups`, {members, channelName}, config)
}

export const deleteGroup = async(token:string, channelId:string):Promise<AxiosResponse<void>>=>{
    const config ={
        headers:{
            'Authorization': `Bearer ${token}`
        }
    };
    return axios.delete(`${API_URL}/api/v1/groups/${channelId}`, config)
}

export const leaveGroup = async(token:string, channelId:string):Promise<AxiosResponse<void>>=>{
    const config ={
        headers:{
            'Authorization': `Bearer ${token}`
        }
    };
    return axios.delete(`${API_URL}/api/v1/me/groups/${channelId}/leave`, config)
}

export const changeGroupLeader = async(token:string, channelId:string, userId:string):Promise<AxiosResponse<{status:string}>>=>{
    const config ={
        headers:{
            'Authorization': `Bearer ${token}`
        }
    };
    return axios.patch(`${API_URL}/api/v1/groups/${channelId}/changeleader`, {userId}, config)
}

export const changeGroupSettings = async(token:string, groupId:string,groupInfo:FormData):Promise<AxiosResponse<UpdateGroupStatus>>=>{
    const config={
        headers:{
            'Authorization': `Bearer ${token}`
        }
    }
    return axios.patch(`${API_URL}/api/v1/groups/${groupId}/update`, groupInfo, config)
}

export const addFriend = async(token:string, displayName:string, friendTag:string):Promise<AxiosResponse<AddFriendStatus>>=>{
    const config={
        headers:{
            'Authorization': `Bearer ${token}`
        }
    }
    return axios.post(`${API_URL}/api/v1/me/friends`, {displayName, friendTag}, config)
}

export const acceptFriend = async(token:string, pendingUserId:string):Promise<AxiosResponse<AcceptFriendStatus>>=>{
    console.log(token, '---')
    const config ={
        headers:{
            'Authorization': `Bearer ${token}`
        }
    }
    return axios.patch(`${API_URL}/api/v1/me/friends/${pendingUserId}/accept`, '', config)}


export const declineFriend = async(token:string, pendingUserId:string):Promise<AxiosResponse<void>>=>{
    const config = {
        headers:{
            'Authorization': `Bearer ${token}`
        }
    }
    return axios.delete(`${API_URL}/api/v1/me/friends/${pendingUserId}/decline`, config)
}

export const removeFriend = async(token:string, friendId:string):Promise<AxiosResponse<void>>=>{
    const config = {
        headers:{
            'Authorization': `Bearer ${token}`
        }
    } 
    return axios.delete(`${API_URL}/api/v1/me/friends/${friendId}/unfriend`, config)
}

export const channelFetcher = async (endpoint: string, token:string) => {
    const config ={
        headers:{
            'Authorization': `Bearer ${token}`
        }
    }
    return axios.get(`${API_URL}/${endpoint}`, config).then(res => res.data);
}


export const messageFetcher = async (endpoint: string, limit: number, skip: number, token:string):Promise<ChannelMessagesStatus> => {
    const config ={
        headers:{
            'Authorization': `Bearer ${token}`
        }
    }
    return axios.get(`${API_URL}/${endpoint}?limit=${limit}&skip=${skip}`, config)
            .then(response => {
                return response.data
            });
}

export const getCurrUserFetcher = async(endpoint:string, token:string):Promise<UserDataStatus> =>{
    const config ={
        headers:{
            'Authorization': `Bearer ${token}`
        }
    }
    return axios.get(`${API_URL}/${endpoint}`, config).then(response => response.data)
}

export const resetPassword = async(passwordToken:string, data:{passwordConfirm:string, password:string}):Promise<AxiosResponse<{status:string, token:string}>>=>{
    return axios.post(`${API_URL}/api/v1/users/resetpassword/${passwordToken}`, data)
}

export const forgotPassword = async(email:string):Promise<AxiosResponse<{status:string, message:string}>>=>{
    return axios.post(`${API_URL}/api/v1/users/forgotPassword`, {email})
}