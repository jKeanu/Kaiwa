import { SetStateAction } from "react"
import { NewChannel } from "./channelTypes"

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