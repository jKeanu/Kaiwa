import React, { SetStateAction, Dispatch } from 'react'
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
    photoUrl: string,
    formattedLastMessage: string,
    seen: string[]
}

export type Friend = {
    channel:{
        channelNumber:number,
        id:string,
        lastMessage: number|Date,
        _id:string,
        channelType:string,
        formattedLastMessage: string,
        seen: string[]
    },
    friend:FriendDetails,
    status:string,
    _id: string
}

export type User = {
    _id:string,
    photo:string,
    photoUrl:string,
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

export type UpdateUserStatus={
    status:string,
    user:{
        _id:string,
        displayName:string,
        photo:string,
        photoUrl:string,
        friendTag: string,
        id:string
    }
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
    photoUrl:string,
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
    friendReqs:FriendReq[], 
    setIsFriendsOpen: React.Dispatch<SetStateAction<boolean>>,
    formatToTodayIfCurrentDate: (dateStr:string) => string
}

export type ChannelSectionProps={
    token: string,
    socket: Socket|undefined,
    currentUserData: User,
    fIdAndChannelInfos: FIdChannelInfo[],
    handleNewFriendChannel: (friendInfo:Friend)=>void,
    setSentReqs: React.Dispatch<React.SetStateAction<SentReq[]>>,
    setFriendReqs: React.Dispatch<React.SetStateAction<FriendReq[]>>,
    friendReqs:FriendReq[],
    sentReqs: SentReq[],
    formatToTodayIfCurrentDate: (dateStr:string) => string
}

export type HomeSectionProps={
    isFriendsOpen: boolean
    friendReqs:FriendReq[]
    friendChannels:Friend[],
}

export type ChannelMember={
    _id:string,
    displayName:string,
    photo:string,
    photoUrl:string,
    friendTag:string,
    status:string
}

export type ChannelMessage={
    sender:{
        _id: string,
        displayName: string,
        photo: string,
        photoUrl:string
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
    photoUrl?:string
    lastMessage:number,
    formattedLastMessage: string,
    seen: string[]
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
    type:string,
    newTime: number
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
        formattedLastMessage: string,
        lastMessage:Date,
        photo:string,
        photoUrl:string
        seen: string[],
        __v: number
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
    socket: Socket|undefined,
    token:string,
    channelId: string,
    currChannelMembersId:string[]
    handleCloseButton:(e:React.MouseEvent<HTMLButtonElement>)=>void
    channelNumber:string|undefined,
    setModalDisabled:React.Dispatch<SetStateAction<boolean>>,
    modalDisabled: boolean,
}


//Group
export type DeleteGroup={
    token:string,
    channelId:string
    handleCloseButton:(e:React.MouseEvent<HTMLButtonElement>)=>void,
    socket: Socket|undefined,
    membersId:string[],
    channelNumber: string|undefined
    setModalDisabled:React.Dispatch<SetStateAction<boolean>>
}


export type LeaveGroup={
    token:string,
    channelId:string
    handleCloseButton:(e:React.MouseEvent<HTMLButtonElement>)=>void,
    socket: Socket|undefined,
    currUserId: string,
    channelNumber: string | undefined
    setModalDisabled:React.Dispatch<SetStateAction<boolean>>
}

export type CreateGroup={
    currUserId:string,
    setIsDisabled: React.Dispatch<SetStateAction<boolean>>,
    setModal: React.Dispatch<SetStateAction<{active:boolean, type:string}>>,
    handleCloseButton: (e:React.MouseEvent<HTMLButtonElement>)=>void
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
    channelNumber:number|undefined,
    setIsModalDisabled: React.Dispatch<SetStateAction<boolean>>
}

export type GroupSettingsProps = {
    channelName: string,
    token: string,
    socket: Socket | undefined,
    groupPhotoUrl: string,
    groupPhoto: string,
    channelId: string,
    setCurrentChannel: React.Dispatch<SetStateAction<CurrentChannel|undefined>>,
    handleCloseButton:(e:React.MouseEvent<HTMLButtonElement>)=>void,
    setModalDisabled:React.Dispatch<SetStateAction<boolean>>,
    setModalWindow: React.Dispatch<SetStateAction<{window:string, isOpen:boolean}>>
}

export type MemberUnfriend = {
    token:string,
    channelId:string,
    memberId:string,
    socket:Socket|undefined,
    displayName:string
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


export type UpdateGroupStatus = {
    status: string,
    group:{
        _id:string,
        channelName:string,
        photo:string,
        id:string,
        photoUrl: string
    }
}

//Current User 
export type ProfileSettings={
    currUserData: User,
    setModal: React.Dispatch<SetStateAction<{active:boolean, type:string}>>,
    handleCloseButton: (e:React.MouseEvent<HTMLButtonElement>)=>void,
    setIsDisabled: React.Dispatch<SetStateAction<boolean>>
}

//Live Updates----
export type LastMessageUpdate = {
    channelId:string,
    channelNumber: number,
    newTime:Date|number,
    message:ChannelMessage,
    newFormattedTime: string | undefined,
    seen: string[]
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
    formattedLastMessage: string,
    id:string,
    members:ChannelMember[],
    seen: string[]
}

export type AcceptFriendStatus={
    status:string,
    newChannel:NewChannel
}
//Sub-comp----
//Friend
export type FriendListProps={
    friends:Friend[],
    setIsFriendConnection: React.Dispatch<SetStateAction<boolean>>
}

export type FriendReqProps={
    pendingRequests:FriendReq[],
    currComponent: string
}

export type AddFriendProps={
    currComponent: string
}


//Socket event-listener param---
export type FriendRequestAccepted={
    newChannelInfo:{
        channelNumber:number,
        channelType:string,
        lastMessage: number | Date,
        _id: string,
        id: string,
        formattedLastMessage: string,
        seen: string[]
    },
    newFriendId:string
}

//Context Api
export type HomeContext={
    token:string,
    currUserId:string,
    socket: Socket|undefined,
    handleNewFriendChannel: (friendInfo:Friend)=>void,
    setFriendReqs: React.Dispatch<React.SetStateAction<FriendReq[]>>,
    setSentReqs: React.Dispatch<React.SetStateAction<SentReq[]>>,
    handleFriendChannelDelete:(channelId:string)=>void,
    setIsFriendsOpen: React.Dispatch<SetStateAction<boolean>>,
    setModalVisible: React.Dispatch<SetStateAction<boolean>>,
    modalVisible: boolean
}

export type ChannelContext={
    friends: FriendDetails[],
    channelsDispatch: React.Dispatch<ChannelAction>,
    handleFriendChannelDelete:(channelId:string)=>void,
    setModalVisible: React.Dispatch<SetStateAction<boolean>>,
    modalVisible: boolean
}

export type LeftContext={
    channelsDispatch: React.Dispatch<ChannelAction>,
    friendsInfo:FriendDetails[],
    token: string,
    socket: Socket|undefined,
    setUserData: React.Dispatch<SetStateAction<User|undefined>>,
    setToken: React.Dispatch<SetStateAction<string|null>>,
    setModalVisible: React.Dispatch<SetStateAction<boolean>>,
    modalVisible: boolean,
}

//useReducer type
export enum ActionType {
    InitialFetch = 'INITIALFETCH',
    NewMessage =  'NEWMESSAGE',
    Seen = 'SEEN',
    NewChannel = 'NEWCHANNEL',
    DeleteChannel =  'DELETECHANNEL',
    Unfriend = 'Unfriend',
    NewMember = 'NEWMEMBER'
}

type InitialFetch={
    type: ActionType.InitialFetch,
    payload : Channel[]
}

type NewChannelMessage={
    type: ActionType.NewMessage,
    payload:{
        location: string,
        newMessageInfo: LastMessageUpdate
        currUserId: string
    }
}

type DeleteChannel = {
    type: ActionType.DeleteChannel,
    payload:{
        channelId:string
    }
}

type ChannelSeen = {
    type: ActionType.Seen,
    payload:{
        channelId: string,
        currUserId: string
    }
}

type NewMember = {
    type: ActionType.NewMember,
    payload: {
        channelNumber: number,
        newTime: number
    }
}

type AddNewChannel = {
    type: ActionType.NewChannel,
    payload: {
        data: Channel
    }
}


export type ChannelAction = DeleteChannel | InitialFetch | ChannelSeen | NewChannelMessage |  NewMember | AddNewChannel