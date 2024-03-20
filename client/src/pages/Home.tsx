import {useState, useEffect, useMemo, useCallback} from 'react'
import {Routes, Route, useNavigate, useLocation} from 'react-router-dom'
import {io, Socket} from 'socket.io-client'
import {jwtDecode} from 'jwt-decode'
import {mutate} from "swr"
import LeftSection from '../components/LeftSection'
import ChannelSection from '../components/ChannelSection'
import {User, Channel, 
        Friend, UserDataStatus, 
        FriendDetails, ChannelDataStatus, 
        ChannelMemberUpdate, LastMessageUpdate,
        ChannelMessagesStatus, UserStatusUpdate, FriendReq, SentReq, FriendRequestAccepted, NoticeModalSettings,
        FIdChannelInfo} 
        from '../types/generalTypes'
import HomeSection from '../components/HomeSection'
import { getCurrentUser } from '../services/apiService'
import axios, {AxiosResponse} from 'axios'
import NoticeModal from '../components/modals/Notice'
import { ChannelSectionContext, HomeSectionContext, LeftSectionContext } from '../context'


const HomePage:React.FC = ()=>{
        //Get token from local storage
        const [token, setToken] = useState(localStorage.getItem('token'))
        //We use this to navigate from pages to pages
        const navigate = useNavigate()
        //This is where we saved the fetched current logged in user's data
        const [userData, setUserData] = useState<User>()
        //The logged in users channels
        //if we left the initial value of the state to be blank ()
        //the type would be Channel[] | undefined
        const [channels, setChannels] = useState<Channel[]>([])
        const [socket, setSocket] = useState<Socket>()
        const [friendChannels, setFriendChannels] = useState<Friend[]>([])
        const [friendReqs, setFriendReqs] = useState<FriendReq[]>([])
        const [sentReqs, setSentReqs] = useState<SentReq[]>([])
        const [isFriendsOpen, setIsFriendsOpen] = useState<boolean>(false)
        const [noticeModal, setNoticeModal] = useState<NoticeModalSettings>
        ({isOpen:false, channelId:'', type:''})
        const location = useLocation()

        const friendChannelIds = useMemo(()=>{
            return [...friendChannels].map(friendChannel => friendChannel.channel._id)
        }, [friendChannels])
        
        const myFriends:FriendDetails[] = useMemo(()=>{
            return [...friendChannels].map(friend=>friend.friend)
        }, [friendChannels])

        const fIdAndChannelInfos:FIdChannelInfo[] = useMemo(()=>{
            return [...friendChannels].map(friend=>{
                return {friendId:friend.friend._id, channelNumber:friend.channel.channelNumber, channelId:friend.channel._id}
            })
        }, [friendChannels])

        //join rooms based on the channel id, so when there's an update in the channel
        //we will be notified
        const ChannelIds:string[] = useMemo(()=>{
            return [...channels].map(channel => channel._id)
        }, [channels])

    
        useEffect(() => {
            //we need to determine if the webpage is fully visible before connecting to the socket since,
            //webpages have preloading feature on where they detect what you type in url or hover in the link
            //it will preload certain resources.
            if (token) {
                const socket = io('http://localhost:3001', { query: { token } });
                setSocket(socket);
                return ()=>{
                    socket.disconnect()
                }
            }     
        }, [token])

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
                        const friendReqData:FriendReq[] = res.data.user?.friends?.filter(friend=>friend.status === 'Pending')??[]
                        setFriendReqs(friendReqData)
                        const sentReqData:SentReq[] = res.data.user?.friends?.filter(friend=>friend.status === 'Sent')??[]
                        setSentReqs(sentReqData)
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
                                photoUrl: friend.friend.photoUrl,
                                channelType: friend.channel.channelType,
                                formattedLastMessage: friend.channel.formattedLastMessage
                            }
                        })
                        //In this case, we only need the friend information, not including the channel.
                        //Since
                        setFriendChannels(friendChannels)
                        //Combine all friend and group channels.
                        const allChannels:Channel[] = [...newFriendChannels, ...groupChannels]
                        const sortedChannels:Channel[] = allChannels.sort((a, b) => {
                            const dateA = new Date(a.lastMessage).getTime() // Convert to milliseconds
                            const dateB = new Date(b.lastMessage).getTime() // Convert to milliseconds
                            return dateB - dateA; // Compare the millisecond values
                        })
                        //Save the sorted channels to a state
                        //NOTE: we implemented the channels based on the fetched user data, since
                        //if we based it on the userData state variable, we need to create a new useEffect hook,
                        //and since we base it on the userData we need to use the useData as a dependency,
                        //(updating the friends and groups channels in the userData)
                        //and every change, the methods above gets executed each time, which is redundant.
                        //In other words, its like redefining channels state variable again and again.
                        //When we can just save the channels right away and apply the changes on the setter.
                        setChannels(sortedChannels)
                    }
                }catch(error: unknown){
                    // localStorage.removeItem('token')
                    // setToken('')
                    // navigate('/login')
                    console.log(error)
                }
            }
            if (token) {
                //if there is a token, run the currentUser data fetching function
                currentUser();
            }else {
                //If not, go back to login page
                navigate('/login');
            }
        }, [token, navigate])


        //We need this function specifically when we acccept a friend request, or someone accepted ours,
        //to create a new channel
        const handleNewFriendChannel = useCallback((friendInfo:Friend):void=>{
            const convertChannel:Channel = {
                channelName:friendInfo.friend.displayName,
                channelNumber: friendInfo.channel.channelNumber,
                channelType: friendInfo.channel.channelType,
                id: friendInfo.channel.id,
                _id: friendInfo.channel._id,
                lastMessage: friendInfo.channel.lastMessage,
                photo: friendInfo.friend.photo,
                photoUrl: friendInfo.friend.photoUrl,
                formattedLastMessage: friendInfo.channel.formattedLastMessage
            }
            setChannels(prevChannels =>{
                const updateChannel = [...prevChannels]
                updateChannel.unshift(convertChannel)
                return updateChannel
            })
            setFriendChannels(prevFriendChannels=>{
                return [...prevFriendChannels, friendInfo]
            })
        }, [])
        

        //When we remove a friend from a friend list, or someone did remove us.
        const handleFriendChannelDelete = useCallback((channelId:string):void=>{
            setFriendChannels(prevFriendChannels=>{
                return [...prevFriendChannels].filter(friendChannels => friendChannels.channel._id!==channelId)
            })
            setChannels(prevChannels=>{
                return [...prevChannels].filter(channels=>channels._id !==channelId)
            })
        }, [])

        useEffect(() => {
            // Check if token doesn't exist, then navigate to login
            if (!token) {
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
                    setToken('')
                    localStorage.removeItem('token')
                }
            }
        }, [token, navigate]);

        //LIVE UPDATES
        useEffect(()=>{
            if(socket){
                socket.emit('personal_live_update')
                return ()=>{
                    socket.emit('leave_personal_live_update')
                }
            }
        }, [userData, socket])

        useEffect(()=>{
            if(channels&&socket){
                socket.emit('channel_live_updates', ChannelIds)
                return ()=>{
                    socket.emit('leave_channel_live_updates', ChannelIds)
                }
            }
        }, [channels, socket])

        //New Friend channel
        useEffect(()=>{
            if(socket){
                const handleRequestAccepted = (data:FriendRequestAccepted)=>{
                    const newFriendInfo = [...sentReqs].find(sentReq=>sentReq.friend._id===data.newFriendId)
                    if(newFriendInfo){
                        const newFriendChannel:Friend = {
                            channel:{...data.newChannelInfo},
                            friend:{
                                ...newFriendInfo.friend
                            },
                            _id:newFriendInfo._id,
                            status:"Friend"
                        }
                        handleNewFriendChannel(newFriendChannel)
                        setSentReqs(prevSentReqs=>{
                            return [...prevSentReqs].filter(sentReqs=>sentReqs.friend._id!==data.newFriendId)
                        })
                    }}
                socket.on('friend_request_accepted', handleRequestAccepted)
                const cleanup = ():void=>{
                    socket.removeListener('friend_request_accepted', handleRequestAccepted)
                }
                return cleanup
            }
        }, [socket, sentReqs])

        //When someone declined your friend request
        useEffect(()=>{
            if(socket){
                const handleRequestDeclined = (data:{userId:string}):void=>{
                    console.log(data.userId, '123123123123')
                    setSentReqs(prevSentReqs=>[...prevSentReqs].filter(sentReq=>sentReq.friend._id!==data.userId))
                }
                socket.on("friend_request_declined", handleRequestDeclined)
                const cleanup = ():void=>{
                    socket.removeListener('friend_request_declined', handleRequestDeclined)
                }
                return cleanup
            }
        }, [sentReqs, socket])

        //If someone sends a message on a channel, this updates the order of the channel list
        useEffect(()=>{
            if(socket){
                const handleLastMsgUpdate = (data:LastMessageUpdate):void=>{
                    setChannels(prevChannels => {
                        const currChannels = [...prevChannels]
                        const channelToUpdate = currChannels.find(channel=>channel._id===data.channelId)
                        if(channelToUpdate){
                            channelToUpdate.lastMessage = data.newTime
                            //if its a new message and not a continue message, we update the formatted time of the channel
                            if(!data.message.updated && data.newFormattedTime){
                                channelToUpdate.formattedLastMessage = data.newFormattedTime
                            }
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
                            return {status:prevMessagesDataCache.status, messages:[data.message, ...updateMessages]}
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

        //This updates when a member left or joined the channel that you are part of
        useEffect(()=>{
            if(socket){
                const handleChannelMemberUpdate = (data:ChannelMemberUpdate):void=>{
                    mutate(`api/v1/channels/${data.channelNumber}`, (channelDataCache:ChannelDataStatus|undefined)=>{
                        if(!channelDataCache){
                            return undefined
                        }
                        if(data.type==='Joined'){
                            //Update the channels when someone joined the channel
                            const updateChannelDataCache = {...channelDataCache.channel}
                            updateChannelDataCache.members = [...updateChannelDataCache.members, data.user]
                            return {status:channelDataCache.status, channel:updateChannelDataCache}
                        }else if(data.type==='Left'){
                            const updateChannelDataCache = {...channelDataCache.channel}
                            updateChannelDataCache.members = [...updateChannelDataCache.members].filter(member=>member._id!==data.user._id)
                            return {status:channelDataCache.status, channel:updateChannelDataCache}
                        }
                    }, false)
                    if(data.type==='Joined'){
                        //update the channels when someone joined the channel
                        setChannels(prevChannels=>{
                            const updateChannels = [...prevChannels]
                            const currChannel = updateChannels.find(channel=>channel.channelNumber===data.channelNumber)
                            if(currChannel){
                                currChannel.lastMessage = Date.now()
                            }
                            const sortedChannels = updateChannels.sort((a, b) => {
                                const dateA = new Date(a.lastMessage).getTime() // Convert to milliseconds
                                const dateB = new Date(b.lastMessage).getTime() // Convert to milliseconds
                                return dateB - dateA; // Compare the millisecond values
                            })
                            return sortedChannels
                        })
                    }
                }
                socket.on(`channel_member_update`, handleChannelMemberUpdate)
                const cleanup = ():void  =>{
                    socket.removeListener('channel_member_update', handleChannelMemberUpdate);
                }
                return cleanup
            }
        }, [socket])

        //This executed when a you were invited to an already existing group channel
        useEffect(()=>{
            if(socket){
                const groupChannelInvite = (newGroupChannel:Channel)=>{
                    setChannels(prevChannels => [newGroupChannel, ...prevChannels])
                }
                socket.on('invited_to_group', groupChannelInvite)
                const cleanup = ():void=>{
                    socket.removeListener('invited_to_group', groupChannelInvite)
                }
                return cleanup
            }
        }, [socket])

        //When a friend or a member of the group you're part of went online
        useEffect(()=>{
            if(socket){
                const handleUserOnlineStatus = (data:UserStatusUpdate):void=>{
                    mutate(`api/v1/channels/${data.channelNumber}`, (channelDataCache:ChannelDataStatus|undefined)=>{
                        if(!channelDataCache){
                            return
                        }
                        const updateChannelDataCache = {...channelDataCache.channel}
                        const channelMembers = updateChannelDataCache.members
                        const channelMemberIndex = updateChannelDataCache.members.findIndex(member=>member._id===data.userId)
                        //update user status to online
                        channelMembers[channelMemberIndex] = {...channelMembers[channelMemberIndex], status:'Online'}
                        return {status:channelDataCache.status, channel:updateChannelDataCache}
                    })
                    //check if the user who went online is also your friend based on the friend channel id
                    if(data.type==='Friend'){
                        const friendChannelId = friendChannelIds.find(friendChannelId => friendChannelId === data.channelId)
                        if(friendChannelId){
                            setFriendChannels(prevFriendChannels=>{
                                const updateFriendChannel = [...prevFriendChannels]
                                const friendIndex = updateFriendChannel
                                    .findIndex(friendchannel=>friendchannel.channel._id===friendChannelId)
                                updateFriendChannel[friendIndex].friend.status = 'Online'
                                return updateFriendChannel
                            })
                        }
                    }
                }
                socket.on('user_status_update_online', handleUserOnlineStatus)
                const cleanup =():void =>{
                    socket.removeListener('user_status_update_online', handleUserOnlineStatus);
                }
                return cleanup
        }},[socket, friendChannelIds])

        //When a friend or a member of the group you're part of went offline
        useEffect(()=>{
            if(socket){
                const handleUserOfflineStatus = (data:UserStatusUpdate):void=>{
                    mutate(`api/v1/channels/${data.channelNumber}`, (channelDataCache:ChannelDataStatus|undefined)=>{
                        if(!channelDataCache){
                            return undefined
                        }
                        const updateChannelDataCache = {...channelDataCache.channel}
                        const channelMembers = updateChannelDataCache.members
                        const channelMemberIndex = updateChannelDataCache.members.findIndex(member=>member._id===data.userId)
                        //update user status to online
                        channelMembers[channelMemberIndex] = {...channelMembers[channelMemberIndex], status:'Offline'}
                        return {status:channelDataCache.status, channel:updateChannelDataCache}
                    })
                    if(data.type==='Friend'){
                        const friendChannelId = friendChannelIds.find(friendChannelId => friendChannelId === data.channelId)
                        if(friendChannelId){
                            setFriendChannels(prevFriendChannels=>{
                                const updateFriendChannel = [...prevFriendChannels]
                                const friendIndex = updateFriendChannel
                                    .findIndex(friendchannel=>friendchannel.channel._id===friendChannelId)
                                updateFriendChannel[friendIndex].friend.status = 'Offline'
                                return updateFriendChannel
                            })
                        }
                    }
                }
                socket.on('user_status_update_offline', handleUserOfflineStatus)
                const cleanup =():void =>{
                    socket.removeListener('user_status_update_offline', handleUserOfflineStatus);
                }
                return cleanup
        }},[socket, friendChannelIds])



        //When someone added you as a friend
        useEffect(()=>{
            if(socket){
                const handleFriendRequest = (data:FriendReq)=>{
                    setFriendReqs(prevUserReqs=> [...prevUserReqs, data])
                }
                socket.on('receive-friend-request', handleFriendRequest)
                const cleanup = ():void=>{
                    socket.removeListener('receive-friend-request', handleFriendRequest)
                }
                return cleanup
            }
        }, [socket])


        //When someone in your friends included you in a new group
        useEffect(()=>{
            if(socket){
                const handleNewGroupChannel = (data:Channel)=>{
                    console.log(data, '--------')
                    setChannels(prevChannels=>[data, ...prevChannels])
                }
                socket.on('new_group_channel', handleNewGroupChannel)
                const cleanup=():void=>{
                    socket.removeListener('new_group_channel', handleNewGroupChannel)
                }
                return cleanup
            }
        }, [socket])

        const handleModalConfirm = (e:React.MouseEvent<HTMLButtonElement>)=>{
            e.preventDefault()
            if(noticeModal.type==='Group'){
                setChannels(prevChannels=> [...prevChannels].filter(channel=>channel._id!==noticeModal.channelId))
                setNoticeModal({isOpen:false, channelId:'', type:''})
            }else if(noticeModal.type==='Friend'){
                setChannels(prevChannels=> [...prevChannels]
                    .filter(channel=>channel._id!==noticeModal.channelId))
                setFriendChannels(prevFriendChannels=> [...prevFriendChannels]
                    .filter(channel=>channel.channel._id!==noticeModal.channelId))
                setNoticeModal({isOpen:false, channelId:'', type:''})
            }
        }

        //This executes when the group leader of a group channel deleted the group channel
        useEffect(()=>{
            if(socket){
                const handleGroupDeletion = (data:{channelNumber:number, channelId:string}):void=>{
                    // setChannels(prevChannels=> [...prevChannels].filter(channels=>channels._id!==channelId))
                    if(location.pathname === `/@me/channels/${data.channelNumber}`){
                        navigate('/@me')
                        setNoticeModal({isOpen:true, channelId:data.channelId, type:'Group'})
                    }else{
                        setChannels(prevChannels=> [...prevChannels].filter(channels=>channels._id!==data.channelId))
                    }
                }
                socket.on("delete_group_channel", handleGroupDeletion)
                const cleanup=():void=>{
                    socket.removeListener('delete_group_channel', handleGroupDeletion)
                }
                return cleanup
            }
        }, [socket, location])

        //This executes when you have been unfriended by one of your friends
        useEffect(()=>{
            if(socket){
                const handleFriendDeletion = (data:{channelNumber:number, channelId:string}):void=>{
                    if(location.pathname === `/@me/channels/${data.channelNumber}`){
                        navigate('/@me')
                        setNoticeModal({isOpen:true, channelId:data.channelId, type:'Friend'})
                    }else{
                        setChannels(prevChannels=> [...prevChannels]
                            .filter(channel=>channel._id!==data.channelId))
                        setFriendChannels(prevFriendChannels=> [...prevFriendChannels]
                            .filter(channel=>channel.channel._id!==data.channelId))
                    }
                }
                socket.on("delete_friend_channel", handleFriendDeletion)
                const cleanup=():void=>{
                    socket.removeListener('delete_friend_channel', handleFriendDeletion)
                }
                return cleanup
            }
        }, [socket, location])

        //When someone assigned you as a new leader of a group channel
        useEffect(()=>{
            if(socket){
                socket.on("new_group_leader", (data:{channelNumber:number, newLeaderId:string}):void=>{
                    mutate(`api/v1/channels/${data.channelNumber}`, (prevChannelDataStatus:ChannelDataStatus|undefined)=>{
                        if(!prevChannelDataStatus){
                            return
                        }
                        const updateChannelData = {...prevChannelDataStatus.channel}
                        updateChannelData.groupLeader = data.newLeaderId
                        return {status:prevChannelDataStatus.status, channel:updateChannelData}
                    }, false)
                })
            }
        }, [socket])

        
        const formatToTodayIfCurrentDate = useCallback((dateStr: string): string => {
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
        }, []);

        const handleLogout: (e: React.MouseEvent<HTMLButtonElement>) => void = (e) => {
            e.preventDefault()
            setToken('')
            localStorage.removeItem('token')
            window.location.href = '/login'
        };
        return(
            <>
            {userData&&token?
                <main className='homepage'>
                    {noticeModal.isOpen&&
                    <dialog className='modal-window-container'>
                        <NoticeModal handleModalConfirm={handleModalConfirm}/>
                    </dialog>}
                    <LeftSectionContext.Provider value={{setChannels, friendsInfo:myFriends, token, socket, setToken, setUserData}}>
                        <LeftSection 
                            formatToTodayIfCurrentDate={formatToTodayIfCurrentDate}
                            channels={channels} 
                            handleLogout={handleLogout} 
                            currentUserData={userData}
                            friendReqs={friendReqs} 
                            setIsFriendsOpen={setIsFriendsOpen}
                        />
                    </LeftSectionContext.Provider>
                    <Routes>
                        <Route index element={
                            <HomeSectionContext.Provider value={{
                                token,
                                currUserId:userData._id,
                                socket,
                                handleNewFriendChannel, 
                                setFriendReqs, 
                                setSentReqs,
                                handleFriendChannelDelete,
                                setIsFriendsOpen
                            }}>
                            <HomeSection
                                friendReqs={friendReqs} 
                                friendChannels={friendChannels}  
                                isFriendsOpen={isFriendsOpen}/>
                            </HomeSectionContext.Provider>}
                            />
                            <Route path="channels/:channelNumber"
                            element={
                            <ChannelSectionContext.Provider value={{friends:myFriends, setChannels, handleFriendChannelDelete}}>
                                <ChannelSection
                                friendReqs={friendReqs}
                                sentReqs={sentReqs}
                                setFriendReqs={setFriendReqs}
                                setSentReqs={setSentReqs} 
                                handleNewFriendChannel={handleNewFriendChannel}
                                fIdAndChannelInfos={fIdAndChannelInfos}
                                socket={socket}
                                currentUserData={userData}
                                token={token}/>
                            </ChannelSectionContext.Provider>
                            }/>
                    </Routes>
                </main>
                :
            <main className='homepage'>
                <section className='left-home-section'></section>
                <section className='home-section-container'></section>
            </main>
            }
        </>
    )   
}

export default HomePage