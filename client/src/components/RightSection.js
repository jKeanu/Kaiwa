import {useParams} from "react-router-dom"
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'
import axios from "axios"

function RightSection({token, socket}){
    const {channelNumber} = useParams();
    const [messageContent, setMessageContent] = useState("");
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
                    url: `http://localhost:3001/api/v1/me/channels/${channelNumber}`
                })
                if(res.data.status==='success'){
                    setCurrentChannel(res.data.channel)
                }
            }
            catch(err){
                console.log(err)
            }
        
        }
        if (token) {
            //if there is a token, run the currentUser data fetching function
            getChannel();
        } else {
            //If not, go back to login page
            navigate('@me');
        }
    })

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
            const handleReceiveMessage = text => {
                setMessageReceived(prevMessages => [...prevMessages, text]);
            };
            // Adding the listener
            socket.on('receive_message', handleReceiveMessage);
            // Cleanup function to remove the listener
            return () => socket.removeListener('receive_message', handleReceiveMessage);
        }
    }, [socket, channelNumber]);


    const sendMessage = () =>{
        socket.emit("send_message", {channelNumber, messageContent})
        setMessageReceived((prevMessages) => [...prevMessages, messageContent])
        setMessageContent('')
    }

    return (
        <section className='right-home-section'>
        </section>
    )
}

export default RightSection