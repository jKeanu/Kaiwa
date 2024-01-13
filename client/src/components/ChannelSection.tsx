import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, KeyboardEvent, useRef } from 'react';
import { ChannelDataStatus, ChannelMessage, CurrentChannel, ChannelSectionProps } from "../types/generalTypes";
import { getCurrentChannel } from "../services/apiService";
import { AxiosResponse } from "axios";


export const ChannelSection:React.FC<ChannelSectionProps>=({token, socket, currentUserData})=>{
    //Since currentUserData consists of many information
    //we can destructure it so we can just use what info we need.
    const {photo, displayName, _id, friendTag} = currentUserData
    const {channelNumber} = useParams();
    const navigate = useNavigate()
    const [inputMessage, setInputMessage] = useState<string>('');
    const [messageReceived, setMessageReceived] = useState<ChannelMessage[]>([]);
    const [currentChannel, setCurrentChannel] = useState<CurrentChannel>()
    useEffect(()=>{
        async function getChannel(){
            try{
                const res:AxiosResponse<ChannelDataStatus> = await getCurrentChannel(token, channelNumber)
                if(res.data.status==='success'){
                    setCurrentChannel(res.data.channel)
                    if(res.data.channel.messages){
                        setMessageReceived(res.data.channel.messages)
                    }else{
                        setMessageReceived([])
                    }
                }
            }
            catch(err){
                console.log(err)
            }
        
        }
        //if there is a token, run the currentUser data fetching function
        if(token){
            getChannel()
        }else{
            navigate('/')
        }
    }, [token, channelNumber, navigate])
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

    const messageBoxRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (messageBoxRef.current) {
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
        if(messageReceived.length>0&&messageReceived[messageReceived.length-1].sender._id === _id && timeDifference <= 60*1000){
            //We won't change the formattedDate since, to have more user-friendly approach
            //Since we base the date of the  message on the first message content.
            socket.emit("continue_message",
            {
                time:messageReceived[messageReceived.length-1].time,
                sender:{photo, displayName, _id:_id, friendTag},
                channel:currentChannel._id,
                content:inputMessage,
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
            return `Today ${timeStr}`;
        } else {
            return dateStr;
        }
    }

    function handleKeyDown(event:KeyboardEvent<HTMLInputElement>):void{
    // Check if the Enter key was pressed (key code 13)
    if (event.key === 'Enter') {
        // Prevent the default behavior of the Enter key (form submission)
        event.preventDefault();
        // Call the sendMessage function or any other action
        sendMessage();
      }
    }

    return (
        <section className='right-home-section'>
            <section className="message-section">
                <div className="message-box" ref={messageBoxRef}>
                    {
                    messageReceived.length>=1?
                        messageReceived.map((message, index)=>(
                            <div className='message-info-container' key={index}>
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
                                    {
                                        message.content.map((m, i)=>(
                                            <div key={i}>{m}</div>
                                        ))
                                    }
                                </div>
                            </div>
                        )):
                        <div>No Messages</div>
                        }
                </div>
                <div className="message-input-container">
                    <input 
                    type='text' value={inputMessage} 
                    placeholder="Send a message..."
                    onKeyDown={handleKeyDown}
                    onChange={(event)=>setInputMessage(event.target.value)} className="message-input"/>
                    <button onClick={sendMessage} disabled={inputMessage.trim()===''}>Send</button>
                </div>
            </section>
            <section className="channel-members-section">
                <ul className="member-list">
                {currentChannel?
                    currentChannel.members.map((member, i)=>(
                      <li className='member-container' key={`member-${i}`}>
                        <button className="member-popup-button">
                            <img className='member-profile-photo' src={`/img/${member.photo}`}/>
                            <span className="member-name">{member.displayName}</span>
                        </button>
                      </li>  
                    )):
                    <div></div>
                    }
                </ul>
            </section>
        </section>
    )
}

export default ChannelSection

