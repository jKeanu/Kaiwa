import { SetStateAction } from "react"
import { Channel } from "./channelTypes"
import { Friend } from "./friendTypes"

export type UserDataStatus={
    status:string,
    user:User
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


//Current User 
export type ProfileSettings={
    currUserData: User,
    setModal: React.Dispatch<SetStateAction<{active:boolean, type:string}>>,
    handleCloseButton: (e:React.MouseEvent<HTMLButtonElement>)=>void,
    setIsDisabled: React.Dispatch<SetStateAction<boolean>>
}

export type UserStatusUpdate= {
    channelId: string,
    channelNumber: number, 
    userId: string,
    type?:string
}
