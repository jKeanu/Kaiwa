import { useContext, createContext } from 'react';
import { ChannelContext, HomeContext, LeftContext } from './types/contextTypes';

export const HomeSectionContext = createContext<HomeContext | undefined>(undefined);
export const ChannelSectionContext = createContext<ChannelContext | undefined>(undefined);
export const LeftSectionContext = createContext<LeftContext | undefined>(undefined);

export function useHomeCustomContext() {
    const homeSection = useContext(HomeSectionContext);
    if (homeSection === undefined) {
        throw new Error('useHomeCustomContext must be used with HomeSectionContext');
    }
    return homeSection;
}

export function useChannelCustomContext() {
    const channelSection = useContext(ChannelSectionContext);
    if (channelSection === undefined) {
        throw new Error('useChannelCustomContext must be used with ChannelSectionContext');
    }
    return channelSection;
}

export function useLeftCustomContext() {
    const leftSection = useContext(LeftSectionContext);
    if (leftSection === undefined) {
        throw new Error('useLeftCustomContext must be used with LeftSectionContext');
    }
    return leftSection;
}
