import React from 'react';
import { ChannelMessage } from '../../types/channelTypes';

const MessageTemplate: React.FC<{
    message: ChannelMessage;
    index: number;
    currId: string;
    formattedDate: string;
}> = ({ message, index, currId, formattedDate }) => {
    return (
        <div
            className={
                message.sender._id === currId
                    ? 'my-message-info-container user-message-info-container'
                    : 'user-message-info-container'
            }
            key={index}
        >
            <img
                className="sender-photo"
                alt={message.sender.displayName + ' mini profile photo'}
                src={`${message.sender.photo === 'default.jpeg' ? '/img/default.jpeg' : message.sender.photoUrl}`}
            />
            <div className="message-info">
                <div className="message-date-displayname">
                    <span className="message-sender">{message.sender.displayName}</span>
                    <span className="message-date">{formattedDate}</span>
                </div>
                <div className="message-content-container">
                    {message.content.map((m, i) => (
                        <div key={i} className="message-content">
                            {m.split('\n').map((line, index) => (
                                <React.Fragment key={index}>
                                    {line}
                                    {index < line.length - 1 && <br />}
                                </React.Fragment>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MessageTemplate;
