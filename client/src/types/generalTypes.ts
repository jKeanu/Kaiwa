import React, { SetStateAction } from 'react'
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
    _id:string,
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

export type FIdChannelInfo={
    channelNumber: number,
    friendId: string,
    channelId: string
}

//props
export type LeftSectionProps ={
    channels: Channel[],  // Assuming Channel is a defined type or interface
    handleLogout: (e:React.MouseEvent<HTMLButtonElement>) => void,
    currentUserData: User,
    friendsInfo:FriendDetails[],
    token:string,
    socket:Socket|undefined,
    setChannels:React.Dispatch<SetStateAction<Channel[]>>
}

export type ChannelSectionProps={
    token: string,
    socket: Socket|undefined,
    currentUserData: User,
    myFriends:FriendDetails[],
    setChannels: React.Dispatch<SetStateAction<Channel[]>>,
    fIdAndChannelInfos: FIdChannelInfo[],
    handleFriendChannelDelete:(channelId:string)=>void,
    handleNewFriendChannel: (friendInfo:Friend)=>void,
    setSentReqs: React.Dispatch<React.SetStateAction<SentReq[]>>,
    setFriendReqs: React.Dispatch<React.SetStateAction<FriendReq[]>>,
    friendReqs:FriendReq[],
    sentReqs: SentReq[]
}

export type HomeSectionProps={
    friendReqs:FriendReq[]
    friendChannels:Friend[],
    currUserId: string,
    socket:Socket|undefined,
    token:string,
    handleFriendChannelDelete:(channelId:string)=>void,
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
    lastMessage:number
}

export type ChannelDataStatus={
    status:string,
    channel:CurrentChannel
}

export type ChannelMessagesStatus={
    status:string,
    messages:ChannelMessage[],
    updateType?:string,
    loadedMessage?:number
}

export type ChannelMemberUpdate={
    user:ChannelMember,
    channelNumber:number,
    type:string
}

export type CreateGroupStatus={
    status:string,
    newChannel:{
        channelName:string,
        groupLeader:string,
        members:string[],
        channelType:string,
        _id:string,
        id:string,
        channelNumber:number,
        lastMessage:Date,
        photo:string,
        __v:number
    }
}

//Modals----

//state types
export type ModalWindow={
    isOpen:boolean,
    window:string
}

export type UnfriendModalSettings={
    isOpen:boolean,
    ids:{
        friendId:string,
        channelId:string,
    },
    displayName:string,
    channelNumber: number|undefined
}

export type MemberModalSettings={
    isOpen:boolean,
    type:string
    ids:{
        memberId:string,
        channelId:string,
    },
    displayName:string,
    channelNumber:number|undefined
}

export type NoticeModalSettings={
    isOpen:boolean,
    channelId:string,
    type:string

}

//Modal window props
export type Notice={
    handleModalConfirm:(e:React.MouseEvent<HTMLButtonElement>)=>void
}

//Friend
export type InviteFriend={
    friends:FriendDetails[],
    socket: Socket|undefined,
    token:string,
    channelId: string,
    currChannelMembersId:string[]
    handleCloseButton:(e:React.MouseEvent<HTMLButtonElement>)=>void
    channelNumber:string|undefined,
    setChannels:React.Dispatch<SetStateAction<Channel[]>>
    setModalDisabled:React.Dispatch<SetStateAction<boolean>>,
    modalDisabled: boolean
}


//Group
export type DeleteGroup={
    token:string,
    channelId:string
    handleCloseButton:(e:React.MouseEvent<HTMLButtonElement>)=>void,
    setChannels: React.Dispatch<SetStateAction<Channel[]>>,
    socket: Socket|undefined,
    membersId:string[],
    channelNumber: string|undefined
    setModalDisabled:React.Dispatch<SetStateAction<boolean>>
}


export type LeaveGroup={
    token:string,
    channelId:string
    handleCloseButton:(e:React.MouseEvent<HTMLButtonElement>)=>void,
    setChannels: React.Dispatch<SetStateAction<Channel[]>>,
    socket: Socket|undefined,
    currUserId: string,
    channelNumber: string | undefined
    setModalDisabled:React.Dispatch<SetStateAction<boolean>>
}

export type CreateGroup={
    token:string,
    currUserId:string,
    friendsInfo:FriendDetails[],
    socket:Socket|undefined,
    handleCloseButton:(e:React.MouseEvent<HTMLButtonElement>)=>void,
    setChannels:React.Dispatch<SetStateAction<Channel[]>>,
    setIsDisabled: React.Dispatch<SetStateAction<boolean>>,
    setModal: React.Dispatch<SetStateAction<boolean>>
}

export type UnfriendProps={
    token:string,
    channelId:string,
    friendId:string,
    socket:Socket|undefined,
    displayName:string
    handleFriendChannelDelete:(channelId:string)=>void,
    handleCloseButton:(e:React.MouseEvent<HTMLButtonElement>)=>void,
    setModalSettings: React.Dispatch<SetStateAction<UnfriendModalSettings>>,
    channelNumber:number|undefined
}

export type MemberUnfriend ={
    token:string,
    channelId:string,
    memberId:string,
    socket:Socket|undefined,
    displayName:string
    handleFriendChannelDelete:(channelId:string)=>void,
    handleCloseButton:(e:React.MouseEvent<HTMLButtonElement>)=>void,
    setModalSettings: React.Dispatch<SetStateAction<MemberModalSettings>>,
    channelNumber:number|undefined 
    setModalDisabled:React.Dispatch<SetStateAction<boolean>>
}

export type ChangeLeader={
    token: string,
    channelId: string,
    handleCloseButton:(e:React.MouseEvent<HTMLButtonElement>)=>void,
    channelNumber: number|undefined,
    socket: Socket | undefined,
    setModalSettings: React.Dispatch<SetStateAction<MemberModalSettings>>,
    memberId: string,
    displayName:string
    setModalDisabled:React.Dispatch<SetStateAction<boolean>>
}

//Live Updates----
export type LastMessageUpdate = {
    channelId:string,
    channelNumber: number,
    newTime:Date|number,
    message:ChannelMessage,
    channelType:string
}

export type UserStatusUpdate= {
    channelId: string,
    channelNumber: number, 
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
//Sub-comp----
//Friend
export type FriendListProps={
    friends:Friend[],
    token: string,
    handleFriendChannelDelete:(channelId:string)=>void,
    socket:Socket|undefined,
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


//Socket event-listener param---
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