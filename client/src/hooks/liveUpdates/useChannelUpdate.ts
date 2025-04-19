import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { MemberUpdateInfo } from '../../types/groupTypes';
import { ActionType, ChannelAction, ChannelMemberUpdate } from '../../types/channelTypes';
import safeMutate from '../../utils/safeMutate';
import { channelMemberInfoUpdate, channelMemberUpdate } from '../../utils/updaters/channelUpdater';

const useChannelLiveUpdate = (
    socket: Socket | undefined,
    channelsDispatch: React.Dispatch<ChannelAction>
) => {
    // When someone changed their profile or information (Display name or friend tag)
    useEffect(() => {
        if (socket) {
            const handleChannelMemberInfoUpdate = (data: MemberUpdateInfo) => {
                safeMutate(
                    `api/v1/channels/${data.channelNumber}`,
                    channelMemberInfoUpdate(data.updatedUser)
                );
            };
            socket.on('channel-member-update', handleChannelMemberInfoUpdate);
            return () => {
                socket.removeListener('channel-member-update', handleChannelMemberInfoUpdate);
            };
        }
    }, [socket]);

    //This updates when a member left or joined the channel that you are part of
    useEffect(() => {
        if (socket) {
            const handleChannelMemberUpdate = (data: ChannelMemberUpdate): void => {
                safeMutate(
                    `api/v1/channels/${data.channelNumber}`,
                    channelMemberUpdate(data.type, data.user)
                );
                if (data.type === 'Joined') {
                    //update the channels when someone joined the channel
                    channelsDispatch({
                        type: ActionType.NewMember,
                        payload: { channelNumber: data.channelNumber, newTime: data.newTime },
                    });
                }
            };
            socket.on(`channel_member_update`, handleChannelMemberUpdate);
            const cleanup = (): void => {
                socket.removeListener('channel_member_update', handleChannelMemberUpdate);
            };
            return cleanup;
        }
    }, [socket, channelsDispatch]);
};

export default useChannelLiveUpdate;
