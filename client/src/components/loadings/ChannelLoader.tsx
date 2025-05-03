import React, { SetStateAction, useEffect } from 'react';
import MessageLoader from './MessageLoader';
import MemberListLoader from './MemberListLoader';

const ChannelLoader: React.FC<{
    isChannelVisible: boolean;
    setIsChannelVisible: React.Dispatch<SetStateAction<boolean>>;
}> = ({ isChannelVisible, setIsChannelVisible }) => {
    useEffect(() => {
        setIsChannelVisible(true);
    }, [setIsChannelVisible]);

    return (
        <div
            className={`channel-section ${isChannelVisible ? 'channel-section-fallback-mob' : ''}`}
            style={{ zIndex: '500' }}
        >
            <div className="channel-container">
                <nav className="channel-nav"></nav>
                <div className="message-section">
                    <div className="message-box">
                        <MessageLoader />
                    </div>
                    <div className="message-input-container">
                        <div className="message-input-load"></div>
                    </div>
                </div>
                <div className="channel-members-section">
                    <MemberListLoader />
                </div>
            </div>
        </div>
    );
};

export default ChannelLoader;
