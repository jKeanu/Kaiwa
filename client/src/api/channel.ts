import { ChannelDataStatus, ChannelMessagesStatus } from "../types/channelTypes";
import axiosInstance from "./axiosInstance";

export const channelFetcher = async (endpoint: string):Promise<ChannelDataStatus> => {
    const response = await axiosInstance.get(`/${endpoint}`)
    return response.data;
}


export const messageFetcher = async (endpoint: string, limit: number, skip: number)
    :Promise<ChannelMessagesStatus> => {
    const response = await axiosInstance.get(`/${endpoint}?limit=${limit}&skip=${skip}`)
    return response.data
}