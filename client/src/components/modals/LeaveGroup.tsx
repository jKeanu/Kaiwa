import axios, { AxiosResponse } from 'axios';
import { ActionType } from '../../types/channelTypes';
import { LeaveGroup } from '../../types/groupTypes';
import { leaveGroup } from '../../api/group';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useChannelCustomContext } from '../../context';

const LeaveGroupModal: React.FC<LeaveGroup> = ({
    channelId,
    handleCloseButton,
    socket,
    channelNumber,
    setModalDisabled,
}) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState({ isError: false, message: '' });

    const { setModalVisible, modalVisible, channelsDispatch } = useChannelCustomContext();

    const handleLeaveGroup = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();
        setIsLoading(true);
        setModalDisabled(true);
        try {
            const res: AxiosResponse<void> = await leaveGroup(channelId);
            if (res.status === 204) {
                navigate('/@me');
                setIsLoading(false);
                setModalDisabled(false);
                channelsDispatch({ type: ActionType.DeleteChannel, payload: { channelId } });
                if (socket) {
                    socket.emit('leave_group', { channelId, channelNumber });
                }
                setModalVisible(false);
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 400) {
                    let errMessages = err.response.data.message;
                    if (errMessages.split('. ').length > 1) {
                        errMessages = errMessages.split('. ')[1];
                        setErrorMsg({ isError: true, message: errMessages });
                    } else {
                        setErrorMsg({
                            isError: true,
                            message: 'An error occurred. Please try again later.',
                        });
                    }
                } else {
                    setErrorMsg({
                        isError: true,
                        message: 'An error occurred. Please try again later.',
                    });
                }
            } else {
                setErrorMsg({
                    isError: true,
                    message: 'An error occurred. Please try again later.',
                });
            }
            setIsLoading(false);
            setModalDisabled(false);
        }
    };

    useEffect(() => {
        setModalVisible(true);
    }, [setModalVisible]);

    return (
        <div
            className={`leave-group-modal-container s-modal channel-modal ${modalVisible ? 'visible' : ''}`}
        >
            <h2 className="modal-header">Leave Group</h2>
            <div className="modal-text">Are you sure you want to leave the group?</div>
            <div className="leave-group-buttons-container s-modal-button-container channel-modal-button-container">
                <button className="confirm-button" onClick={handleLeaveGroup} disabled={isLoading}>
                    {isLoading ? <div className="confirm-button-loading"></div> : 'Leave Group'}
                </button>
                <button className="cancel-button" onClick={handleCloseButton} disabled={isLoading}>
                    Cancel
                </button>
                {errorMsg.isError && <span className="s-modal-err">{errorMsg.message}</span>}
            </div>
        </div>
    );
};

export default LeaveGroupModal;
