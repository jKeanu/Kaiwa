import LeftSection from '../components/LeftSection'
import ChannelSection from '../components/ChannelSection'
import {useState, useEffect} from 'react'
import {Routes, Route, useNavigate } from 'react-router-dom'
import {io, Socket} from 'socket.io-client'
import {jwtDecode} from 'jwt-decode'
import axios from 'axios'
import {AxiosResponse} from 'axios'
import {User, Channel, Friend, UserDataStatus, FriendDetails} from '../types/generalTypes'
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
        }, [token, navigate])

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
                const handleLastMsgUpdate = (data:{channelId:string, newTime:Date})=>{
                    setChannels(prevChannels => {
                        const currChannels = [...prevChannels]
                        const channelToUpdate = currChannels.find(channel=>channel._id===data.channelId)
                        console.log(data.channelId, '------123123')
                        if(channelToUpdate){
                            console.log('???')
                            channelToUpdate.lastMessage = data.newTime
                        }
                        console.log(channelToUpdate?.lastMessage, '-------------')
                        const sortedChannels:Channel[] = currChannels.sort((a, b) => {
                            const dateA = new Date(a.lastMessage).getTime() // Convert to milliseconds
                            const dateB = new Date(b.lastMessage).getTime() // Convert to milliseconds
                            return dateB - dateA; // Compare the millisecond values
                        })
                        return sortedChannels
                    })
                }
                socket.on('channel_lastmsg_update', handleLastMsgUpdate)
                const cleanup = ():void  =>{
                    socket.removeListener('channel_lastmsg_update', handleLastMsgUpdate);
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