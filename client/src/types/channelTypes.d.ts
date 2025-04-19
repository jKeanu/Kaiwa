import { Socket } from 'socket.io-client';
import { User } from './userTypes';
import { FIdChannelInfo, Friend, FriendReq, SentReq } from './friendTypes';
import { SetStateAction } from 'react';

export type ChannelSectionProps = {
    socket: Socket | undefined;
    currentUserData: User;
    fIdAndChannelInfos: FIdChannelInfo[];
    handleNewFriendChannel: (friendInfo: Friend) => void;
    setSentReqs: React.Dispatch<React.SetStateAction<SentReq[]>>;
    setFriendReqs: React.Dispatch<React.SetStateAction<FriendReq[]>>;
    friendReqs: FriendReq[];
    sentReqs: SentReq[];
    formatToTodayIfCurrentDate: (dateStr: string) => string;
    setMessageLimit: React.Dispatch<SetStateAction<number>>;
    messageLimit: number;
};

//This is our ideal format for the channels
//Since the imlementation of the group channel is similar to this,
//We can just assign this type to groups.
export type Channel = {
    channelName: string;
    channelNumber: number;
    channelType: string;
    id: string;
    lastMessage: number | Date;
    photo: string;
    _id: string;
    photoUrl: string;
    formattedLastMessage: string;
    seen: string[];
};

//Since the implementation of Friend Channel and Group Channel is different
//there are missing fields
export type CurrentChannel = {
    _id: string;
    id: string;
    channelName?: string;
    groupLeader?: string;
    members: ChannelMember[];
    channelType: string;
    channelNumber: number;
    photo?: string;
    photoUrl?: string;
    lastMessage: number;
    formattedLastMessage: string;
    seen: string[];
};

export type ChannelMember = {
    _id: string;
    displayName: string;
    photo: string;
    photoUrl: string;
    friendTag: string;
    status: string;
};

export type ChannelMessage = {
    sender: {
        _id: string;
        displayName: string;
        photo: string;
        photoUrl: string;
        friendTag: string;
    };
    channel: string;
    content: string[];
    formattedDate: string;
    time: number | Date;
    _id?: string;
    updated?: true;
    notSent?: boolean;
};

export type ChannelDataStatus = {
    status: string;
    channel: CurrentChannel;
};

export type ChannelMessagesStatus = {
    status: string;
    messages: ChannelMessage[];
    notSentMessages?: string[];
};

export type ChannelMemberUpdate = {
    user: ChannelMember;
    channelNumber: number;
    type: string;
    newTime: number;
};

//Friend
export type InviteFriend = {
    socket: Socket | undefined;
    channelId: string;
    currChannelMembersId: string[];
    handleCloseButton: (e: React.MouseEvent<HTMLButtonElement>) => void;
    channelNumber: string | undefined;
    setModalDisabled: React.Dispatch<SetStateAction<boolean>>;
    modalDisabled: boolean;
};

//Live Updates
export type LastMessageUpdate = {
    channelId: string;
    channelNumber: number;
    newTime: Date | number;
    message: ChannelMessage;
    newFormattedTime: string | undefined;
    seen: string[];
};

export type NewChannel = {
    _id: string;
    channelType: string;
    channelNumber: number;
    lastMessage: number | Date;
    formattedLastMessage: string;
    id: string;
    members: ChannelMember[];
    seen: string[];
};

//useReducer type
export enum ActionType {
    InitialFetch = 'INITIALFETCH',
    NewMessage = 'NEWMESSAGE',
    Seen = 'SEEN',
    NewChannel = 'NEWCHANNEL',
    DeleteChannel = 'DELETECHANNEL',
    Unfriend = 'Unfriend',
    NewMember = 'NEWMEMBER',
}

type InitialFetch = {
    type: ActionType.InitialFetch;
    payload: Channel[];
};

type NewChannelMessage = {
    type: ActionType.NewMessage;
    payload: {
        location: string;
        newMessageInfo: LastMessageUpdate;
        currUserId: string;
    };
};

type DeleteChannel = {
    type: ActionType.DeleteChannel;
    payload: {
        channelId: string;
    };
};

type ChannelSeen = {
    type: ActionType.Seen;
    payload: {
        channelId: string;
        currUserId: string;
    };
};

type NewMember = {
    type: ActionType.NewMember;
    payload: {
        channelNumber: number;
        newTime: number;
    };
};

type AddNewChannel = {
    type: ActionType.NewChannel;
    payload: {
        data: Channel;
    };
};

export type ChannelAction =
    | DeleteChannel
    | InitialFetch
    | ChannelSeen
    | NewChannelMessage
    | NewMember
    | AddNewChannel;
