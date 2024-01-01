import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/leftHome.css'

function LeftSection({channels, handleLogout}){
    return(
    <section className='left-home-section'>
            <div>
                <button onClick={handleLogout}>LogOut</button>
            </div>
            <div className='user-info-container'>
            </div>
            <div>
                <ul className='channel-links'> 
                    {channels.map(channel=>(
                        <li className='channel-link-container' key={channel.channelNumber}>
                            <NavLink className='channel-link' to={`${channel.channelNumber}`}>
                                {channel.channelName}
                                <img src="../img/buster.jpg"/>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>
    </section>
    )
}

export default LeftSection