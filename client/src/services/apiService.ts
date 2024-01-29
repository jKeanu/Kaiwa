import axios, {AxiosResponse} from 'axios';
import { AuthStatus, UserDataStatus, RegisterForm, ChannelDataStatus, User } from '../types/generalTypes';
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


export const messageFetcher = (endpoint: string, limit: number, skip: number, headers: Record<string, string> = {}) => 
    axios.get<{status: string, messages: ChannelMessage[]}>(`${API_URL}/${endpoint}?limit=${limit}&skip=${skip}`, { headers })
            .then(response => response.data);

export const getCurrentUser = async(token:string|null):Promise<AxiosResponse<UserDataStatus>> => {
    const config ={
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
    return axios.get(`${API_URL}/api/v1/users/me`, config)
}

export const currUserDataFetcher = (endpoint:string, token:string|null)=>
    axios.get<{status:string, user:User}>(`${API_URL}/${endpoint}`, {headers:{'Authorization': `Bearer ${token}`}})
            .then(response=>response.data)