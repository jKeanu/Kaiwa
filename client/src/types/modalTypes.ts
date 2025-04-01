export type ModalWindow={
    isOpen:boolean,
    window:string
}

export type MessageLimit = {
    handleCloseButton:(e:React.MouseEvent<HTMLButtonElement>)=>void
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
