import { useMemo } from "react"
import { Channel } from "../types/channelTypes"


const useChannelInfo = (channels:Channel[])=>{
    //join rooms based on the channel id, so when there's an update in the channel
    //we will be notified
    const channelIds:string[] = useMemo(()=>{
        return [...channels].map(channel => channel._id)
    }, [channels])

    const channelNumberAndIds:{channelNumber:number, channelId:string}[] = useMemo(()=>{
        return [...channels].map(channel => {
            return {channelNumber:channel.channelNumber, channelId:channel._id}
        })
    }, [channels])

    return {
        channelIds,
        channelNumberAndIds
    }
}

export default useChannelInfo