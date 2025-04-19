import {
    ChannelMember,
    ChannelMessage,
    ChannelMessagesStatus,
    CurrentChannel,
} from '../../types/channelTypes';
import { MemberUpdateInfo } from '../../types/groupTypes';

// This is called when someone sent a message and you're not in the channel.
export const channelSeenUpdate = (seenData: string[]) => {
    return (currChannelCachedData: CurrentChannel | undefined) => {
        if (!currChannelCachedData) {
            return;
        }
        const updateChannel = { ...currChannelCachedData };
        updateChannel.seen = seenData;
        return updateChannel;
    };
};

// This is an updater for channel messages when you're not in the sent message's channel.
export const awayChannelMsgUpdate = (messageData: ChannelMessage) => {
    return (prevMessagesDataCache: ChannelMessagesStatus | undefined) => {
        if (!prevMessagesDataCache) {
            return;
        }
        const updateMessages = [...prevMessagesDataCache.messages];
        if (messageData.updated) {
            updateMessages[0] = messageData;
            return {
                status: prevMessagesDataCache.status,
                messages: updateMessages,
            };
        }
        return {
            status: prevMessagesDataCache.status,
            messages: [messageData, ...updateMessages],
        };
    };
};

// Channel message update if you're in the channel.
export const ChannelMsgUpdate = (messageData: ChannelMessage) => {
    return (currMsgCachedData: ChannelMessagesStatus | undefined) => {
        if (!currMsgCachedData) {
            return undefined;
        }
        //Clone the current data
        const updatedMessages = [...currMsgCachedData.messages];
        //Safely access messages, defaulting to an empty array if undefined
        if (messageData.updated) {
            //Update the last message or handle appropriately if the array is empty
            updatedMessages[0] = messageData;
            return { status: currMsgCachedData.status, messages: updatedMessages };
        } else {
            //Append new message
            updatedMessages.unshift(messageData);
            return { status: currMsgCachedData.status, messages: updatedMessages };
        }
        // Update the messages array in the channel data
    };
};

// This is when someone sent a message, and you're in the channel.
export const currChannelSeenUpdate = (currUserId: string) => {
    return (currChannelCachedData: CurrentChannel | undefined) => {
        if (!currChannelCachedData) {
            return undefined;
        }
        const updateChannelData = { ...currChannelCachedData };
        updateChannelData.seen.push(currUserId);
        return updateChannelData;
    };
};

export const sendChannelMsgUpdate = (newMessageData: ChannelMessage, inputMessage: string) => {
    return (currMsgCachedData: ChannelMessagesStatus | undefined) => {
        if (!currMsgCachedData) {
            return undefined;
        }
        const updatedMessages = [newMessageData, ...currMsgCachedData.messages];
        return {
            status: currMsgCachedData.status,
            messages: updatedMessages,
            notSentMessages: [inputMessage, ...(currMsgCachedData.notSentMessages || [])],
        };
    };
};

// This is used when you sent a message on the channel as a continuation for your previous message.
export const sendContChannelMsgUpdate = (timestamp: number, inputMessage: string) => {
    return (currMsgCachedData: ChannelMessagesStatus | undefined) => {
        if (!currMsgCachedData) {
            return undefined;
        }
        const updatedMessages = [...currMsgCachedData.messages];
        updatedMessages[0] = {
            ...updatedMessages[0],
            time: timestamp,
            content: [...updatedMessages[0].content, inputMessage],
        };
        return {
            status: currMsgCachedData.status,
            messages: updatedMessages,
            notSentMessages: [inputMessage, ...(currMsgCachedData.notSentMessages || [])],
        };
    };
};

// When the sent message was successful
export const sentMsgVerifyUpdate = (sentContent: string) => {
    return (currMsgCachedData: ChannelMessagesStatus | undefined) => {
        if (!currMsgCachedData) {
            return undefined;
        }
        return {
            status: currMsgCachedData.status,
            messages: currMsgCachedData.messages,
            notSentMessages: [
                ...(currMsgCachedData.notSentMessages || []).filter(
                    (message) => message !== sentContent
                ),
            ],
        };
    };
};

// This runs when a member of the channel updated their info such as display name, or friend tag
// when you're in the channel.
export const channelMemberInfoUpdate = (updatedUser: MemberUpdateInfo['updatedUser']) => {
    return (channelCachedData: CurrentChannel | undefined) => {
        if (!channelCachedData) {
            return;
        }
        const currentChannel = { ...channelCachedData };
        const updateMembers = currentChannel.members.map((member) => {
            if (member._id !== updatedUser._id) {
                return member;
            } else {
                return { ...member, ...updatedUser };
            }
        });
        currentChannel.members = updateMembers;
        return currentChannel;
    };
};

// This will run if a user either leaves or joined the group
export const channelMemberUpdate = (updateType: string, userMember: ChannelMember) => {
    return (channelDataCache: CurrentChannel | undefined) => {
        if (!channelDataCache) {
            return undefined;
        }
        if (updateType === 'Joined') {
            //Update the channels when someone joined the channel
            const updateChannelDataCache = { ...channelDataCache };
            updateChannelDataCache.members = [...updateChannelDataCache.members, userMember];
            return updateChannelDataCache;
        } else if (updateType === 'Left') {
            const updateChannelDataCache = { ...channelDataCache };
            updateChannelDataCache.members = [...updateChannelDataCache.members].filter(
                (member) => member._id !== userMember._id
            );
            return updateChannelDataCache;
        }
        return channelDataCache;
    };
};

// When a member went online
export const memberStatusUpdate = (memberId: string, statusType: string) => {
    return (channelDataCache: CurrentChannel | undefined) => {
        if (!channelDataCache) {
            return;
        }
        return {
            ...channelDataCache,
            members: channelDataCache.members.map((member) =>
                member._id === memberId ? { ...member, status: statusType } : member
            ),
        };
    };
};
