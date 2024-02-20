import { useParams, useNavigate, Link } from "react-router-dom"
import React, { useState, useEffect, useRef, useMemo, ButtonHTMLAttributes} from 'react'
import {
        ChannelDataStatus,
        ChannelMessage,
        CurrentChannel,
        ChannelSectionProps,
        ChannelMember,
        ChannelMessagesStatus,
        ModalWindow,
        AddFriendStatus,
        MemberModalSettings
    } from "../types/generalTypes"
import { addFriend, changeGroupLeader, channelFetcher,  messageFetcher} from "../services/apiService"
import ReactTextareaAutosize from "react-textarea-autosize"
import useSWR, {mutate} from "swr"
import LeaveGroupModal from "./modals/LeaveGroup"
import DeleteGroupModal from "./modals/DeleteGroup"
import InviteUserModal from "./modals/InviteUser"
import { AxiosResponse } from "axios"
import UnfriendMemberModal from "./modals/UnfriendMember"
import ChangeLeaderModal from "./modals/ChangeLeader"

const ChannelSection:React.FC<ChannelSectionProps>=({token, socket, currentUserData, myFriends, setChannels,
    fIdAndChannelInfos, handleFriendChannelDelete, setSentReqs})=>{
    //Since currentUserData consists of many information
    //we can destructure it so we can just use what info we need.
    const {photo, displayName, _id, friendTag} = currentUserData
    const {channelNumber} = useParams()
    const navigate = useNavigate()
    const [inputMessage, setInputMessage] = useState<string>('');
    const [messageReceived, setMessageReceived] = useState<ChannelMessage[]>([]);
    const [currentChannel, setCurrentChannel] = useState<CurrentChannel>()
    const [currentChannelMembers, setCurrentChannelMembers] = useState<ChannelMember[]>([])
    const [messagesLimit, setMessagesLimit] = useState<number>(15)
    const [messagesSkip, setMessagesSkip] = useState<number>(0)
    const [modalWindow, setModalWindow] = useState<ModalWindow>({isOpen:false, window:''})
    const [popUpPosition, setPopUpPosition] = useState({ clickX:0, clickY:0})
    const [memberPopUp, setMemberPopUp] = useState('')
    const [modalDisabled, setModalDisabled] = useState(false)
    const [memberModal, setMemberModal] = useState<MemberModalSettings>
    ({isOpen:false, type:"",ids:{memberId:'', channelId:''}, displayName:'', channelNumber:undefined})


    const channelCacheKey = `api/v1/channels/${channelNumber}`
    const messageCacheKey = `api/v1/channels/${channelNumber}/messages`

    
    const membersId:string[] = useMemo(()=>{
        return [...currentChannelMembers].map(member=>member._id)
    }, [currentChannelMembers])

    const sortedMembers:ChannelMember[] = useMemo(() => {
        return [...currentChannelMembers].sort((a, b) => {
            return a.status === "Online" && b.status !== "Online" ? -1 : 1;
        });
    }, [currentChannelMembers]);

    const headers = {
        'Authorization': `Bearer ${token}`
    }

    //fetching channel data 
    const {data:channelData, error: channelError, isLoading:channelIsLoading} = useSWR<ChannelDataStatus>(
        channelCacheKey, (endpoint:string) =>
        channelFetcher(endpoint, headers)
    )

    useEffect(() => {
        if (channelData) {
            setCurrentChannel(channelData.channel);
            setCurrentChannelMembers(channelData.channel.members);
        }else if (channelError){
            navigate('/@me')
        }
    }, [channelData, channelError, channelIsLoading])

    const { data: messagesData, error: messagesError } = useSWR<ChannelMessagesStatus>(
        messageCacheKey, (endpoint:string) =>
        messageFetcher(endpoint, messagesLimit, messagesSkip, headers)
    )
    useEffect(()=>{
        if(messagesData){
            setMessageReceived(messagesData.messages)
        }else if(messagesError){
            console.log('ERRORZZZZ')
        }
    }, [messagesData, messagesError])

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
                    }else{
                    //Append new message
                      updatedMessages.unshift(newMessage)
                    }
                    // Update the messages array in the channel data
                    return {status:currMsgCachedData.status, messages:updatedMessages}
                  }, false); // false tells the SWR to not re-fetch the data from the server after updating the cache
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

    const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    // useEffect(() => {
    //     //messageBoxRef.current indicates the actual div element
    //     if (messageBoxRef.current) {
    //         //scrollTop indicates the current position of the scrollbar in pixels
    //         //scrollHeight indicates the total height of the scrollable content in pixels
    //         messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
    //     }
    //   }, [messageReceived]);

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
            //Since in the message that we sent, the socket only sends
            //the message to the user besides the sender, we 
            //update the MessageReceived manually.
            setMessageReceived((prevMessages) => {
                    return [messageContents, ...prevMessages]
            })
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
    
    const handleCloseButton = (e:React.MouseEvent<HTMLButtonElement>):void=>{
        e.preventDefault()
        if(modalWindow.isOpen){
            setModalWindow({isOpen: false, window: ''})
        }else if(memberModal.isOpen){
            setMemberModal({isOpen:false, type:"",ids:{memberId:'', channelId:''}, displayName:'', channelNumber:undefined})
        }
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
        const clickX = e.nativeEvent.offsetX
        const clickY = e.nativeEvent.offsetY
        setPopUpPosition({clickX, clickY})
        setMemberPopUp(memberId)
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

    const handleMemberSelect = (e:React.MouseEvent<HTMLButtonElement>, channelNumber:number|undefined, memberId:string, displayName:string, type:string):void => {
        e.preventDefault()
        if(currentChannel){
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
    return (
        <>
        {(currentChannel&&messagesData)?
        <section className='right-home-section'>
            <section className="message-section">
                <nav className="channel-nav">
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
                    {currentChannel?.channelType==='Group'&&
                    <button className="nav-button" onClick={(e)=>handleNavButtonClick(e, 'inviteUser')}>
                        <img src="/img/invite-member.svg"/>
                    </button>
                    }
                    {(currentChannel?.channelType==="Group"&&currentChannel?.groupLeader!==_id)&&
                    <button onClick={(e)=>handleNavButtonClick(e, 'leaveGroup')} className="nav-button">
                       <img src="/img/leave-group-icon.svg"/>
                    </button>}
                    {(
                        currentChannel?.channelType==="Group"
                        &&currentChannel?.groupLeader===_id)
                        &&
                        <button onClick={(e)=>handleNavButtonClick(e, 'deleteGroup')} className="disband-group-button">
                            Disband Group
                        </button>
                    }
                </nav>
                <div className="message-box" ref={messageBoxRef}>
                    {
                    messageReceived.length>=1?
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
                                            {formatToTodayIfCurrentDate(message.formattedDate)}
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
            {(modalWindow.isOpen||memberModal.isOpen)&&<dialog className='modal-window-container' onClick={handleModalWindowClick}>
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
            <section className="channel-members-section">
                <h2 className="channel-members-header">
                    Members
                </h2>
                {currentChannel.channelType==='Group'?
                    <ul className="member-list">
                    {
                        sortedMembers.map((member, i)=>(
                            <li className='member-container member-popup' key={`member-${i}`}>
                                <button className="member-popup-button" onClick={(e)=>handlePopUp(e, member._id)}>
                                    <div className="member-profile-status">
                                        <img className='member-profile-photo' src={`/img/${member.photo}`}/>
                                        <div className='member-status' style={{backgroundColor:member.status==='Online'?'green':'#959595'}}></div>
                                    </div>
                                    <span className="member-name">{member.displayName}</span>
                                </button>
                                {memberPopUp===member._id&&member._id!==_id&&
                                <div className="member-popup-container" style={{top:popUpPosition.clickY,
                                 left:popUpPosition.clickX-(popUpPosition.clickX<=115?-5:115)}}>
                                    {findMemberId(member._id)?
                                    <>
                                        <Link to={`/@me/channels/${findMemberId(member._id)?.channelNumber}`} className="member-message-link">Send Message</Link>
                                        <button onClick={(e)=>handleMemberSelect(e, findMemberId(member._id)?.channelNumber, member._id, member.displayName, 'unfriend')} className="member-unfriend-button">
                                            Remove Friend
                                        </button>
                                    </>
                                    :
                                    <button className="member-add-friend" onClick={(e)=>handleAddFriendMember(e, member.displayName, member.friendTag)}>
                                        Add Friend
                                    </button>}
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
                    <ul className="member-list">
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
        </section>:
        <section className="right-home-section">
            <section className="message-section">
                <nav className="channel-nav">

                </nav>
            </section>
            <section className="channel-members-section">
                <h2 className="channel-members-header">Members</h2>
            </section>
        </section>}
        </>
    )
}

export default ChannelSection

