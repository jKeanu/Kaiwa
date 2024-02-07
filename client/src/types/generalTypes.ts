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
    channelType:string,
    id: string,
    lastMessage: number | Date,
    photo:string,
    _id:string
}

export type Friend = {
    channel:{
        channelNumber:number,
        id:string,
        lastMessage: number|Date,
        _id:string,
        channelType:string
    },
    friend:FriendDetails,
    status:string,
    _id: string
}

export type User = {
    _id:string,
    photo:string,
    displayName:string,
    email:string,
    status:string,
    friendTag:string,
    friends:Friend[],
    groups:Channel[],
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
    status:string
}

export type FriendReq={
    friend:FriendDetails,
    _id: string,
    status:string,
}

export type SentReq={
    friend:FriendDetails,
    _id: string,
    status:string
}

export type AddFriendStatus={
    status:string,
    pendingRequestDetails:FriendReq,
    sentRequestDetails:SentReq
}

//props
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

export type HomeSectionProps={
    friendReqs:FriendReq[]
    friendChannels:Friend[],
    currUserId: string,
    socket:Socket|undefined,
    token:string,
    handleNewFriendChannel: (friendInfo:Friend)=>void,
    setFriendReqs: React.Dispatch<React.SetStateAction<FriendReq[]>>,
    setSentReqs: React.Dispatch<React.SetStateAction<SentReq[]>>
}

export type ChannelMember={
    _id:string,
    displayName:string,
    photo:string,
    friendTag:string,
    status:string
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

//Live Updates
export type LastMessageUpdate = {
    channelId:string,
    channelNumber:string,
    newTime:Date|number,
    message:ChannelMessage,
    channelType:string
}

export type UserStatusUpdate= {
    channelId: string,
    channelNumber: string, 
    userId: string,
    type?:string
}

export type NewChannel={
    _id:string,
    channelType:string,
    channelNumber:number,
    lastMessage:number|Date,
    id:string,
    members:ChannelMember[]
}

export type AcceptFriendStatus={
    status:string,
    newChannel:NewChannel
}
//Sub-comp
//Friend
export type FriendListProps={
    friends:Friend[],
    token: string
}

export type FriendReqProps={
    token:string,
    pendingRequests:FriendReq[],
    handleNewFriendChannel: (friendInfo:Friend)=>void,
    setFriendReqs: React.Dispatch<React.SetStateAction<FriendReq[]>>,
    socket: Socket|undefined,
    currUserId:string
}

export type AddFriendProps={
    token:string,
    socket: Socket|undefined,
    setSentReqs: React.Dispatch<React.SetStateAction<SentReq[]>>
}

//Socket event-listener param
export type FriendRequestAccepted={
    newChannelInfo:{
        channelNumber:number,
        channelType:string,
        lastMessage: number | Date,
        _id: string,
        id: string
    },
    newFriendId:string
}