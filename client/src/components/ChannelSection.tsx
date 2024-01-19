import { useParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import {
        ChannelDataStatus,
        ChannelMessage,
        CurrentChannel,
        ChannelSectionProps,
        ChannelMembers
    } from "../types/generalTypes";
import { API_URL } from "../services/apiService";
import { channelFetcher } from "../services/apiService";
import ReactTextareaAutosize from "react-textarea-autosize";
import useSWR, {mutate} from "swr";

export const ChannelSection:React.FC<ChannelSectionProps>=({token, socket, currentUserData, myFriends, setChannels})=>{
    //Since currentUserData consists of many information
    //we can destructure it so we can just use what info we need.
    const {photo, displayName, _id, friendTag} = currentUserData
    const {channelNumber} = useParams();
    const navigate = useNavigate()
    const [inputMessage, setInputMessage] = useState<string>('');
    const [messageReceived, setMessageReceived] = useState<ChannelMessage[]>([]);
    const [currentChannel, setCurrentChannel] = useState<CurrentChannel>()
    const [currentChannelMembers, setCurrentChannelMembers] = useState<ChannelMembers[]>([])
    const cacheKey = `api/v1/channels/${channelNumber}`

    const headers = {
        'Authorization': `Bearer ${token}`
    } 

    const {data, error} = useSWR<ChannelDataStatus>(
        `api/v1/channels/${channelNumber}`, (endpoint:string) =>
        channelFetcher(endpoint, headers)
        )

    useEffect(() => {
            if (data) {
                if (data.channel.messages) {
                    setMessageReceived(data.channel.messages);
                }else{
                    setMessageReceived([])
                }
                setCurrentChannel(data.channel);
                setCurrentChannelMembers(data.channel.members);
            } else if (error) {
                console.log('ERRORZZZZZZZZZ');
            }
        }, [data, error])

    useEffect(() => {
        if (socket && channelNumber) {
            // Join the room
            socket.emit('joinRoom', channelNumber);
            // Handle socket disconnection or leaving the room when the component unmounts or changes
            return () => {
                socket.emit('leaveRoom', channelNumber);
            };
        }
    }, [socket, channelNumber]);

    useEffect(() => {
        if (socket && channelNumber) {
            const handleReceiveMessage= (newMessage: ChannelMessage)  => {
                if(newMessage.updated){
                    setMessageReceived(prevMessages=>{
                        const updatedMessages = [...prevMessages]
                        updatedMessages[updatedMessages.length -1] = newMessage
                        return updatedMessages
                    })
                }else{
                    setMessageReceived(prevMessages => {
                        // If prevMessages is undefined, initialize it as an array with newMessage
                        // Otherwise, append newMessage to it
                        return [...prevMessages, newMessage];
                    });
                }
                mutate(cacheKey, (currentCachedData: ChannelDataStatus | undefined) => {
                    if (!currentCachedData || !currentCachedData.channel) {
                      return undefined;
                    }
                    // Clone the current data
                    let updatedChannelData = { ...currentCachedData };
                  
                    // Safely access messages, defaulting to an empty array if undefined
                    const updatedMessages = updatedChannelData.channel.messages?.length
                      ? [...updatedChannelData.channel.messages]
                      : [];
                  
                    if (newMessage.updated) {
                      // Update the last message or handle appropriately if the array is empty
                      updatedMessages[updatedMessages.length - 1] = newMessage;
                    } else {
                      // Append new message
                      updatedMessages.push(newMessage);
                    }
                  
                    // Update the messages array in the channel data
                    updatedChannelData.channel.messages = updatedMessages;
                  
                    return updatedChannelData;
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
    useEffect(() => {
        //messageBoxRef.current indicates the actual div element
        if (messageBoxRef.current) {
            //scrollTop indicates the current position of the scrollbar in pixels
            //scrollHeight indicates the total height of the scrollable content in pixels
            messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
        }
      }, [messageReceived]);

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
        const prevMessageDate:Date = new Date(messageReceived[messageReceived.length-1]?.time??0)
        const timeDifference = new Date(timestamp).getTime() - prevMessageDate.getTime()
        //If the sent more then one message within one minute since the first message, we're just going to 
        //add the content of the message from the previous message.
        if(messageReceived.length>0&&messageReceived[messageReceived.length-1].sender._id === _id && timeDifference <= 60*1000){
            //We won't change the formattedDate since, to have more user-friendly approach
            //Since we base the date of the  message on the first message content.
            socket.emit("continue_message",
            {
                //we need to convert it to this format since that is the time format in the DB
                time:messageReceived[messageReceived.length-1].time,
                sender:{photo, displayName, _id:_id, friendTag},
                channel:currentChannel._id,
                content:inputMessage,
                newTime: timestamp,
                channelNumber
            })
            setMessageReceived((prevMessages)=>{
                const updatedMessages = [...prevMessages]
                //Append the input message to the content array of the last message.
                updatedMessages[updatedMessages.length-1]={
                    ...updatedMessages[updatedMessages.length-1],
                    content:[
                        ...updatedMessages[updatedMessages.length-1].content,
                        inputMessage
                    ]
                }
                return updatedMessages
            })
            mutate(cacheKey, (currentCachedData: ChannelDataStatus | undefined) =>{
                if (!currentCachedData || !currentCachedData.channel) {
                    return undefined;
                  }
                let updatedChannelData = {...currentCachedData}
                const updatedMessages = updatedChannelData.channel.messages?.length
                ? [...updatedChannelData.channel.messages]
                : [];
                
                updatedMessages[updatedMessages.length-1]={
                    ...updatedMessages[updatedMessages.length - 1],
                    content:[
                        ...updatedMessages[updatedMessages.length-1].content,
                        inputMessage
                    ]
                }
                updatedChannelData.channel.messages = updatedMessages
                return updatedChannelData
            }
            )

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

                channelNumber
            })
            //Since in the message that we sent, the socket only sends
            //the message to the user besides the sender, we 
            //update the MessageReceived manually.
            setMessageReceived((prevMessages) => {
                    return [...prevMessages, messageContents]
            })

            mutate(cacheKey, (currentCachedData: ChannelDataStatus | undefined) =>{
                if (!currentCachedData || !currentCachedData.channel) {
                    return undefined;
                  }
                let updatedChannelData = {...currentCachedData}
                const updatedMessages = updatedChannelData.channel.messages?.length
                ? [...updatedChannelData.channel.messages]
                : [];

                updatedMessages.push(messageContents)
                updatedChannelData.channel.messages = updatedMessages
                return updatedChannelData
            }
            )

        }
        setInputMessage('')
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
            <div className="modal-overlay">
            </div>
            <section className="message-section">
                <nav className="channel-nav">
                    {currentChannel?.channelType==="Group"&&
                    <button className="nav-button">
                        <img src="/img/invite-member.svg"/>
                    </button>
                        }
                    {(currentChannel?.channelType==="Group"&&currentChannel?.groupLeader!==_id)&&
                    <button className="nav-button">
                       <img src="/img/leave-group-icon.svg"/>
                    </button>}
                    {(
                        currentChannel?.channelType==="Group"
                        &&currentChannel?.groupLeader===_id)
                        &&<button className="disband-group-button">Disband Group</button>
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
                        <div>No Messages</div>
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
                    <button onClick={sendMessage} disabled={inputMessage.trim()===''}>Send</button>
                </div>
            </section>
            <section className="channel-members-section">
                <ul className="member-list">
                {
                    currentChannelMembers.map((member, i)=>(
                      <li className='member-container' key={`member-${i}`}>
                        <button className="member-popup-button">
                            <img className='member-profile-photo' src={`/img/${member.photo}`}/>
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

