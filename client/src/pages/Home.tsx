import React, {useState, useEffect, useMemo, useCallback, useReducer} from 'react'
import {Routes, Route, useNavigate, useLocation, Navigate} from 'react-router-dom'
import {io, Socket} from 'socket.io-client'
import {jwtDecode} from 'jwt-decode'
import useSWR, {useSWRConfig} from "swr"
import LeftSection from '../components/LeftSection'
import ChannelSection from '../components/ChannelSection'
import {User, Channel, 
        Friend, UserDataStatus, 
        FriendDetails, ChannelDataStatus, 
        ChannelMemberUpdate, LastMessageUpdate,
        ChannelMessagesStatus, UserStatusUpdate, FriendReq, SentReq, FriendRequestAccepted, NoticeModalSettings,
        FIdChannelInfo,
        ChannelAction,
        ActionType,
        MemberUpdateInfo} 
        from '../types/generalTypes'
import HomeSection from '../components/HomeSection'
import {  getCurrUserFetcher } from '../services/apiService'
import axios from 'axios'
import NoticeModal from '../components/modals/Notice'
import { ChannelSectionContext, HomeSectionContext, LeftSectionContext } from '../context'


function sortChannels(channels:Channel[]):Channel[]{
    return channels.sort((a, b) => {
        const dateA = new Date(a.lastMessage).getTime() 
        const dateB = new Date(b.lastMessage).getTime() 
        return dateB - dateA; 
    })
}

function channelReducer(state:Channel[] | [], action:ChannelAction){
    switch (action.type){
        case ActionType.InitialFetch:
            return action.payload
        case ActionType.Seen: {
            const channels = [...state].map(channel => {
                if (channel._id === action.payload.channelId && !channel.seen.includes(action.payload.currUserId)) {
                    // Create a new object for the changed channel
                    const currChannel = {...channel}
                    currChannel.seen.push(action.payload.currUserId)
                    return currChannel
                }
                return channel; // Return the original channel object if no change is needed
            });
            return channels;
        }
        case ActionType.NewChannel:{
            const updateChannels = [...state]
            updateChannels.unshift(action.payload.data)
            return updateChannels
        }
        case ActionType.DeleteChannel:{
            const updateChannels = [...state]
            return updateChannels.filter(channel=>channel._id!==action.payload.channelId)
        }
        case ActionType.NewMessage:{
            const {channelNumber, channelId, seen, newTime, newFormattedTime} = action.payload.newMessageInfo
            const currChannels = [...state].map(channel=>{
                if(channel._id ===channelId){
                    const currChannel = {...channel}
                    if(action.payload.location === `/@me/channels/${channelNumber}`){
                        currChannel.seen.push(action.payload.currUserId.toString())
                    }else{
                        currChannel.seen = [...seen]
                    }
                    currChannel.lastMessage = newTime
                    if(newFormattedTime){
                        currChannel.formattedLastMessage = newFormattedTime
                    }
                    return {...currChannel}
                }
                return channel
            })
            return sortChannels(currChannels)
        }
        case ActionType.NewMember:{
            const updateChannels = [...state]
            const currChannel = updateChannels.find(channel=>channel.channelNumber===action.payload.channelNumber)
            if(currChannel){
                currChannel.lastMessage = action.payload.newTime
            }
            return sortChannels(updateChannels)
        }
        default:
            return state
    }   
}

