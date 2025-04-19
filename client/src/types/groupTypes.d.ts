import { SetStateAction } from 'react';
import { UpdateUserStatus } from './userTypes';
import { Socket } from 'socket.io-client';
import { MemberModalSettings, UnfriendModalSettings } from './modalTypes';
import { CurrentChannel } from './channelTypes';

export type MemberUpdateInfo = {
    updatedUser: UpdateUserStatus['user'];
    channelNumber: number;
};

export type CreateGroupStatus = {
    status: string;
    newChannel: {
        channelName: string;
        groupLeader: string;
        members: string[];
        channelType: string;
        _id: string;
        id: string;
        channelNumber: number;
        formattedLastMessage: string;
        lastMessage: Date;
        photo: string;
        photoUrl: string;
        seen: string[];
        __v: number;
    };
};

//Group
export type DeleteGroup = {
    channelId: string;
    handleCloseButton: (e: React.MouseEvent<HTMLButtonElement>) => void;
    socket: Socket | undefined;
    membersId: string[];
    channelNumber: string | undefined;
    setModalDisabled: React.Dispatch<SetStateAction<boolean>>;
};

export type LeaveGroup = {
    channelId: string;
    handleCloseButton: (e: React.MouseEvent<HTMLButtonElement>) => void;
    socket: Socket | undefined;
    currUserId: string;
    channelNumber: string | undefined;
    setModalDisabled: React.Dispatch<SetStateAction<boolean>>;
};

export type CreateGroup = {
    currUserId: string;
    setIsDisabled: React.Dispatch<SetStateAction<boolean>>;
    setModal: React.Dispatch<SetStateAction<{ active: boolean; type: string }>>;
    handleCloseButton: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

export type UnfriendProps = {
    channelId: string;
    friendId: string;
    socket: Socket | undefined;
    displayName: string;
    handleFriendChannelDelete: (channelId: string) => void;
    handleCloseButton: (e: React.MouseEvent<HTMLButtonElement>) => void;
    setModalSettings: React.Dispatch<SetStateAction<UnfriendModalSettings>>;
    channelNumber: number | undefined;
    setIsModalDisabled: React.Dispatch<SetStateAction<boolean>>;
};

export type GroupSettingsProps = {
    channelName: string;
    socket: Socket | undefined;
    groupPhotoUrl: string;
    groupPhoto: string;
    channelId: string;
    setCurrentChannel: React.Dispatch<SetStateAction<CurrentChannel | undefined>>;
    handleCloseButton: (e: React.MouseEvent<HTMLButtonElement>) => void;
    setModalDisabled: React.Dispatch<SetStateAction<boolean>>;
    setModalWindow: React.Dispatch<SetStateAction<{ window: string; isOpen: boolean }>>;
};

export type MemberUnfriend = {
    channelId: string;
    memberId: string;
    socket: Socket | undefined;
    displayName: string;
    handleCloseButton: (e: React.MouseEvent<HTMLButtonElement>) => void;
    setModalSettings: React.Dispatch<SetStateAction<MemberModalSettings>>;
    channelNumber: number | undefined;
    setModalDisabled: React.Dispatch<SetStateAction<boolean>>;
};

export type ChangeLeader = {
    channelId: string;
    handleCloseButton: (e: React.MouseEvent<HTMLButtonElement>) => void;
    channelNumber: number | undefined;
    socket: Socket | undefined;
    setModalSettings: React.Dispatch<SetStateAction<MemberModalSettings>>;
    memberId: string;
    displayName: string;
    setModalDisabled: React.Dispatch<SetStateAction<boolean>>;
};

export type UpdateGroupStatus = {
    status: string;
    group: {
        _id: string;
        channelName: string;
        photo: string;
        id: string;
        photoUrl: string;
    };
};
