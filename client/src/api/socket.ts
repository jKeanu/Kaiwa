import axiosInstance from "./axiosInstance"

export const verifyToken = async () =>{
    const res = await axiosInstance.get(
        `/api/v1/socket/verify-token`
    )
    return  res.status
}