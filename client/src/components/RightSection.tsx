import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { ChannelDataStatus, ChannelMessage, CurrentChannel, RightSectionProps } from "../types/generalTypes";
import { getCurrentChannel } from "../services/apiService";
import { AxiosResponse } from "axios";


export const RightSection:React.FC<RightSectionProps>=({token, socket, currentUserData})=>{
    //Since currentUserData consists of many information
    //we can destructure it so we can just use what info we need.
    const {photo, displayName, _id} = currentUserData
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
                setMessageReceived(prevMessages => {
                    // If prevMessages is undefined, initialize it as an array with newMessage
                    // Otherwise, append newMessage to it
                    return [...prevMessages, newMessage];
                });
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


    const sendMessage = () =>{
        //We also inserted the channelNumber(room) to send the message 
        //to the other members in the channel.

        //----------------------------------------
        if(!socket){
            return
        }
        if(!currentChannel){
            return navigate('/')
        }
        const messageContents:ChannelMessage = {
            content:inputMessage,
            channel:currentChannel._id,
            time: Date.now(),
            sender:{
                photo, displayName, _id:_id
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
        setInputMessage('')
    }
    return (
        <section className='right-home-section'>
            {messageReceived?
            <div>
                {messageReceived.map((m, index)=>(
                    <div key={index}>{m.sender.displayName}{m.content}</div>
                ))}   
            </div>:
            <div>didn't work</div>}

            <input 
                type='text' value={inputMessage} 
                onChange={(event)=>setInputMessage(event.target.value)}
            />
            <button onClick={sendMessage} disabled={inputMessage.trim()===''}>Send</button>
        </section>
    )
}

export default RightSection

