import React from 'react'
import {Socket} from 'socket.io-client'

// export interface LocalStorage {
//     getItem(key: string): string | null;
//     removeItem(key:string): void;
//     setItem(key: string, value: string): void;
// }

//This is our ideal format for the channels
//Since the imlementation of the group channel is similar to this,
//We can just assign this type to groups.
export type Channel = {
    channelName: string, 
    channelNumber: number,
    id: string,
    lastMessage: number | Date,
    photo:string,
    _id:string
}

export type Friend = {
    channel:{
        channelNumber:number,
        id:string,
        lastMessage: number,
        _id:string
    },
    friend:{
        displayName:string,
        friendTag:string,
        photo:string,
        _id:string,
    },
    status:string,
    _id: string

}

export type User = {
    _id:string,
    photo:string,
    displayName:string,
    email:string,
    friendTag:string,
    friends?:Friend[],
    groups?:Channel[],
}

export type UserDataStatus={
    status:string,
    user:User
}

export type AuthStatus={
    status:string,
    token:string
}

export type RegisterForm={
    email:string,
    password:string,
    passwordConfirm:string,
    displayName:string
}


//Friend
export type FriendDetails={
    _id:string,
    displayName:string,
    photo:string,
    friendTag:string,
}

export type LeftSectionProps ={
    channels: Channel[];  // Assuming Channel is a defined type or interface
    handleLogout: (e:React.MouseEvent<HTMLButtonElement>) => void;
    currentUserData: User; 
}

export type ChannelSectionProps={
    token: string,
    socket: Socket|undefined,
    currentUserData: User,
    myFriends:FriendDetails[],
}

export type ChannelMember={
    _id:string,
    displayName:string,
    photo:string,
    friendTag:string,
}

export type ChannelMessage={
    sender:{
        _id: string,
        displayName: string,
        photo: string,
        friendTag:string,
    },
    channel:string,
    content:string[],
    formattedDate:string,
    time:number|Date,
    _id?:string,
    updated?:true
}

//Since the implementation of Friend Channel and Group Channel is different
//there are missing fields 
export type CurrentChannel={
    _id:string,
    id:string,
    channelName?:string,
    groupLeader?:string,
    members:ChannelMember[],
    channelType: string,
    channelNumber: number,
    photo?: string,
    lastMessage:number,
    messages?:ChannelMessage[]
}

export type ChannelDataStatus={
    status:string,
    channel:CurrentChannel
}

export type ChannelMessagesStatus={
    status:string,
    messages:ChannelMessage[]
}

export type ChannelMemberUpdate={
    invitedUser:ChannelMember,
    channelNumber:string,
}

//Modals
export type ModalWindow={
    isOpen:Boolean,
    window:string
}

export type InviteFriend={
    friends:FriendDetails[],
    socket: Socket|undefined,
    token:string,
    channelId: string,
    currChannelMembersId:string[]
    handleCloseButton:(e:React.MouseEvent<HTMLButtonElement>)=>void
    channelNumber:string|undefined
}

export type DeleteGroup={
    token:string,
    channelId:string
    handleCloseButton:(e:React.MouseEvent<HTMLButtonElement>)=>void
}

export type LeaveGroup={
    token:string,
    channelId:string
    handleCloseButton:(e:React.MouseEvent<HTMLButtonElement>)=>void
}