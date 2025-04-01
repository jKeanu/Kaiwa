import { SetStateAction } from "react"
import { Channel } from "./channelTypes"
import { FriendReq } from "./friendTypes"
import { User } from "./userTypes"

export type LeftSectionProps ={
    channels: Channel[],  // Assuming Channel is a defined type or interface
    currentUserData: User,
    friendReqs:FriendReq[], 
    setIsFriendsOpen: React.Dispatch<SetStateAction<boolean>>,
    formatToTodayIfCurrentDate: (dateStr:string) => string,
    isOnline: boolean
}