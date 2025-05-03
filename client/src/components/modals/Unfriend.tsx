import { UnfriendProps } from '../../types/groupTypes';
import { AxiosResponse } from 'axios';
import { removeFriend } from '../../api/friend';
import { useEffect, useState } from 'react';
import { useHomeCustomContext } from '../../context';

const Unfriend: React.FC<UnfriendProps> = ({
    channelId,
    friendId,
    socket,
    handleFriendChannelDelete,
    handleCloseButton,
    displayName,
    setModalSettings,
    channelNumber,
    setIsModalDisabled,
}) => {
    const [errorMsg, setErrorMsg] = useState({ isError: false, message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const { modalVisible, setModalVisible } = useHomeCustomContext();

    const handleUnfriend = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();
        setIsLoading(true);
        setIsModalDisabled(true);
        try {
            const res: AxiosResponse<void> = await removeFriend(friendId);
            if (res.status === 204) {
                handleFriendChannelDelete(channelId);
                if (socket) {
                    socket.emit('remove_friend', { channelId, friendId, channelNumber });
                }
                setModalSettings({
                    isOpen: false,
                    ids: { channelId: '', friendId: '' },
                    displayName: '',
                    channelNumber: undefined,
                });
                setIsLoading(false);
                setIsModalDisabled(false);
                setModalVisible(false);
            }
        } catch (_err) {
            setIsLoading(false);
            setErrorMsg({
                isError: true,
                message: 'An unknown error occurred. Please try again later.',
            });
            setIsModalDisabled(false);
        }
    };

    useEffect(() => {
        setModalVisible(true);
    }, [setModalVisible]);
    return (
        <div className={`unfriend-modal-container s-modal ${modalVisible ? 'visible' : ''}`}>
            <div className="modal-header">Remove Friend</div>
            <div className="modal-text">Are you sure you want to unfriend {displayName}</div>
            <div className="unfriend-buttons-container s-modal-button-container">
                <button
                    className="confirm-button"
                    onClick={(e) => handleUnfriend(e)}
                    disabled={isLoading}
                >
                    {isLoading ? <div className="confirm-button-loading"></div> : 'Remove Friend'}
                </button>
                <button className="cancel-button" onClick={handleCloseButton} disabled={isLoading}>
                    Cancel
                </button>
                {errorMsg.isError && <span className="s-modal-err">{errorMsg.message}</span>}
            </div>
        </div>
    );
};

export default Unfriend;
