import LeftSection from '../components/LeftSection'
import ChannelSection from '../components/ChannelSection'
import {useState, useEffect} from 'react'
import {Routes, Route, useNavigate, useLocation} from 'react-router-dom'
import {io, Socket} from 'socket.io-client'
import {jwtDecode} from 'jwt-decode'
import axios from 'axios'
import {mutate} from "swr"
import {AxiosResponse} from 'axios'
import {User, Channel, Friend, UserDataStatus, FriendDetails, ChannelDataStatus, ChannelMemberUpdate, LastMessageUpdate, ChannelMessage, ChannelMessagesStatus} from '../types/generalTypes'
import {getCurrentUser} from '../services/apiService'

const HomePage = ()=>{
        //Get token from local storage
        const token = localStorage.getItem('token')
        //We use this to navigate from pages to pages
        const navigate = useNavigate()
        //This is where we saved the fetched current logged in user's data
        const [userData, setUserData] = useState<User>()
        //The logged in users channels
        //if we left the initial value of the state to be blank ()
        //the type would be Channel[] | undefined
        const [channels, setChannels] = useState<Channel[]>([])
        const [socket, setSocket] = useState<Socket>()
        const [myFriends, setMyFreinds] = useState<FriendDetails[]>([])
        const location = useLocation()

        useEffect(()=>{
            const socket: Socket = io('http://localhost:3001', {
            query: {
                token: localStorage.getItem('token'),
            },
            });
            setSocket(socket)
            return ()=>{
                socket.disconnect()
            }
        },[token])

        useEffect(()=>{
            const currentUser:()=>Promise<void> = async ()=>{
                try{
                    //Fetching logged in user's data
                    const res:AxiosResponse<UserDataStatus> = await getCurrentUser(token)
                    //If the response was success
                    if(res.data.status === 'success'){
                        //Save the logged in user's data to a state
                        setUserData(res.data.user)
                        const groupChannels:Channel[] = [...res.data.user.groups??[]]
                        const friendChannels:Friend[] = res.data.user?.friends?.filter(friend => friend.status === 'Friend')??[]
                        //Since the implementation of channels of friend channel is different to group channel is different
                        //we need to change the structure of the friends array to match group array so we could use sort.
                        const newFriendChannels:Channel[] = friendChannels.map((friend:Friend)=>{
                            return{ 
                                channelNumber: friend.channel.channelNumber,
                                lastMessage:friend.channel.lastMessage,
                                _id:friend.channel._id,
                                id:friend.channel.id,
                                channelName: friend.friend.displayName,
                                photo: friend.friend.photo,
                            }
                        })
                        const friendDetails:FriendDetails[] = friendChannels.map((friend)=> friend.friend)
                        //Since during in a friend list we only need simple informations about the user
                        setMyFreinds(friendDetails)
                        //Combine all friend and group channels.
                        const allChannels:Channel[] = [...newFriendChannels, ...groupChannels]
                        const sortedChannels:Channel[] = allChannels.sort((a, b) => {
                            const dateA = new Date(a.lastMessage).getTime() // Convert to milliseconds
                            const dateB = new Date(b.lastMessage).getTime() // Convert to milliseconds
                            return dateB - dateA; // Compare the millisecond values
                        })
                        //Save the sorted channels to a state
                        setChannels(sortedChannels)
                    }
                    
                }catch(error: unknown){
                    if (axios.isAxiosError(error)) { // Type guard for AxiosError
                        // Now you can safely assume error is of type AxiosError
                        console.log(error.message)
                    }else if (error instanceof Error) {
                        console.log(error.message)
                    }else {
                        console.error('An unknown error occurred:', error)
                    }
                }
            }
            if (token) {
                //if there is a token, run the currentUser data fetching function
                currentUser();
            } else {
                //If not, go back to login page
                navigate('/login');
    
            }
        }, [token])

        useEffect(() => {
            //Check if the token is not yet expired
            if (token) {
                const decodedToken = jwtDecode(token);
                //default value is 0, if the expiration of the token is not defined.
                const isExpired = (decodedToken.exp??0) * 1000 < Date.now();
                //if expired remove the token, and navigate to login page
                if (isExpired) {
                    navigate('/login')
                    localStorage.removeItem('token')
                }
            }
        }, [token, navigate]);

        //Join room for a live update
        useEffect(()=>{
          if(userData&&socket){
            socket.emit('liveUpdates', userData._id)
            return ()=>{
                socket.emit('leaveLiveUpdates', userData._id)
            }
          }  
        }, [userData, socket])

        useEffect(()=>{
            if(socket){
                const handleLastMsgUpdate = (data:LastMessageUpdate):void=>{
                    setChannels(prevChannels => {
                        const currChannels = [...prevChannels]
                        const channelToUpdate = currChannels.find(channel=>channel._id===data.channelId)
                        if(channelToUpdate){
                            channelToUpdate.lastMessage = data.newTime
                        }
                        const sortedChannels:Channel[] = currChannels.sort((a, b) => {
                            const dateA = new Date(a.lastMessage).getTime() // Convert to milliseconds
                            const dateB = new Date(b.lastMessage).getTime() // Convert to milliseconds
                            return dateB - dateA; // Compare the millisecond values
                        })
                        return sortedChannels
                    })
                    if(location.pathname !== `/@me/channels/${data.channelNumber}`){
                        mutate(`api/v1/channels/${data.channelNumber}/messages`, (prevMessagesDataCache:ChannelMessagesStatus|undefined)=>{
                            if(!prevMessagesDataCache){
                                return undefined
                            }
                            const updateMessages = [...prevMessagesDataCache.messages]
                            if(data.message.updated){
                                updateMessages[0] = data.message
                                return {status:prevMessagesDataCache.status, messages:updateMessages}
                            }
                            return {status:prevMessagesDataCache.status, messages:updateMessages}
                        }, false)
                    }
                }
                socket.on('channel_lastmsg_update', handleLastMsgUpdate)
                const cleanup = ():void  =>{
                    socket.removeListener('channel_lastmsg_update', handleLastMsgUpdate);
                }
                return cleanup
            }                            
            //We need to add the location dependency as well to keep the useEffect in sync with the
            //current URL, this ensures that the effect will re-execute whenever the url changes, providing
            //the most up to date object inside the effect. Without so, the value would remain the same
            //even though the url changes (the location would be similar to its initial value always)
        }, [socket, location])
        useEffect(()=>{
            if(socket){
                const handleChannelMemberUpdate = (data:ChannelMemberUpdate)=>{
                    mutate(`api/v1/channels/${data.channelNumber}`, (channelDataCache:ChannelDataStatus|undefined)=>{
                        if(!channelDataCache){
                            return undefined
                        }
                        const updateChannelDataCache = {...channelDataCache.channel}
                        updateChannelDataCache.members = [...updateChannelDataCache.members, data.invitedUser]
                        return {status:channelDataCache.status, channel:updateChannelDataCache}
                    }, false)
                }
                socket.on(`channel_new_member_update`, handleChannelMemberUpdate)
                const cleanup = ():void  =>{
                    socket.removeListener('channel_new_member_update', handleChannelMemberUpdate);
                }
                return cleanup
            }
        }, [socket])


        const handleLogout: (e: React.MouseEvent<HTMLButtonElement>) => void = (e) => {
            e.preventDefault(); // Prevents the default behavior of the button
            localStorage.removeItem('token')
            setUserData(undefined)
            setChannels([])
            navigate('/login')
        };
        return(
            <>
                {userData&&token?
                    <main className='homepage'>
                        <LeftSection channels={channels} handleLogout={handleLogout} currentUserData={userData}/>
                        <Routes>
                            <Route index element={<div>asd</div>}/>
                            <Route path="channels/:channelNumber"
                            element={<ChannelSection
                            socket={socket}
                            currentUserData={userData}
                            token={token}
                            myFriends={myFriends}/>}/>
                        </Routes>
                    </main>
                    :
                <main className='homepage'>
                    <section className='right-home-section'></section>
                    <section className='left-home-section'></section>
                </main>
                }
            </>
    )   
}

export default HomePage