import { useMemo } from 'react';
import { FIdChannelInfo, Friend, FriendDetails } from '../types/friendTypes';

const useFriendInfo = (friendChannels: Friend[]) => {
    const friendChannelIds = useMemo(() => {
        return [...friendChannels].map((friendChannel) => friendChannel.channel._id);
    }, [friendChannels]);

    const myFriends: FriendDetails[] = useMemo(() => {
        return [...friendChannels].map((friend) => friend.friend);
    }, [friendChannels]);

    const fIdAndChannelInfos: FIdChannelInfo[] = useMemo(() => {
        return [...friendChannels].map((friend) => {
            return {
                friendId: friend.friend._id,
                channelNumber: friend.channel.channelNumber,
                channelId: friend.channel._id,
            };
        });
    }, [friendChannels]);

    return {
        friendChannelIds,
        myFriends,
        fIdAndChannelInfos,
    };
};

export default useFriendInfo;
