import { NavLink, Link} from 'react-router-dom';
import {LeftSectionProps} from '../types/generalTypes';

const LeftSection:React.FC<LeftSectionProps>=({channels, handleLogout, currentUserData})=>{
    const {displayName, friendTag, photo} = currentUserData
    return(
    <section className='left-home-section'>
            <div className='logo-container'>
                <Link to={'/'}>
                </Link>
            </div> 
            <div className='channel-list-container'>
                <ul className='channel-links'> 
                    {channels.map(channel=>(
                        <li className='channel-link-container' key={channel.channelNumber}>
                            <NavLink className='channel-link' to={`channels/${channel.channelNumber}`}>
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