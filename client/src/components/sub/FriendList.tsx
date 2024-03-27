import { FriendListProps, UnfriendModalSettings } from "../../types/generalTypes";
import { Link } from "react-router-dom";
import React, { useState, useMemo, useRef} from "react";
import Unfriend from "../modals/Unfriend";
import { useEffect } from "react";
import { useHomeCustomContext } from "../../context";

const FriendList:React.FC<FriendListProps>=({friends, setIsFriendConnection})=>{
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [popUp, setPopUp] = useState<string>('')
    const [popUpActive, setPopUpActive] = useState(false)
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 , clickX:0, clickY:0})
    const [isModalDisabled, setIsModalDisabled] = useState(false)
    const [modalSettings, setModalSettings] = useState<UnfriendModalSettings>({isOpen:false, ids:{channelId:'', friendId:''}, displayName:'', channelNumber:undefined})
    const {setIsFriendsOpen, socket, token, handleFriendChannelDelete, setModalVisible} = useHomeCustomContext()

    const handleCloseButton = (e:React.MouseEvent<HTMLButtonElement>):void=>{
        e.preventDefault()
        setModalVisible(false)
        setTimeout(()=>{
            setModalSettings({isOpen:false, ids:{channelId:'', friendId:''}, displayName:'', channelNumber:undefined})
        }, 150)    
    }

    const handleBackToHome = (e:React.MouseEvent<HTMLButtonElement>):void=>{
        e.preventDefault()
        setIsFriendsOpen(false)
    }

    const filteredFriends = useMemo(()=>{
        return [...friends].filter(friend=>friend.friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [searchQuery, friends])

    const friendListRef = useRef<HTMLUListElement>(null)

    const handlePopUpClick = (e:React.MouseEvent<HTMLButtonElement>, friendId:string)=>{
        e.preventDefault()
        setPopUpActive(false)
        const container = friendListRef.current
        if(container){
            if(`user-${friendId}-popup`===popUp){
                setPopUp('')
            }else{
                const clickX = e.nativeEvent.offsetX
                const clickY = e.pageY>container.clientHeight?e.nativeEvent.offsetY - 50:e.nativeEvent.offsetY + 15
                setPopUp(`user-${friendId}-popup`)
                setTimeout(() => {
                    // This delay allows the popup to render before the animation class is added
                    setPopUpActive(true);
                  }, 10)
                setPopupPosition({x:e.clientX, y:e.clientY, clickX, clickY})
            }
        }
    }

    const handleOpenModal = (e:React.MouseEvent<HTMLButtonElement>, displayName:string, channelId:string, friendId:string, channelNumber:number)=>{
        e.preventDefault()
        setPopUp('')
        setModalSettings({isOpen:true, ids:{channelId, friendId}, displayName, channelNumber})
    }

    const openFriendConnection = ((e:React.MouseEvent<HTMLButtonElement>):void=>{
        e.preventDefault()
        setIsFriendConnection(true)
    })

    const handleModalWindowClick = (e:React.MouseEvent<HTMLDialogElement>):void =>{
        if (e.target === e.currentTarget) {
            if(!isModalDisabled){
                setModalVisible(false)
                setModalSettings({isOpen:false, ids:{channelId:'', friendId:''}, displayName:'', channelNumber:undefined})
            }
        }
    }


    useEffect(() => {
        // Only add the event listener if a popup is open
        if (popUp) {
            const handleOutsideClick = (event:MouseEvent) => {
                // Assuming each popup has a unique ID or class you can target
                const popupElement = document.querySelector('.friend-more-pop-up-container') as HTMLElement;
                //event.target represents the DOM element that was directly under the mouse cursor at the time 
                //the mousedown event was triggered. It's the element that initially received the event.
                //closest is used to find the nearest ancestor of the current element (or the current element itself)
                //that matches a given select it looks up through the DOM tree from event.target and checks if event.target or any 
                //of its ancestors match the .friend-more-button selector 
                // If a match is found, closest returns that element. Otherwise, it returns null
                const buttonClicked = (event.target as HTMLElement).closest('.friend-more-button');
                const containerButtonClicked = (event.target as HTMLElement).closest('.friend-info-container-button')
                // If click is outside the popup and not on the button, close the popup
                //contains: Starts with the current element and checks downward among 
                //its descendants to see if it contains a specific element.
                if (popupElement && !popupElement.contains(event.target as Node) && !buttonClicked && !containerButtonClicked) {
                    setPopUp('');
                }
            };
            // Add event listener to the document
            document.addEventListener('mousedown', handleOutsideClick);
            // Cleanup function to remove the event listener
            return () => {
                document.removeEventListener('mousedown', handleOutsideClick);
            };
        }
    }, [popUp]); // Re-run effect if `popUp` changes

    return(
        <section className="friend-list-container">
            {modalSettings.isOpen&&
            <dialog className="modal-window-container" onClick={handleModalWindowClick}>
                <Unfriend 
                {...modalSettings.ids}
                displayName={modalSettings.displayName}
                channelNumber={modalSettings.channelNumber}
                handleCloseButton={handleCloseButton}
                socket={socket} handleFriendChannelDelete={handleFriendChannelDelete} 
                token={token}
                setModalSettings={setModalSettings}
                setIsModalDisabled={setIsModalDisabled}
                />
            </dialog>}
            <div className="friend-list-top-section">
                <div className="friend-list-mob-top-section-container">
                    <button className="friend-list-to-home-button" onClick={handleBackToHome}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b9b9b9 " 
                            strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-left">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>
                    <h2 className="friends-header">Friends</h2>
                    <button className="friend-list-to-more-button friend-list-mob-button" onClick={openFriendConnection}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#b9b9b9 " 
                        strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="feather feather-plus">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                </div>

                <h2 className="friends-header">Friends</h2>
                <input className="friend-list-search-input" placeholder="Search friends..."
                onChange={(e)=>setSearchQuery(e.target.value)} value={searchQuery}/>
            </div>
            <ul className="friend-list" ref={friendListRef}>
                {filteredFriends.map(friend=>(
                    <li key={friend.channel.channelNumber} className="friend-link-container friend-container">
                        <Link className='friend-link' to={`channels/${friend.channel.channelNumber}`}>
                            <div className="friend-information">
                                <div className="friend-photo-status-container">
                                    <img className='friend-photo' 
                                    src={`${friend.friend.photo==='default.jpeg'?'/img/default.jpeg':friend.friend.photoUrl}`}/>
                                    <div className='friend-status'
                                    style={{backgroundColor:friend.friend.status==='Online'?'green':'#959595'}}></div>
                                </div>
                                <div className="user-displayName-status-container">
                                    <span className='friend-displayName'>{friend.friend.displayName}</span>
                                    {friend.friend.status==='Online'?
                                    <span className="friend-status-text">Online</span>
                                    :
                                    <span className="friend-status-text">Offline</span>}
                                </div>
                            </div>
                        </Link>
                        <button className="friend-info-container-button" onClick={(e)=>handlePopUpClick(e, friend.friend._id)}>
                            <div className="friend-information">
                                <div className="friend-photo-status-container">
                                    <img className='friend-photo' 
                                    src={`${friend.friend.photo==='default.jpeg'?'/img/default.jpeg':friend.friend.photoUrl}`}/>
                                    <div className='friend-status'
                                    style={{backgroundColor:friend.friend.status==='Online'?'green':'#959595'}}></div>
                                </div>
                                <div className="user-displayName-status-container">
                                    <span className='friend-displayName'>{friend.friend.displayName}</span>
                                    {friend.friend.status==='Online'?
                                    <span className="friend-status-text">Online</span>
                                    :
                                    <span className="friend-status-text">Offline</span>}
                                </div>
                            </div>
                            <div className="friend-more-img">
                                <div className="friend-more-img-container">
                                    <img src="/img/friend-more.svg"/>
                                </div>
                            </div>
                        </button>
                        <button className="friend-more-button" onClick={(e)=>handlePopUpClick(e, friend.friend._id)}>
                            <div className="friend-more-img-container">
                                <img src="/img/friend-more.svg"/>
                            </div>
                        </button>
                        {popUp===`user-${friend.friend._id}-popup`
                        &&
                        <div className={`friend-more-pop-up-container ${popUpActive?"pop-up-active":""}`}
                        style={{right:`${-popupPosition.clickX+40}px`, top:`${popupPosition.y+popupPosition.clickY+5}px`,
                        transform: `translateY(${-popupPosition.y}px)`}}>
                            <Link to={`channels/${friend.channel.channelNumber}`} className="friend-pop-up-link">
                                Send Message
                            </Link>
                            <button className="remove-friend-button" 
                            onClick={(e)=>handleOpenModal(e, friend.friend.displayName, friend.channel._id,
                             friend.friend._id, friend.channel.channelNumber)}>
                                Remove Friend
                            </button>
                        </div>
                        }
                </li>
                ))}
            </ul>
        </section>
    )
}

export default FriendList