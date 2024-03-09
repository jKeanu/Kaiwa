import { useParams, useNavigate, Link } from "react-router-dom"
import React, { useState, useEffect, useRef, useMemo, SetStateAction} from 'react'
import {
        ChannelDataStatus,
        ChannelMessage,
        CurrentChannel,
        ChannelSectionProps,
        ChannelMember,
        ChannelMessagesStatus,
        ModalWindow,
        AddFriendStatus,
        MemberModalSettings,
        AcceptFriendStatus,
        Friend
    } from "../types/generalTypes"
import { acceptFriend, addFriend,  channelFetcher,  declineFriend,  messageFetcher} from "../services/apiService"
import ReactTextareaAutosize from "react-textarea-autosize"
import useSWR, {useSWRConfig} from "swr"
import LeaveGroupModal from "./modals/LeaveGroup"
import DeleteGroupModal from "./modals/DeleteGroup"
import InviteUserModal from "./modals/InviteUser"
import { AxiosResponse } from "axios"
import UnfriendMemberModal from "./modals/UnfriendMember"
import ChangeLeaderModal from "./modals/ChangeLeader"
import throttle from 'lodash.throttle'



const ChannelSection:React.FC<ChannelSectionProps>=({
        isMobile,
        token,
        socket, 
        currentUserData, 
        myFriends, 
        sentReqs,
        friendReqs, 
        setChannels,
        fIdAndChannelInfos, 
        handleFriendChannelDelete, 
        setSentReqs,
        setFriendReqs,
        handleNewFriendChannel})=>{
    //Since currentUserData consists of many information
    //we can destructure it so we can just use what info we need.
    const {photo, displayName, _id, friendTag} = currentUserData
    const {channelNumber} = useParams()
    const navigate = useNavigate()
    const [inputMessage, setInputMessage] = useState<string>('');
    const [messageReceived, setMessageReceived] = useState<ChannelMessage[]>([]);
    const [currentChannel, setCurrentChannel] = useState<CurrentChannel>()
    const [currentChannelMembers, setCurrentChannelMembers] = useState<ChannelMember[]>([])
    const [messagesLimit, setMessagesLimit] = useState<number>(12)
    const [messagesSkip, setMessagesSkip] = useState<number>(0)
    const [modalWindow, setModalWindow] = useState<ModalWindow>({isOpen:false, window:''})
    const [popUpPosition, setPopUpPosition] = useState({ clickX:0, clickY:0})
    const [memberPopUp, setMemberPopUp] = useState('')
    const [modalDisabled, setModalDisabled] = useState(false)
    const [memberModal, setMemberModal] = useState<MemberModalSettings>
    ({isOpen:false, type:"",ids:{memberId:'', channelId:''}, displayName:'', channelNumber:undefined})
    const [allMessagesFetched, setAllMessagesFetched] = useState(false)
    const [msgFetchLoading, setMsgFetchLoading] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const [isMemberVisible, setIsMemberVisible] = useState(false)
    const {cache, mutate} = useSWRConfig()
    const messageCacheKey = `api/v1/channels/${channelNumber}/messages`
   
    const channelCacheKey = `api/v1/channels/${channelNumber}`
    
    const membersId:string[] = useMemo(()=>{
        return [...currentChannelMembers].map(member=>member._id)
    }, [currentChannelMembers])

    const sortedMembers:ChannelMember[] = useMemo(() => {
        return [...currentChannelMembers].sort((a, b) => {
            return a.status === "Online" && b.status !== "Online" ? -1 : 1;
        });
    }, [currentChannelMembers]);


    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const memberListRef =useRef<HTMLUListElement>(null)

    //fetching channel data 
    const {data:channelData, error: channelError, isLoading:channelIsLoading} = useSWR<ChannelDataStatus>(
        channelCacheKey, (endpoint:string) =>
        channelFetcher(endpoint, token),
    )

    useEffect(()=>{
        setIsVisible(true)
    }, [])
    useEffect(()=>{
        setMessagesSkip(0)
        setMessageReceived([])
        setMsgFetchLoading(false)
        setAllMessagesFetched(false)
    }, [channelNumber])


    useEffect(() => {
        if (channelData) {
            setCurrentChannel(channelData.channel);
            setCurrentChannelMembers(channelData.channel.members);
        }else if (channelError){
            navigate('/@me')
        }
    }, [channelData, channelError, channelIsLoading])

    const { data: messagesData, error: messagesError} = useSWR<ChannelMessagesStatus>(
        //if there's already a data in the cache, we no longer need to fetch 
        messageCacheKey, (endpoint:string) =>
        messageFetcher(endpoint, 12, 0, token),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            revalidateIfStale: false,
            revalidateOnMount: !cache.get(messageCacheKey)
        }
    )
    useEffect(()=>{
        if(messagesData){
            if(messageReceived.length===0&&messagesData.messages.length>0){
                setMessageReceived([...messagesData.messages].slice(0, messagesLimit+messagesSkip))
            }
        }else if(messagesError){
            console.log('-------------ERROR')
        }
    }, [messagesData, messagesError, messageReceived])



    useEffect(() => {
        if (socket && channelNumber) {
            // Join the room
            socket.emit('join_channel_room', channelNumber);
            // Handle socket disconnection or leaving the room when the component unmounts or changes
            return () => {
                socket.emit('leave_channel_room', channelNumber);
            }
        }
    }, [socket, channelNumber]);

    useEffect(() => {
        if (socket && channelNumber) {
            const handleReceiveMessage= (newMessage: ChannelMessage)  => {
                if(newMessage.updated){
                    setMessageReceived(prevMessages=>{
                        const updatedMessages = [...prevMessages]
                        updatedMessages[0] = newMessage
                        return updatedMessages
                    })
                }else{
                    setMessageReceived(prevMessages => {
                        // If prevMessages is undefined, initialize it as an array with newMessage
                        // Otherwise, append newMessage to it
                        return [newMessage, ...prevMessages];
                    });
                }
                mutate(messageCacheKey, (currMsgCachedData: ChannelMessagesStatus | undefined) => {
                    if (!currMsgCachedData){
                      return undefined
                    }
                    //Clone the current data
                    const updatedMessages = [...currMsgCachedData.messages]
                    //Safely access messages, defaulting to an empty array if undefined
                    if (newMessage.updated){
                    //Update the last message or handle appropriately if the array is empty
                      updatedMessages[0] = newMessage
                      return {status:currMsgCachedData.status, messages:updatedMessages}
                    }else{
                    //Append new message
                      updatedMessages.unshift(newMessage)
                      return {status:currMsgCachedData.status, messages:updatedMessages}
                    }
                    // Update the messages array in the channel data
                  }, false); // false tells the SWR to not re-fetch the data from the server after updating the cache
                if(messageBoxRef.current){
                    if(messageBoxRef.current.scrollTop*-1<=800) messageBoxRef.current.scrollTop=0
                }
            };
            // Adding the listener
            socket.on('receive_message', handleReceiveMessage);
            // Cleanup function to remove the listener
            //We explicitly declare the return type of the cleanup function so
            //ts could understand that we're not trying to return anything from the cleanup func.
            const cleanup = ():void  =>{
                socket.removeListener('receive_message', handleReceiveMessage);
            }
            return cleanup
        }
    }, [socket, channelNumber]);


    useEffect(()=>{
        if(textareaRef.current){
            textareaRef.current.focus()
        }
        return ():void => {
            // Cleanup function to handle component unmount
            if (textareaRef) {
              textareaRef.current?.blur();
            }
          };
    }, [channelNumber])

    const messageBoxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        //messageBoxRef.current indicates the actual div element
        if (messageBoxRef.current) {
            //scrollTop indicates the current position of the scrollbar in pixels
            //scrollHeight indicates the total height of the scrollable content in pixels
            messageBoxRef.current.scrollTop = 0;
        }
      }, [channelNumber]);

    function formatDate(timestamp: number): string {
        const date = new Date(timestamp);
        // Extracting parts of the date
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() returns 0-11
        const year = date.getFullYear(); // Full year
        // Formatting the time
        let hours:number|string = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours.toString().padStart(2, '0') : '12'; // the hour '0' should be '12'
        return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
    }

    const sendMessage = ():void =>{
        if(!socket){
            return
        }
        if(!currentChannel){
            return navigate('/')
        }
        const timestamp = Date.now()
        const prevMessageDate:Date = new Date(messageReceived[0]?.time??0)
        const timeDifference = new Date(timestamp).getTime() - prevMessageDate.getTime()
        //If the sent more then one message within one minute since the first message, we're just going to 
        //add the content of the message from the previous message.
        if(messageReceived.length>0&&messageReceived[0].sender._id === _id && timeDifference <= 60*1000){
            //We won't change the formattedDate since, to have more user-friendly approach
            //Since we base the date of the  message on the first message content.
            socket.emit("continue_message",
            {
                //we need to convert it to this format since that is the time format in the DB
                prevTime:messageReceived[0].time,
                sender:{photo, displayName, _id:_id, friendTag},
                channel:currentChannel._id,
                content:inputMessage,
                newTime: timestamp,
                channelNumber,
                channelType: currentChannel.channelType
            })
            setMessageReceived((prevMessages)=>{
                const updatedMessages = [...prevMessages]
                //Append the input message to the content array of the last message.
                updatedMessages[0]={
                    ...updatedMessages[0],
                    time:timestamp,
                    content:[
                        ...updatedMessages[0].content,
                        inputMessage
                    ]
                }
                return updatedMessages
            })
            mutate(messageCacheKey, (currMsgCachedData: ChannelMessagesStatus | undefined) =>{
                if (!currMsgCachedData) {
                    return undefined;
                  }
                const updatedMessages = [...currMsgCachedData.messages]
                updatedMessages[0]={
                    ...updatedMessages[0],
                    time:timestamp,
                    content:[
                        ...updatedMessages[0].content,
                        inputMessage
                    ]
                }
                return {status:currMsgCachedData.status, messages:updatedMessages}
            }, false)
        }else{
            const messageContents:ChannelMessage = {
                content:[inputMessage],
                channel:currentChannel._id,
                time: timestamp,
                formattedDate:formatDate(timestamp),
                sender:{
                    photo, displayName, _id:_id, friendTag
            }}
            socket.emit("send_message", {
                ...messageContents,
                channelNumber,
                channelType: currentChannel.channelType
            })
            setMessageReceived((prevMessages) => {
                return [messageContents, ...prevMessages]
            })
            //Since in the message that we sent, the socket only sends
            //the message to the user besides the sender, we 
            //update the MessageReceived manually.
            mutate(messageCacheKey, (currMsgCachedData: ChannelMessagesStatus | undefined) =>{
                if (!currMsgCachedData) {
                    return undefined;
                }
                const updatedMessages = [...currMsgCachedData.messages]
                updatedMessages.unshift(messageContents)
                return {status:currMsgCachedData.status, messages:updatedMessages}
            }, false)
        }
        setInputMessage('')
        if(messageBoxRef.current){
            messageBoxRef.current.scrollTop=0
        }
    }
    const handleNavButtonClick = (e:React.MouseEvent<HTMLButtonElement>, action:string):void =>{
        e.preventDefault()
        setModalWindow({isOpen:true, window:action})
    }
    
    const handleModalWindowClick = (e:React.MouseEvent<HTMLDialogElement>):void =>{
        if (e.target === e.currentTarget) {
            e.preventDefault();
            if(!modalDisabled){
                if(modalWindow.isOpen){
                    setModalWindow({isOpen: false, window: ''});
                }else if(memberModal.isOpen){
                    setMemberModal({isOpen:false, type:"",ids:{memberId:'', channelId:''}, displayName:'', channelNumber:undefined})
                }
            }
        }
    }
    
    const handleCloseButton = (setVisible:React.Dispatch<SetStateAction<boolean>>):void=>{
        setVisible(false)
        setTimeout(() => {
            if(modalWindow.isOpen){
                setModalWindow({isOpen: false, window: ''})
            }else if(memberModal.isOpen){
                setMemberModal({isOpen:false, type:"",ids:{memberId:'', channelId:''}, displayName:'', channelNumber:undefined})
            }    
        }, 150)
    }

    function formatToTodayIfCurrentDate(dateStr:string):string {
        const currentDate = new Date();
        const messageDate = new Date(dateStr);
        const currentDateStr = currentDate.toLocaleDateString();
        const messageDateStr = messageDate.toLocaleDateString();
        if (currentDateStr === messageDateStr) {
            // Format the time part
            const timeStr = dateStr.split(' ')[1] + ' ' + dateStr.split(' ')[2];
            return `Today at ${timeStr}`;
        } else {
            return dateStr;
        }
    }

    function handleKeyDown(event:React.KeyboardEvent<HTMLTextAreaElement>):void{
    // Check if the Enter key was pressed (key code 13)
      if (event.key === 'Enter' && !event.shiftKey && inputMessage) {
        event.preventDefault();
        // Call the sendMessage function or any other action
        sendMessage();
      }
    }

    //Popup 
    const handlePopUp = (e:React.MouseEvent<HTMLButtonElement>, memberId:string):void=>{
        e.preventDefault()
        if(memberListRef.current){
            const clickX = e.nativeEvent.offsetX - (e.nativeEvent.offsetX>=86?e.nativeEvent.offsetX>=125?120:30:-15)  
            const clickY = Math.abs(memberListRef.current.clientHeight-e.nativeEvent.clientY)<=120?e.nativeEvent.offsetY-140:e.nativeEvent.offsetY
            setPopUpPosition({clickX, clickY})
            setMemberPopUp(memberId)
        }
    }


    //this returns the channel number of the user if the user is in our friend list
    const findMemberId = (userId:string):undefined|{channelNumber:number, channelId:string}=>{
        const friendInfo = fIdAndChannelInfos.find(friendIdAndCN=>friendIdAndCN.friendId===userId)
        if(friendInfo){
            return {channelNumber:friendInfo.channelNumber, channelId:friendInfo.channelId}
        }else{
            return 
        }
    }

    const alreadyAdded = (memberId:string):boolean=>{
        const isSent = [...sentReqs].find(sentReq => sentReq.friend._id === memberId)
        if(isSent){
            return true
        }else{
            return false
        }
    }

    //the isPending._id is the id of an object that contains your status with the other user,
    //and userInfo
    const alreadyPending = (memberId:string):false|string=>{
        const isPending = [...friendReqs].find(friendReq => friendReq.friend._id===memberId)
        if(isPending){
            return isPending._id
        }else{
            return false
        }
    }
    
    useEffect(() => {
        // Only add the event listener if a popup is open
        if (memberPopUp) {
            const handleOutsideClick = (event:MouseEvent) => {
                const popupElement = document.querySelector('.member-popup-container') as HTMLElement;
                const buttonClicked = (event.target as HTMLElement).closest('.member-popup-button');
                if (popupElement && !popupElement.contains(event.target as Node) && !buttonClicked) {
                    setMemberPopUp('');
                }
            };
            document.addEventListener('mousedown', handleOutsideClick);
            //In normal circumstances we don't need the channel number as dependency for a popup, but since when we click the send
            //message it changes the channel, but won't cause an unmount, which will cause the MemberPopUp to still have its previous 
            //value.
            return () => {
                document.removeEventListener('mousedown', handleOutsideClick);
            };
        }
    }, [memberPopUp, channelNumber]);

    //we need this useEffect since, if we clicked send message on the member popup, it changes channel, yes, but it does not
    //cause an unmount; this won't delete the previous value of the state variable.
    //when we go back to the previous group channel, the popup will show if we don't implement this.
    useEffect(()=>{
        if(channelNumber){
            setMemberPopUp('')
        }
    }, [channelNumber])

    const handleMemberSelect = (e:React.MouseEvent<HTMLButtonElement>, channelNumber:number|undefined, memberId:string, displayName:string, type:string):void => {
        e.preventDefault()
        if(currentChannel&&channelNumber){
            setMemberPopUp('')
            const channelInfo = findMemberId(memberId)
            if(channelInfo&&type==='unfriend'){
                setMemberModal({isOpen:true, type, ids:{memberId, channelId:channelInfo.channelId}, displayName, channelNumber})
            }else if(type==='changeLeader'){
                setMemberModal({isOpen:true, type, ids:{memberId, channelId:currentChannel._id}, displayName, channelNumber}) 
            }
        }
    }

    const handleAddFriendMember = async(e:React.MouseEvent<HTMLButtonElement>, displayName:string, friendTag:string):Promise<void>=>{
        e.preventDefault()
        setMemberPopUp('')
        try{
            const res:AxiosResponse<AddFriendStatus> = await addFriend(token, displayName, friendTag)
            if(res.data.status==='success'){
                if(socket){
                    setSentReqs(prevSentReqs=>[...prevSentReqs, res.data.sentRequestDetails])
                    socket.emit('friend_request_sent', 
                    {requestedUserId:res.data.sentRequestDetails.friend._id,
                     requestDetails:res.data.pendingRequestDetails})
                }
            }
        }catch(err){

        }
    }

    //friendId is the object that contains the channel info and the user info and your status with that user
    const handleAcceptRequest = async (e:React.MouseEvent<HTMLButtonElement>, memberId:string, friendId:string|false):Promise<void>=>{
        e.preventDefault()
        setMemberPopUp('')
        if(friendId){
            try{
                const res:AxiosResponse<AcceptFriendStatus>= await acceptFriend(token, memberId)
                if(res.data.status==="success"){
                    const fetchedNewChannelData = {...res.data.newChannel}
                    //we sort it this way to make the pending user always on the index 0
                    const sortMembers = fetchedNewChannelData.members.sort((a,b)=>{
                        return (a._id === memberId && b._id !== memberId)?-1:1
                    })
                    const newChannel:Friend = {
                        channel:{
                            channelType:fetchedNewChannelData.channelType,
                            channelNumber:fetchedNewChannelData.channelNumber,
                            lastMessage:fetchedNewChannelData.lastMessage,
                            _id:fetchedNewChannelData._id,
                            id: fetchedNewChannelData.id
                        },
                        friend:{
                            ...sortMembers[0]
                        },
                        status:"Friend",
                        _id:friendId
                    }
                    handleNewFriendChannel(newChannel)
                    setFriendReqs(prevUserReqs=>{
                        const updateUserReqs = [...prevUserReqs]
                        return updateUserReqs.filter(userReqs=>userReqs.friend._id!==memberId)
                    })
                    if(socket){
                        socket.emit('accepted_pending_friend_request', {
                            newChannelInfo: newChannel.channel,
                            pendingUserId: memberId,
                            newFriendId: _id
                        })
                    }
                }
            }catch(err){
    
            }
        }
        }
    
    const handleDeclineRequest = async (e:React.MouseEvent<HTMLButtonElement>, memberId:string):Promise<void>=>{
        e.preventDefault()
        setMemberPopUp('')
        try{
            const res:AxiosResponse<void>=await declineFriend(token, memberId)
            if(res.status===204){
                setFriendReqs(prevUserReqs=>{
                    const updateUserReqs = [...prevUserReqs]
                    return updateUserReqs.filter(userReqs=>userReqs.friend._id!==memberId)
                })
                if(socket){
                    socket.emit("declined_pending_friend_request", {declinedUser: memberId, userId:_id})
                }
            }
        }catch(err){

        }
    }

    const handleChannelBack = (e:React.MouseEvent<HTMLButtonElement>):void=>{
        e.preventDefault()
        setIsVisible(false)
        setTimeout(() => {
            navigate('/@me');
        }, 150)
    }

    const handleMembersBack = (e:React.MouseEvent<HTMLButtonElement>):void=>{
        e.preventDefault()
        setIsMemberVisible(false)
    }

    const handleChannelToMembers= (e:React.MouseEvent<HTMLButtonElement>):void=>{
        e.preventDefault()
        setIsMemberVisible(true)
    }

    const handleScroll = throttle(()=>{
            const container = messageBoxRef.current 
            if(container){
                // container.clientHeight represents the height of the visible portion of the container, 
                // which is the part of the container that is currently displayed on the screen
                const gap = Math.floor(Math.abs(container.scrollHeight - ((container.scrollTop*-1) + container.clientHeight)))
                const isTop = (container.scrollTop*-1) + container.clientHeight === container.scrollHeight ||
                (container.scrollTop*-1) + container.clientHeight === container.scrollHeight -1 || 
                gap === 0 || gap === 1
                if((isTop && !allMessagesFetched && !msgFetchLoading)){
                    console.log('SUCCESS PASS')
                    setMessagesSkip(prevMessagesSkip => prevMessagesSkip+messagesLimit)
                }
            }
    }, 300)

    useEffect(()=>{
        const fetchMoreMessages = ():void =>{
            if(messagesSkip > 0){
                setMsgFetchLoading(true)
                mutate(messageCacheKey, async (prevMessageData:ChannelMessagesStatus|undefined)=>{
                    if(!prevMessageData){
                        return
                    }
                    //Determine the difference between the current rendered messages' length and the 
                    //messages data in the cache
                    const lenDifference = prevMessageData.messages.length - messageReceived.length
                    //if there's a difference, it means there is messages data in the cache that we can 
                    //get without fetching 
                    if(lenDifference>0){
                        //Since every scroll up, we render additional 15 messages(messagesLimit),
                        //if the difference between the rendered messages and messages in the cache's length is
                        //less than 15, we can fetch the remaining messages to make up for the additional 15 messages
                        if(lenDifference<messagesLimit){
                            try{
                                const newMessagesData = await messageFetcher(
                                    messageCacheKey,
                                    messagesLimit-lenDifference,
                                    messagesSkip+lenDifference,
                                    token
                                )
                                if(newMessagesData.messages.length < messagesLimit-lenDifference){
                                    setAllMessagesFetched(true)
                                }
                                setMessageReceived([...prevMessageData.messages, ...newMessagesData.messages])
                                setMsgFetchLoading(false)
                                return {status:prevMessageData.status,
                                        messages:[...prevMessageData.messages, ...newMessagesData.messages]}
                            }catch(err){

                            }
                        //if its higher than 15, we can just get additional 15 messages from the cache
                        }else{
                            setMessageReceived(prevMessages=>{
                                return [...[...prevMessageData.messages].slice(0, prevMessages.length+messagesLimit)]
                            })
                            setMsgFetchLoading(false)
                            return {...prevMessageData}
                        }
                    }
                    try{
                    //This executes when the length of the rendered messages is equal to the length of the messages
                    //in the cache, if so, we can fetch another messages data.
                        const newMessagesData = await messageFetcher(
                            messageCacheKey,
                            messagesLimit,
                            messagesSkip,
                            token
                        )
                        if(newMessagesData.messages.length<messagesLimit){
                            setAllMessagesFetched(true)
                        }
                    //Since the cached data and the rendered data is identical we can just add allMessages
                    //to both 
                        const allMessages = [...prevMessageData.messages, ...newMessagesData.messages]
                        setMessageReceived(allMessages)
                        setMsgFetchLoading(false)
                        return {status:prevMessageData.status, messages:allMessages}
                    }catch(err){
                        
                    }
                }, false)

            }
        }
        if(!msgFetchLoading){
            fetchMoreMessages()
        }

    }, [messagesSkip])


    return (
        <>
        {(currentChannel&&messagesData)?
        <section className={`channel-section ${isVisible?'channel-section-mob':''}`}>
        {(modalWindow.isOpen||memberModal.isOpen)&&
            <dialog className='modal-window-container' onClick={handleModalWindowClick}>
                    {(modalWindow.window==='leaveGroup'&&currentChannel)
                    &&
                    <LeaveGroupModal 
                        token={token} 
                        channelId={currentChannel._id} 
                        socket={socket}
                        currUserId={_id} 
                        channelNumber={channelNumber}
                        handleCloseButton={handleCloseButton} 
                        setChannels={setChannels}
                        setModalDisabled={setModalDisabled}/>
                    }
                    {(modalWindow.window==='inviteUser'&&currentChannel)
                    &&
                    <InviteUserModal 
                        handleCloseButton={handleCloseButton} 
                        channelId={currentChannel._id}
                        token={token} 
                        friends={myFriends} 
                        currChannelMembersId={membersId} 
                        socket={socket}
                        channelNumber={channelNumber}
                        setChannels={setChannels}
                        modalDisabled={modalDisabled}
                        setModalDisabled={setModalDisabled}/>}
                    {(modalWindow.window==='deleteGroup'&&currentChannel)
                    &&
                    <DeleteGroupModal 
                        token={token} 
                        channelId={currentChannel._id} 
                        channelNumber={channelNumber}
                        handleCloseButton={handleCloseButton} 
                        setChannels={setChannels} 
                        socket={socket}
                        membersId={membersId}
                        setModalDisabled={setModalDisabled}
                    />}
                    {memberModal.type==='unfriend'&&
                    <UnfriendMemberModal
                        setModalSettings={setMemberModal}
                        token={token}
                        socket={socket}
                        displayName={memberModal.displayName}
                        handleCloseButton={handleCloseButton}
                        channelNumber={memberModal.channelNumber}
                        handleFriendChannelDelete={handleFriendChannelDelete}
                        setModalDisabled={setModalDisabled}
                        {...memberModal.ids}
                        />}
                    {memberModal.type==='changeLeader'&&
                    <ChangeLeaderModal 
                        token={token}
                        setModalSettings={setMemberModal}
                        socket={socket}
                        displayName={memberModal.displayName}
                        channelNumber={memberModal.channelNumber}
                        handleCloseButton={handleCloseButton}
                        setModalDisabled={setModalDisabled}
                        {...memberModal.ids}
                    />}
            </dialog>}
            <div className="channel-container">
                <nav className="channel-nav">
                    <button className="channel-back-to-home-button" onClick={isMemberVisible?handleMembersBack:handleChannelBack}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b9b9b9 " 
                        strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-left">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>
                        {
                            currentChannel?.channelType==='Friend'?
                            <div className="channel-nav-info-container">
                                <img className="channel-nav-photo"
                                src={`/img/${currentChannel.members[0]._id!==_id?currentChannel.members[0].photo:currentChannel.members[1].photo}`}/>
                                <h2 className="channel-nav-header">
                                    {currentChannel.members[0]._id!==_id?currentChannel.members[0].displayName:currentChannel.members[1].displayName}
                                </h2>
                            </div>
                            :
                            <div className="channel-nav-info-container">
                                <img className="channel-nav-photo" src={`/img/${currentChannel?.photo}`}/>
                                <h2 className="channel-nav-header">{currentChannel?.channelName}</h2>
                            </div>
                        }
                        <div className={`nav-button-container ${isMemberVisible&&'nav-button-container-0'}`}>
                        {currentChannel?.channelType==='Group'&&
                            <button className="channel-to-member-button" onClick={handleChannelToMembers}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                                stroke="#b9b9b9 " strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" id='create-group-image'
                                className="channel-to-group-image">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2">
                                        </path>
                                        <circle cx="9" cy="7" r="4">
                                        </circle>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87">
                                        </path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75">
                                        </path>
                                </svg>
                        </button>}
                        {currentChannel?.channelType==='Group'&&
                            <button className="nav-button" onClick={(e)=>handleNavButtonClick(e, 'inviteUser')}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b9b9b9" 
                                strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="invite-user-img">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="8.5" cy="7" r="4"></circle>
                                    <line x1="20" y1="8" x2="20" y2="14"></line>
                                    <line x1="23" y1="11" x2="17" y2="11"></line>
                                </svg>
                                <div className='channel-nav-button-tooltip'>
                                    <span className='channel-nav-button-tooltip-text'>
                                        Invite Friend
                                    </span>
                                </div>
                            </button>
                        }
                        {(currentChannel?.channelType==="Group"&&currentChannel?.groupLeader!==_id)&&
                            <button onClick={(e)=>handleNavButtonClick(e, 'leaveGroup')} className="nav-button last-nav-button">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b9b9b9 " strokeWidth="1" strokeLinecap="round" 
                                strokeLinejoin="round" className="leave-group-img">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                                <div className='channel-nav-button-tooltip'>
                                    <span className='channel-nav-button-tooltip-text'>
                                        Leave Group
                                    </span>
                                </div>
                            </button>}
                        {(
                            currentChannel?.channelType==="Group"
                            &&currentChannel?.groupLeader===_id)
                            &&
                            <button onClick={(e)=>handleNavButtonClick(e, 'deleteGroup')} className="nav-button disband-group-button last-nav-button">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                                stroke="#b9b9b9" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" 
                                className="feather feather-trash-2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                                <div className='channel-nav-button-tooltip'>
                                    <span className='channel-nav-button-tooltip-text'>
                                        Disband Group
                                    </span>
                                </div>
                            </button>
                        }
                        </div>
                </nav>
                <section className="message-section">
                    <div className="message-box" ref={messageBoxRef} onScroll={handleScroll}>
                        {
                        messageReceived?
                            messageReceived.map((message, index)=>(
                                <div 
                                    className={message.sender._id===_id?"my-message-info-container user-message-info-container"
                                    :"user-message-info-container"} 
                                    key={index}>
                                    <img className='sender-photo' src={`/img/${message.sender.photo}`}/>
                                    <div className="message-info">
                                        <div className="message-date-displayname">
                                            <span className="message-sender">
                                                {message.sender.displayName}
                                            </span>
                                            <span className="message-date">
                                                {formatToTodayIfCurrentDate(message.formattedDate.toString())}
                                            </span>
                                        </div>
                                        <div className="message-content-container">
                                            {
                                            message.content.map((m, i)=>(
                                                <div key={i} className="message-content">
                                                    {m.split('\n').map((line, index)=>(
                                                        <React.Fragment key={index}>
                                                            {line}
                                                            {index < line.length -1 && <br/>}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )):
                            <div></div>
                        }
                    </div>
                    <div className="message-input-container">
                        <ReactTextareaAutosize 
                            ref={textareaRef}
                            value={inputMessage} 
                            placeholder="Send a message..."
                            onKeyDown={handleKeyDown}
                            onChange={(event)=>setInputMessage(event.target.value)} 
                            className="message-input"
                        />
                    </div>
                </section>
                <section className={`channel-members-section ${isMemberVisible&&'mob-member-visible'}`}>
                    {currentChannel.channelType==='Group'?
                        <ul className="member-list" ref={memberListRef}>
                        {
                            sortedMembers.map((member, i)=>(
                                <li className='member-container member-popup' key={`member-${i}`}>
                                    <button className="member-popup-button" onClick={(e)=>handlePopUp(e, member._id)}>
                                        <div className="member-profile-status">
                                            <img className='member-profile-photo' src={`/img/${member.photo}`}/>
                                            <div className='member-status' style={{backgroundColor:member.status==='Online'?'green':'#959595'}}></div>
                                        </div>
                                        <span className="member-name">{member.displayName}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b9b9b9" 
                                        strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" 
                                        className="member-more">
                                            <circle cx="12" cy="12" r="1">
                                            </circle>
                                            <circle cx="19" cy="12" r="1">
                                            </circle>
                                            <circle cx="5" cy="12" r="1"></circle>
                                        </svg>
                                    </button>
                                    {memberPopUp===member._id&&member._id!==_id&&
                                    <div className="member-popup-container" style={{top:popUpPosition.clickY+15,
                                    left:popUpPosition.clickX}}>
                                        <div className="popup-member-info-container">
                                            <img src={`/img/${member.photo}`} />
                                            <div className="popup-member-info">
                                                <span className="popup-member-name">{member.displayName}</span>
                                                <span className="popup-member-friend-tag">#{member.friendTag}</span>
                                            </div>
                                        </div>
                                        {findMemberId(member._id)?
                                        <>
                                            <Link to={`/@me/channels/${findMemberId(member._id)?.channelNumber}`} className="member-message-link">Send Message</Link>
                                            <button onClick={(e)=>handleMemberSelect(e, findMemberId(member._id)?.channelNumber, member._id, member.displayName, 'unfriend')} className="member-unfriend-button">
                                                Remove Friend
                                            </button>
                                        </>
                                        :
                                        alreadyAdded(member._id)?
                                        <div className="req-sent-text">Request Sent</div>
                                        :
                                        alreadyPending(member._id)?
                                        <>
                                            <button className="member-accept-friend-request" onClick={(e)=>handleAcceptRequest(e, member._id, alreadyPending(member._id))}>
                                                Accept Request
                                            </button>
                                            <button className="member-decline-friend-request" onClick={(e)=>handleDeclineRequest(e, member._id)}>
                                                Decline Request
                                            </button>
                                        </>:
                                        <button className="member-add-friend" onClick={(e)=>handleAddFriendMember(e, member.displayName, member.friendTag)}>
                                            Add Friend
                                        </button>
                                        }
                                        {currentChannel.groupLeader===_id&&
                                        <button className="member-set-leader" onClick={(e)=>handleMemberSelect(e, currentChannel.channelNumber, member._id, member.displayName, 'changeLeader')}>
                                            Set as Group Leader
                                        </button>}
                                    </div>}
                                </li>  
                            ))
                            }
                        </ul>
                        :
                        <ul className='member-list'>
                            {sortedMembers.map((member, i)=>(
                                <li key={`member-${i}`} className="member-container friend-member-container">
                                    <div className="member-profile-status">
                                        <img className='member-profile-photo' src={`/img/${member.photo}`}/>
                                        <div className='member-status' style={{backgroundColor:member.status==='Online'?'green':'#959595'}}>
                                        </div>
                                    </div>
                                    <span className="member-name">{member.displayName}</span>
                                </li>
                            ))}
                        </ul>}
                </section>
            </div>
        </section>:
        <section className={`channel-section ${isVisible?"channel-section-mob":''}`}>
            <div className="channel-container">
                <nav className="channel-nav">
                    <button className="channel-back-to-home-button" onClick={isMemberVisible?handleMembersBack:handleChannelBack}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b9b9b9 " 
                        strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>
                </nav>
                <section className="message-section">
                </section>
                <section className="channel-members-section">
                </section>
            </div>
        </section>}
        </>
    )
}

export default ChannelSection

