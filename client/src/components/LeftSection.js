import { useState, useEffect } from 'react';
import { NavLink} from 'react-router-dom';
import '../styles/leftHome.css'

function LeftSection({channels, handleLogout, currentUserData}){
    const {displayName, friendTag, image} = currentUserData
    console.log(image, '-------')
    return(
    <section className='left-home-section'>
            <div className='channel-list-container'>
                <ul className='channel-links'> 
                    {channels.map(channel=>(
                        <li className='channel-link-container' key={channel.channelNumber}>
                            <NavLink className='channel-link' to={`channels/${channel.channelNumber}`}>
                                <img alt='' src={`../img/${channel.image}`} />
                                <span className='channel-name'>{channel.channelName}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>
            <div className='user-info-container'>
                <div className='user-info'>
                    <img className='user-info-img' alt='' src={`../img/${image}`}/>
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