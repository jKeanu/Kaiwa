import { useParams, useNavigate } from "react-router-dom"
import React, { useState, useEffect, useRef, useMemo} from 'react'
import {
        ChannelDataStatus,
        ChannelMessage,
        CurrentChannel,
        ChannelSectionProps,
        ChannelMember,
        ChannelMessagesStatus,
        ModalWindow
    } from "../types/generalTypes"
import { channelFetcher,  messageFetcher} from "../services/apiService"
import ReactTextareaAutosize from "react-textarea-autosize"
import useSWR, {mutate} from "swr"
import LeaveGroupModal from "./modals/LeaveGroup"
import DeleteGroupModal from "./modals/DeleteGroup"
import InviteUserModal from "./modals/InviteUser"

const ChannelSection:React.FC<ChannelSectionProps>=({token, socket, currentUserData, myFriends})=>{
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
    const [modalWindow, setModalWindow] = useState<ModalWindow>()
    const channelCacheKey = `api/v1/channels/${channelNumber}`
    const messageCacheKey = `api/v1/channels/${channelNumber}/messages`

    
    const memberIds = useMemo(()=>{
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
    const {data:channelData, error: channelError} = useSWR<ChannelDataStatus>(
        channelCacheKey, (endpoint:string) =>
        channelFetcher(endpoint, headers)
    )

    useEffect(() => {
        if (channelData) {
            setCurrentChannel(channelData.channel);
            setCurrentChannelMembers(channelData.channel.members);
        }else if (channelError) {
            console.log('ERRORZZZZZZZZZ');
        }
    }, [channelData, channelError])

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
            socket.emit('joinRoom', channelNumber);
            // Handle socket disconnection or leaving the room when the component unmounts or changes
            return () => {
                socket.emit('leaveRoom', channelNumber);
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
        //We also inserted the channelNumber(room) to send the message 
        //to the other members in the channel.
        //----------------------------------------
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
                members:memberIds
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
                members:memberIds,
                channelNumber
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
            setModalWindow({isOpen: false, window: ''});
        }
    }
    
    const handleCloseButton = (e:React.MouseEvent<HTMLButtonElement>):void=>{
        e.preventDefault()
        setModalWindow({isOpen: false, window: ''})
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

    return (
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
            {modalWindow?.isOpen&&<dialog className='modal-window-container' onClick={handleModalWindowClick}>
                {(modalWindow.window==='leaveGroup'&&currentChannel)
                &&
                <LeaveGroupModal token={token} channelId={currentChannel._id} 
                handleCloseButton={handleCloseButton}/>
                }
                {(modalWindow.window==='inviteUser'&&currentChannel)
                &&
                <InviteUserModal handleCloseButton={handleCloseButton} channelId={currentChannel._id}
                 token={token} friends={myFriends} currChannelMembersId={memberIds} socket={socket}
                 channelNumber={channelNumber}/>}
                {(modalWindow.window==='deleteGroup'&&currentChannel)
                &&
                <DeleteGroupModal token={token} channelId={currentChannel._id} 
                handleCloseButton={handleCloseButton}/>}
            </dialog>}
            <section className="channel-members-section">
                <h2 className="channel-members-header">Members</h2>
                <ul className="member-list">
                {
                    sortedMembers.map((member, i)=>(
                      <li className='member-container' key={`member-${i}`}>
                        <button className="member-popup-button">
                            <div className="member-profile-status">
                                <img className='member-profile-photo' src={`/img/${member.photo}`}/>
                                <div className='member-status' style={{backgroundColor:member.status==='Online'?'green':'#959595'}}></div>
                            </div>
                            <span className="member-name">{member.displayName}</span>
                        </button>
                      </li>  
                    ))
                    }
                </ul>
            </section>
        </section>
    )
}

export default ChannelSection

