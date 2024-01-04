import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import axios from "axios"

function RightSection({token, socket, currentUserData}){
    //Since currentUserData consists of many information
    //we can destructure it so we can just use what info we need.
    const {image, displayName} = currentUserData
    const {channelNumber} = useParams();
    const navigate = useNavigate()
    const [inputMessage, setInputMessage] = useState('');
    const [messageReceived, setMessageReceived] = useState([]);
    const [currentChannel, setCurrentChannel] = useState('')

    useEffect(()=>{
        async function getChannel(){
            try{
                const res = await axios({
                    headers:{
                        'Authorization': `Bearer ${token}`
                    },
                    method: 'GET',
                    url: `http://localhost:3001/api/v1/channels/${channelNumber}`
                })
                if(res.data.status==='success'){
                    setCurrentChannel(res.data.channel)
                    setMessageReceived(res.data.channel.messages)
                    console.log(messageReceived, '----ssd')
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
            const handleReceiveMessage = newMessage => {
                setMessageReceived(prevMessages => {
                    if(!prevMessages){
                        return [newMessage]
                    }else{
                        return [...prevMessages, newMessage]
                    }
                });
            };
            // Adding the listener
            socket.on('receive_message', handleReceiveMessage);
            // Cleanup function to remove the listener
            return () => socket.removeListener('receive_message', handleReceiveMessage);
        }
    }, [socket, channelNumber]);


    const sendMessage = () =>{
        //We also inserted the channelNumber(room) to send the message 
        //to the other members in the channel.
        socket.emit("send_message", {
            content:inputMessage,
            channelId: currentChannel._id,
            channelNumber,
            time:Date.now(),
            displayName,
            image
        })
        //Since in the message that we sent, the socket only sends
        //the message to the user besides the sender, we 
        //update the MessageReceived manually.
        setMessageReceived((prevMessages) => {
            if(!prevMessages){
                return [
                    {
                        content:inputMessage,
                        sender:{
                            image, displayName
                    }}]
            }else{
                return [...prevMessages,
                    {
                        content:inputMessage,
                        sender:{
                            image, displayName
                    }}]
            }
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

