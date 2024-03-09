import { NavLink, Link} from 'react-router-dom';
import {LeftSectionProps} from '../types/generalTypes';
import React, { useMemo, useState } from 'react';
import CreateGroupModal from './modals/CreateGroup';

const LeftSection:React.FC<LeftSectionProps>=({channels, handleLogout, setChannels,
    currentUserData, friendsInfo, token, socket, isMobile, friendReqs, setIsFriendsOpen})=>{
    const [searchQuery, setSearchQuery] = useState('')
    const [modal, setModal] = useState(false)
    const {displayName, friendTag, photo, _id} = currentUserData
    const [isDisabled, setIsDisabled] = useState(false)
    
    const handleModalWindowClick = (e:React.MouseEvent<HTMLDialogElement>):void =>{
        if (e.button===0 && e.target === e.currentTarget) {
            e.preventDefault()
            if(!isDisabled){
                setModal(false)
            }
        }
    }

    const handleOpenFriend= (e:React.MouseEvent<HTMLButtonElement>):void=>{
        e.preventDefault()
        setIsFriendsOpen(true)
    }

    const handleOpenCreateGroup = (e:React.MouseEvent<HTMLButtonElement>):void=>{
        e.preventDefault()
        setModal(true)
    }

    const filteredChannels = useMemo(()=>{
        return channels.filter(channel=>channel.channelName.toLowerCase().includes(searchQuery.toLocaleLowerCase()))
    }, [channels, searchQuery])

    const clearSearchQuery = ():void => {
        setSearchQuery('');
    }

    return(
    <section className='left-home-section'>
        {modal&&
        <dialog className='modal-window-container' onMouseDown={handleModalWindowClick} >
            <CreateGroupModal token={token} currUserId={_id} friendsInfo={friendsInfo} setIsDisabled={setIsDisabled}
             socket={socket} setModal={setModal}  setChannels={setChannels} isMobile={isMobile}/>
        </dialog>
        }
        <div className='upper-left-section-container'>
            <div className='logo-container'>
                <Link to={'/@me'}>
                    Home
                </Link>
            </div>
            <div className='create-group-container left-section-button-container-mob'>
                <div className='messages-text'>Messages</div>
                <button className='create-group-modal-button' onClick={handleOpenCreateGroup}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                    stroke="#b9b9b9 " strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" id='create-group-image'
                    className="create-group-image">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87">
                        </path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <div className='create-group-tooltip'>
                        <span className='create-group-tooltip-text'>
                            Create Group
                        </span>
                    </div>
                </button>
                <button className="open-friend-section-button" onClick={handleOpenFriend}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#b9b9b9" 
                    stroke="#b9b9b9" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="feather feather-user">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    {friendReqs.length>0&&
                    <div className="request-indicator">
                    </div>}
                </button>
            </div>
            <div className='search-conversation-container'>
                <img className='search-conversation-image'src='/img/search.svg' />
                <input 
                value={searchQuery}
                onChange={(e)=>setSearchQuery(e.target.value)}
                className='search-conversation-input'
                placeholder='Search conversation...'/>
            </div>
        </div>
        <div className='channel-list-container'>
            <ul className='channel-links'> 
                {filteredChannels.map(channel=>(
                    <li className='channel-link-container' key={channel.channelNumber}>
                        <NavLink className='channel-link' to={`channels/${channel.channelNumber}`} 
                        onClick={clearSearchQuery}>
                            <img className='channel-photo'src={`/img/${channel.photo}`} alt=''/>
                            <span className='channel-name'>{channel.channelName}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </div>
        <div className='user-info-container'>
            <div className='user-info'>
                <img className='user-info-photo' alt='' src={`/img/${photo}`}/>
                <div className='user-info-text'>
                    <span className='display-name-info'>{displayName}</span>
                    <span className='friend-tag-info'>#{friendTag}</span>
                </div>
            </div>
            <div>
                <button className='logout-button' onClick={handleLogout}>Log Out</button>
            </div>   
        </div>
    </section>
    )
}

export default LeftSection