const HomePage:React.FC = () => {
        //Get token from local storage
        const [token, setToken] = useState(localStorage.getItem('token'))
        //We use this to navigate from pages to pages
        const navigate = useNavigate()
        //This is where we saved the fetched current logged in user's data
        const [userData, setUserData] = useState<User>()
        //The logged in users channels
        //if we left the initial value of the state to be blank ()
        //the type would be Channel[] | undefined
        const [socket, setSocket] = useState<Socket>()
        const [friendChannels, setFriendChannels] = useState<Friend[]>([])
        const [friendReqs, setFriendReqs] = useState<FriendReq[]>([])
        const [sentReqs, setSentReqs] = useState<SentReq[]>([])
        const [isFriendsOpen, setIsFriendsOpen] = useState<boolean>(false)
        //Modal
        const [noticeModal, setNoticeModal] = useState<NoticeModalSettings>
        ({isOpen:false, channelId:'', type:''})
        const [modalVisible, setModalVisible] = useState(false)
        //connection
        const [isOnline, setIsOnline] = useState(true)
        //Message Limit
        const [messageLimit, setMessageLimit] = useState<number>(0)
        
        const {mutate} = useSWRConfig()

        const [channels, channelsDispatch] = useReducer<React.Reducer<Channel[], ChannelAction>>(channelReducer, [])

        const location = useLocation()

        const userCacheKey = 'api/v1/users/me'

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
        const channelIds:string[] = useMemo(()=>{
            return [...channels].map(channel => channel._id)
        }, [channels])

        const channelNumberAndIds:{channelNumber:number, channelId:string}[] = useMemo(()=>{
            return [...channels].map(channel => {
                return {channelNumber:channel.channelNumber, channelId:channel._id}
            })
        }, [channels])

    
        useEffect(() => {
            //we need to determine if the webpage is fully visible before connecting to the socket since,
            //webpages have preloading feature on where they detect what you type in url or hover in the link
            //it will preload certain resources.
            if (token && isOnline) {
                const url = import.meta.env.MODE==='production'? import.meta.env.VITE_API_URL_PROD : import.meta.env.VITE_API_URL_DEV
                const socketConn = io(url, { query: { token } });
                setSocket(socketConn);
                return ()=>{
                    socketConn.disconnect()
                }
            }     
        }, [token, isOnline])


        useEffect(() => {
            const handleOnline = () => {
              setIsOnline(true);
            };
        
            const handleOffline = () => {
              setIsOnline(false);
            };
        
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);
        
            return () => {
              window.removeEventListener('online', handleOnline);
              window.removeEventListener('offline', handleOffline);
            };
          }, [])

        const { data:currUserData, error:currUserDataError} = useSWR<UserDataStatus>(
            token ? userCacheKey : null,  // Fetch data only if token is present
            token ? (endpoint) => getCurrUserFetcher(endpoint, token) : null,
            {
                revalidateOnFocus: false,
                revalidateOnReconnect: true
            }
          )
        useEffect(()=>{
            if(currUserData){
                //Save the logged in user's data to a state
                setIsOnline(true)
                setUserData(currUserData.user)
                const groupChannels:Channel[] = [...currUserData.user.groups??[]]
                const friendReqData:FriendReq[] = currUserData.user?.friends?.filter(friend=>friend.status === 'Pending')??[]
                setFriendReqs(friendReqData)
                const sentReqData:SentReq[] = currUserData.user?.friends?.filter(friend=>friend.status === 'Sent')??[]
                setSentReqs(sentReqData)
                const friendChannels:Friend[] = currUserData.user?.friends?.filter(friend => friend.status === 'Friend')??[]
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
                        formattedLastMessage: friend.channel.formattedLastMessage,
                        seen: friend.channel.seen
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
                channelsDispatch({type:ActionType.InitialFetch, payload: sortedChannels})
            }
        }, [currUserData])

        useEffect(()=>{
            if(currUserDataError){
                if(axios.isAxiosError(currUserDataError)){
                    if(currUserDataError.response?.status === 401 || currUserDataError.response?.status === 404){
                        localStorage.removeItem('token')
                        setToken('')
                        navigate('/login')
                    }
                    setIsOnline(false)
                }else{
                    setIsOnline(false)
                }
            }
        }, [currUserDataError] )

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
                formattedLastMessage: friendInfo.channel.formattedLastMessage,
                seen: friendInfo.channel.seen
            }
            channelsDispatch({type:ActionType.NewChannel, payload:{data:convertChannel}})
            setFriendChannels(prevFriendChannels=>{
                return [...prevFriendChannels, friendInfo]
            })
        }, [])
        
        //When we remove a friend from a friend list, or someone did remove us.
        const handleFriendChannelDelete = useCallback((channelId:string):void=>{
            setFriendChannels(prevFriendChannels=>{
                return [...prevFriendChannels].filter(friendChannels => friendChannels.channel._id!==channelId)
            })
            channelsDispatch({type:ActionType.DeleteChannel, payload:{channelId:channelId}})
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
                    setToken('')
                    localStorage.removeItem('token')
                    navigate('/login')
                }
            }
        }, [token, navigate]);

        //LIVE UPDATES
        useEffect(()=>{
            if(socket && userData){
                socket.emit('personal_live_update')
                return ()=>{
                    socket.emit('leave_personal_live_update')
                }
            }
        }, [userData, socket])

        useEffect(()=>{
            if(channels&&socket){
                socket.emit('channel_live_updates', channelIds)
                return ()=>{
                    socket.emit('leave_channel_live_updates', channelIds)
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
            if(socket && userData){
                const handleLastMsgUpdate = (data:LastMessageUpdate):void=>{
                    channelsDispatch({type:ActionType.NewMessage, payload:{location:location.pathname,
                    newMessageInfo:data, currUserId:userData._id}})
                    if(location.pathname !== `/@me/channels/${data.channelNumber}`){
                        mutate(`api/v1/channels/${data.channelNumber}`, (currChannelCachedData: ChannelDataStatus | undefined)=>{
                            if(!currChannelCachedData){
                                return 
                            }
                            const updateChannel = {...currChannelCachedData.channel}
                            updateChannel.seen = data.seen
                            return {status:currChannelCachedData.status, channel:updateChannel}
                        }, false)
                        mutate(`api/v1/channels/${data.channelNumber}/messages`, (prevMessagesDataCache:ChannelMessagesStatus|undefined)=>{
                            if(!prevMessagesDataCache){
                                return 
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
        }, [socket, location, userData])

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
                    })
                    if(data.type==='Joined'){
                        //update the channels when someone joined the channel
                        channelsDispatch({type:ActionType.NewMember, payload:{channelNumber:data.channelNumber, newTime:data.newTime}})
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
                    channelsDispatch({type:ActionType.NewChannel, payload:{data:newGroupChannel}})
                }
                socket.on('invited_to_group', groupChannelInvite)
                const cleanup = ():void=>{
                    socket.removeListener('invited_to_group', groupChannelInvite)
                }
                return cleanup
            }
        }, [socket])


        useEffect(()=>{
            if(socket){
                const handleChannelMemberInfoUpdate = (data:MemberUpdateInfo) =>{
                    mutate(`api/v1/channels/${data.channelNumber}`, (ChannelCachedData: ChannelDataStatus | undefined)=>{
                        if(!ChannelCachedData){
                            return
                        }
                        const currentChannel = {...ChannelCachedData.channel}
                        const updateMembers = currentChannel.members.map(member=>{
                            if(member._id!==data.updatedUser._id){
                                return member
                            }else{
                                return  {...member, ...data.updatedUser}
                            }
                        })
                        currentChannel.members = updateMembers
                        return {status:ChannelCachedData.status, channel: currentChannel}
                    })
                }
                socket.on("channel-member-update", handleChannelMemberInfoUpdate)
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
                    channelsDispatch({type:ActionType.NewChannel, payload:{data:data}})
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
                channelsDispatch({type:ActionType.DeleteChannel, payload:{channelId:noticeModal.channelId}})
                setNoticeModal({isOpen:false, channelId:'', type:''})
            }else if(noticeModal.type==='Friend'){
                channelsDispatch({type:ActionType.DeleteChannel, payload:{channelId:noticeModal.channelId}})
                setFriendChannels(prevFriendChannels=> [...prevFriendChannels]
                    .filter(channel=>channel.channel._id!==noticeModal.channelId))
                setNoticeModal({isOpen:false, channelId:'', type:''})
            }
        }

        //This executes when the group leader of a group channel deleted the group channel
        useEffect(()=>{
            if(socket){
                const handleGroupDeletion = (data:{channelNumber:number, channelId:string}):void=>{
                    if(location.pathname === `/@me/channels/${data.channelNumber}`){
                        navigate('/@me')
                        setNoticeModal({isOpen:true, channelId:data.channelId, type:'Group'})
                    }else{
                        channelsDispatch({type:ActionType.DeleteChannel, payload:{channelId:data.channelId}})
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
                        channelsDispatch({type:ActionType.DeleteChannel, payload:{channelId:data.channelId}})
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
                    })
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

        useEffect(()=>{
            let timer:ReturnType<typeof setTimeout>
            timer = setTimeout(()=>{
                setMessageLimit(0)
            }, 10000)
            return ()=>{
                clearTimeout(timer)
            }
        }, [messageLimit])

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
                    <LeftSectionContext.Provider value={{
                        modalVisible,
                        setModalVisible,
                        channelsDispatch, 
                        friendsInfo:myFriends, 
                        token, 
                        socket, 
                        setToken, 
                        channelNumberAndIds,
                        setUserData}}>
                        <LeftSection 
                            formatToTodayIfCurrentDate={formatToTodayIfCurrentDate}
                            channels={channels} 
                            handleLogout={handleLogout} 
                            currentUserData={userData}
                            friendReqs={friendReqs} 
                            setIsFriendsOpen={setIsFriendsOpen}
                            isOnline={isOnline}
                        />
                    </LeftSectionContext.Provider>
                    <Routes>
                        <Route index element={
                            <HomeSectionContext.Provider value={{
                                modalVisible,
                                setModalVisible,
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
                            <ChannelSectionContext.Provider 
                            value={{
                            modalVisible,
                            setModalVisible,
                            friends:myFriends, 
                            channelsDispatch, 
                            handleFriendChannelDelete}}>
                                <ChannelSection
                                setMessageLimit={setMessageLimit}
                                messageLimit={messageLimit}
                                friendReqs={friendReqs}
                                sentReqs={sentReqs}
                                setFriendReqs={setFriendReqs}
                                setSentReqs={setSentReqs} 
                                handleNewFriendChannel={handleNewFriendChannel}
                                fIdAndChannelInfos={fIdAndChannelInfos}
                                socket={socket}
                                currentUserData={userData}
                                formatToTodayIfCurrentDate={formatToTodayIfCurrentDate}
                                token={token}/>
                            </ChannelSectionContext.Provider>
                            }/>
                        <Route path="*" element={<Navigate replace to="/@me"/>} />
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