import React, {useState, useEffect, useCallback, useReducer} from 'react'
import {Routes, Route, useNavigate, useLocation, Navigate} from 'react-router-dom'
import {io, Socket} from 'socket.io-client'
import useSWR, {useSWRConfig} from "swr"
import LeftSection from '../components/LeftSection'
import ChannelSection from '../components/ChannelSection'
import { User, UserDataStatus } from '../types/userTypes'
import { 
    Friend,
    FriendReq, SentReq} from '../types/friendTypes'
import { 
    Channel, 
    LastMessageUpdate, 
    ChannelMessagesStatus, ChannelAction, 
    ActionType, 
    CurrentChannel} from '../types/channelTypes'
import { NoticeModalSettings } from '../types/modalTypes'
import HomeSection from '../components/HomeSection'
import { getCurrUserFetcher } from '../api/currentUser'
import axios from 'axios'
import NoticeModal from '../components/modals/Notice'
import { ChannelSectionContext, HomeSectionContext, LeftSectionContext } from '../context'
import LoadingScreen from '../components/loadings/LoadingScreen'
import useFriendInfo from '../hooks/useFriendInfo'
import useChannelInfo from '../hooks/useChannelInfo'
import channelReducer from '../utils/channelReducer'
import useFriendStatusUpdate from '../hooks/liveUpdates/useFriendStatusUpdate'
import useChannelUpdate from '../hooks/liveUpdates/useChannelUpdate'
import useFriendUpdate from '../hooks/liveUpdates/useFriendUpdate'
import useGroupUpdate from '../hooks/liveUpdates/useGroupUpdate'


const HomePage:React.FC = () => {
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

        //Custom hooks
        const {friendChannelIds, myFriends, fIdAndChannelInfos} = useFriendInfo(friendChannels)
        const {channelIds, channelNumberAndIds} = useChannelInfo(channels)
        //Live updates
        useChannelUpdate(socket, channelsDispatch)
        useFriendStatusUpdate(socket, friendChannelIds, setFriendChannels)
        useGroupUpdate(socket, channelsDispatch, setNoticeModal)


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

        useFriendUpdate(socket, sentReqs, 
            setSentReqs, handleNewFriendChannel, 
            setFriendReqs, channelsDispatch, 
            setFriendChannels, setNoticeModal)


        useEffect(() => {
            const url = import.meta.env.MODE==='production'? import.meta.env.VITE_API_URL_PROD:import.meta.env.VITE_API_URL_DEV
            const socketConn = io(url, {withCredentials: true});
            setSocket(socketConn);
            return ()=>{
                socketConn.disconnect()
            }  
        }, [])


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

        const { data:currUserData, error:currUserDataError, isLoading:currUserDataLoading} = useSWR<UserDataStatus>(
            userCacheKey,
            (endpoint) => getCurrUserFetcher(endpoint),
            {
                revalidateOnFocus: false,
                revalidateOnReconnect: true
            }
          )
        useEffect(()=>{
            if(currUserData){
                //Save the logged in user's data to a state
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
                        navigate('/login')
                    }
                }
                setIsOnline(false)
            }
        }, [currUserDataError, navigate])
        
        //When we remove a friend from a friend list, or someone did remove us.
        const handleFriendChannelDelete = useCallback((channelId:string):void=>{
            setFriendChannels(prevFriendChannels=>{
                return [...prevFriendChannels].filter(friendChannels => friendChannels.channel._id!==channelId)
            })
            channelsDispatch({type:ActionType.DeleteChannel, payload:{channelId:channelId}})
        }, [])

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
        }, [channels, socket, channelIds])


        //If someone sends a message on a channel, this updates the order of the channel list
        useEffect(()=>{
            if(socket && userData){
                const handleLastMsgUpdate = (data:LastMessageUpdate):void=>{
                    channelsDispatch({type:ActionType.NewMessage, payload:{location:location.pathname,
                    newMessageInfo:data, currUserId:userData._id}})
                    if(location.pathname !== `/@me/channels/${data.channelNumber}`){
                        mutate(`api/v1/channels/${data.channelNumber}`, (currChannelCachedData: CurrentChannel | undefined)=>{
                            if(!currChannelCachedData){
                                return 
                            }
                            const updateChannel = {...currChannelCachedData}
                            updateChannel.seen = data.seen
                            return updateChannel
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
        }, [socket, location, userData, mutate])


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
            const timer = setTimeout(()=>{
                setMessageLimit(0)
            }, 10000)
            return ()=>{
                clearTimeout(timer)
            }
        }, [messageLimit])


        return(
        <>
            {
                currUserDataLoading?
                <LoadingScreen />
           :
           ( 
            userData?
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
                        socket, 
                        channelNumberAndIds,
                        setUserData}}>
                        <LeftSection 
                            formatToTodayIfCurrentDate={formatToTodayIfCurrentDate}
                            channels={channels} 
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
                                />
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
            )}
        </>
    )   
}

export default HomePage