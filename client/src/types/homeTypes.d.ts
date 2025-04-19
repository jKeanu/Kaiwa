import { Friend, FriendReq } from './friendTypes';

export type HomeSectionProps = {
    isFriendsOpen: boolean;
    friendReqs: FriendReq[];
    friendChannels: Friend[];
};
