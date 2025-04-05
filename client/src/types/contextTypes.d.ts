import { Socket } from "socket.io-client"
import { Friend, FriendDetails, FriendReq, SentReq } from "./friendTypes"
import { SetStateAction } from "react"
import { User } from "./userTypes"
import { ChannelAction } from "./channelTypes"

//Context Api
export type HomeContext={
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
    socket: Socket|undefined,
    setUserData: React.Dispatch<SetStateAction<User|undefined>>,
    setModalVisible: React.Dispatch<SetStateAction<boolean>>,
    modalVisible: boolean,
    channelNumberAndIds: {channelNumber:number, channelId:string}[]
}