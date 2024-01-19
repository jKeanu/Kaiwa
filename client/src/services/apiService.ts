import axios, {AxiosResponse} from 'axios';
import { AuthStatus, UserDataStatus, RegisterForm, ChannelDataStatus } from '../types/generalTypes';

const API_URL = import.meta.env.VITE_API_URL;

export const registerUser = async (formData:RegisterForm):Promise<AxiosResponse<AuthStatus>> => {
    return axios.post(`${API_URL}/api/v1/users/register`, formData);
};

export const loginUser = async (email:string, password:string):Promise<AxiosResponse<AuthStatus>> => {
    return axios.post(`${API_URL}/api/v1/users/login`, { email, password });
};

export const getCurrentUser = async(token:string|null):Promise<AxiosResponse<UserDataStatus>> => {
    const config ={
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
    return axios.get(`${API_URL}/api/v1/users/me`, config)
}

export const getCurrentChannel = async(token:string, channelNumber:string|undefined):Promise<AxiosResponse<ChannelDataStatus>>=>{
    const config ={
        headers:{
            'Authorization': `Bearer ${token}`
        }
    };
    return axios.get(`${API_URL}/api/v1/channels/${channelNumber}`, config)
}

export const inviteFriendtoGroup = async(token:string, channelId:string, userId:string):Promise<AxiosResponse<{status:string}>>=>{
    const config ={
        headers:{
            'Authorization': `Bearer ${token}`
        }
    };
    return axios.patch(`${API_URL}/api/v1/groups/${channelId}/invite`, {userId}, config)
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


export const channelFetcher = (endpoint: string, headers: Record<string, string> = {}) => 
    axios.get(`${API_URL}/${endpoint}`, { headers}).then(res => res.data);
