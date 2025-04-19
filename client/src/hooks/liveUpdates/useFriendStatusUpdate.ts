import { Socket } from 'socket.io-client';
import { UserStatusUpdate } from '../../types/userTypes';
import { useEffect } from 'react';
import { Friend } from '../../types/friendTypes';
import safeMutate from '../../utils/safeMutate';
import { memberStatusUpdate } from '../../utils/updaters/channelUpdater';

const useFriendStatusUpdate = (
    socket: Socket | undefined,
    friendChannelIds: string[],
    setFriendChannels: React.Dispatch<React.SetStateAction<Friend[]>>
) => {
    //When a friend or a member of the group you're part of went online
    useEffect(() => {
        if (socket) {
            const handleUserOnlineStatus = (data: UserStatusUpdate): void => {
                safeMutate(
                    `api/v1/channels/${data.channelNumber}`,
                    memberStatusUpdate(data.userId, 'Online')
                );
                // Check if the user who went online is also your friend based on the friend channel id
                if (data.type === 'Friend') {
                    const friendChannelId = friendChannelIds.find(
                        (friendChannelId) => friendChannelId === data.channelId
                    );
                    if (friendChannelId) {
                        setFriendChannels((prevFriendChannels) => {
                            const updateFriendChannel = [...prevFriendChannels];
                            const friendIndex = updateFriendChannel.findIndex(
                                (friendchannel) => friendchannel.channel._id === friendChannelId
                            );
                            updateFriendChannel[friendIndex].friend.status = 'Online';
                            return updateFriendChannel;
                        });
                    }
                }
            };
            socket.on('user_status_update_online', handleUserOnlineStatus);
            const cleanup = (): void => {
                socket.removeListener('user_status_update_online', handleUserOnlineStatus);
            };
            return cleanup;
        }
    }, [socket, friendChannelIds, setFriendChannels]);

    //When a friend or a member of the group you're part of went offline
    useEffect(() => {
        if (socket) {
            const handleUserOfflineStatus = (data: UserStatusUpdate): void => {
                safeMutate(
                    `api/v1/channels/${data.channelNumber}`,
                    memberStatusUpdate(data.userId, 'Offline')
                );
                if (data.type === 'Friend') {
                    const friendChannelId = friendChannelIds.find(
                        (friendChannelId) => friendChannelId === data.channelId
                    );
                    if (friendChannelId) {
                        setFriendChannels((prevFriendChannels) => {
                            const updateFriendChannel = [...prevFriendChannels];
                            const friendIndex = updateFriendChannel.findIndex(
                                (friendchannel) => friendchannel.channel._id === friendChannelId
                            );
                            updateFriendChannel[friendIndex].friend.status = 'Offline';
                            return updateFriendChannel;
                        });
                    }
                }
            };
            socket.on('user_status_update_offline', handleUserOfflineStatus);
            const cleanup = (): void => {
                socket.removeListener('user_status_update_offline', handleUserOfflineStatus);
            };
            return cleanup;
        }
    }, [socket, friendChannelIds, setFriendChannels]);
};

export default useFriendStatusUpdate;
