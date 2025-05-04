import React from 'react';
import MessageLoader from './MessageLoader';
import MemberListLoader from './MemberListLoader';

const ChannelLoader: React.FC = () => {
    return (
        <div className={`channel-section channel-section-load`}>
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
