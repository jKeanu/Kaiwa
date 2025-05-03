const MessageLoader: React.FC = () => {
    return (
        <div className="message-container-load">
            <div className="message-info-container-load">
                <div className="sender-photo-load"></div>
                <div className="message-info-load">
                    <div className="message-date-name-load"></div>
                    <div
                        className="message-content-load"
                        style={{ width: '22rem', height: '3rem' }}
                    ></div>
                </div>
            </div>
            <div className="message-info-container-load">
                <div className="sender-photo-load"></div>
                <div className="message-info-load">
                    <div className="message-date-name-load"></div>
                    <div
                        className="message-content-load"
                        style={{ width: '22rem', height: '4rem' }}
                    ></div>
                </div>
            </div>
            <div className="message-info-container-load my-message-info-container-load">
                <div className="sender-photo-load"></div>
                <div className="message-info-load">
                    <div className="message-date-name-load"></div>
                    <div
                        className="message-content-load"
                        style={{ width: '22rem', height: '2rem' }}
                    ></div>
                </div>
            </div>
            <div className="message-info-container-load">
                <div className="sender-photo-load"></div>
                <div className="message-info-load">
                    <div className="message-date-name-load"></div>
                    <div
                        className="message-content-load"
                        style={{ width: '15rem', height: '2rem' }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default MessageLoader;
