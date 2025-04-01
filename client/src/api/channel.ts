import { AxiosResponse } from "axios";
import { ChannelDataStatus, ChannelMessagesStatus, CurrentChannel } from "../types/channelTypes";
import axiosInstance from "./axiosInstance";

export const channelFetcher = async (endpoint: string):Promise<CurrentChannel> => {
    const response:AxiosResponse<ChannelDataStatus> = await axiosInstance.get(`/${endpoint}`)
    return response.data.channel;
}


export const messageFetcher = async (endpoint: string, limit: number, skip: number)
    :Promise<ChannelMessagesStatus> => {
    const response = await axiosInstance.get(`/${endpoint}?limit=${limit}&skip=${skip}`)
    return response.data
}