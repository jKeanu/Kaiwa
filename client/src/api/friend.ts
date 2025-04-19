import { AxiosResponse } from 'axios';
import axiosInstance from './axiosInstance';
import { AcceptFriendStatus, AddFriendStatus } from '../types/friendTypes';

export const addFriend = (
    displayName: string,
    friendTag: string
): Promise<AxiosResponse<AddFriendStatus>> => {
    return axiosInstance.post(`/api/v1/me/friends`, { displayName, friendTag });
};

export const acceptFriend = (pendingUserId: string): Promise<AxiosResponse<AcceptFriendStatus>> => {
    return axiosInstance.patch(`/api/v1/me/friends/${pendingUserId}/accept`, '');
};

export const declineFriend = (pendingUserId: string): Promise<AxiosResponse<void>> => {
    return axiosInstance.delete(`/api/v1/me/friends/${pendingUserId}/decline`);
};

export const removeFriend = (friendId: string): Promise<AxiosResponse<void>> => {
    return axiosInstance.delete(`/api/v1/me/friends/${friendId}/unfriend`);
};
