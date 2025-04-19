import { useChannelCustomContext } from '../../context';
import { MessageLimit } from '../../types/modalTypes';
import { useEffect } from 'react';

const MessageLimitModal: React.FC<MessageLimit> = ({ handleCloseButton }) => {
    const { setModalVisible, modalVisible } = useChannelCustomContext();

    useEffect(() => {
        setModalVisible(true);
        return () => setModalVisible(false);
    }, [setModalVisible]);

    return (
        <div
            className={`message-limit-modal-container channel-modal ${modalVisible ? 'visible' : ''}`}
        >
            <h2 className="modal-header">Whoa there, speedy fingers!</h2>
            <div className="modal-text">Slow down on the messages, it&apos;s not a race!</div>
            <div className="message-limit-modal-button-container">
                <button className="confirm-button" onClick={handleCloseButton}>
                    Confirm
                </button>
            </div>
        </div>
    );
};

export default MessageLimitModal;
