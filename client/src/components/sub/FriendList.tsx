import { FriendListProps, UnfriendModalSettings } from "../../types/generalTypes";
import { Link } from "react-router-dom";
import { useState, useMemo} from "react";
import Unfriend from "../modals/Unfriend";
import { useEffect } from "react";

const FriendList:React.FC<FriendListProps>=({friends, token, handleFriendChannelDelete, socket})=>{
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [popUp, setPopUp] = useState<string>('')
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 , clickX:0, clickY:0})
    const [modalSettings, setModalSettings] = useState<UnfriendModalSettings>({isOpen:false, ids:{channelId:'', friendId:''}, displayName:'', channelNumber:undefined})

    const handleCloseButton = (e:React.MouseEvent<HTMLButtonElement>):void=>{
        e.preventDefault()
        setModalSettings({isOpen:false, ids:{channelId:'', friendId:''}, displayName:'', channelNumber:undefined})
    }

    const filteredFriends = useMemo(()=>{
        return [...friends].filter(friend=>friend.friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [searchQuery, friends])

    const handlePopUpClick = (e:React.MouseEvent<HTMLButtonElement>, friendId:string)=>{
        e.preventDefault()
        const clickX = e.nativeEvent.offsetX
        const clickY = e.nativeEvent.offsetY
        setPopUp(`user-${friendId}-popup`)
        setPopupPosition({x:e.clientX, y:e.clientY, clickX, clickY})
    }

    const handleOpenModal = (e:React.MouseEvent<HTMLButtonElement>, displayName:string, channelId:string, friendId:string, channelNumber:number)=>{
        e.preventDefault()
        setPopUp('')
        setModalSettings({isOpen:true, ids:{channelId, friendId}, displayName, channelNumber})
    }

    const handleModalWindowClick = (e:React.MouseEvent<HTMLDialogElement>):void =>{
        if (e.target === e.currentTarget) {
            e.preventDefault();
            setModalSettings({isOpen:false, ids:{channelId:'', friendId:''}, displayName:'', channelNumber:undefined})
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
                // If click is outside the popup and not on the button, close the popup
                //contains: Starts with the current element and checks downward among 
                //its descendants to see if it contains a specific element.
                if (popupElement && !popupElement.contains(event.target as Node) && !buttonClicked) {
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
                />
            </dialog>}
            <div className="friend-list-top-section">
                <h2 className="friends-header">Friends</h2>
                <input className="friend-list-search-input" placeholder="Search friends..."
                onChange={(e)=>setSearchQuery(e.target.value)} value={searchQuery}/>
            </div>
            <ul className="friend-list">
                {filteredFriends.map(friend=>(
                    <li key={friend.channel.channelNumber} className="friend-link-container">
                        <Link className='friend-link' to={`channels/${friend.channel.channelNumber}`}>
                            <div className="friend-information">
                                <div className="friend-photo-status-container">
                                    <img className='friend-photo' src={`/img/${friend.friend.photo}`}/>
                                    <div className='friend-status'
                                    style={{backgroundColor:friend.friend.status==='Online'?'green':'#959595'}}></div>
                                </div>
                                <div className="user-displayName-status-container">
                                    <span className='friend-displayName'>{friend.friend.displayName}</span>
                                    {friend.friend.status==='Online'?
                                    <span className="friend-status">Online</span>
                                    :
                                    <span className="friend-status">Offline</span>}
                                </div>
                            </div>
                        </Link>
                        <button className="friend-more-button" onClick={(e)=>handlePopUpClick(e, friend.friend._id)}>
                            <div className="friend-more-img-container">
                                <img src="/img/friend-more.svg"/>
                            </div>
                        </button>
                        {popUp===`user-${friend.friend._id}-popup`
                        &&
                        <div className="friend-more-pop-up-container" 
                        style={{left:`${popupPosition.x/1.70}px`, top:`${popupPosition.y+popupPosition.clickY+5}px`, 
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