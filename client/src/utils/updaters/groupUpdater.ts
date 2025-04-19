import { CurrentChannel } from '../../types/channelTypes';

export const groupLeaderUpdate = (memberId: string) => {
    return (cachedChannelData: undefined | CurrentChannel) => {
        if (!cachedChannelData) {
            return;
        }
        const updateChannel = { ...cachedChannelData };
        updateChannel.groupLeader = memberId;
        return updateChannel;
    };
};
