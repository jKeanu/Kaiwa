import { NavLink, Link} from 'react-router-dom';
import {LeftSectionProps} from '../types/generalTypes';
import { useMemo, useState } from 'react';

const LeftSection:React.FC<LeftSectionProps>=({channels, handleLogout, currentUserData})=>{
    const [searchQuery, setSearchQuery] = useState('')
    const {displayName, friendTag, photo} = currentUserData
    const filteredChannels = useMemo(()=>{
        return channels.filter(channel=>channel.channelName.toLowerCase().includes(searchQuery.toLocaleLowerCase()))
    }, [channels, searchQuery])

    const clearSearchQuery = ():void => {
        setSearchQuery('');
    }
    return(
    <section className='left-home-section'>
        <div className='upper-left-section-container'>
            <div className='logo-container'>
                <Link to={'/@me'}>
                    Home
                </Link>
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
                        <NavLink className='channel-link' to={`channels/${channel.channelNumber}`} onClick={clearSearchQuery}>
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