import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import TOKEN_ERRORS from '../constants/tokenErrors';

type TokenErrorCode = (typeof TOKEN_ERRORS)[keyof typeof TOKEN_ERRORS];

declare module 'axios' {
    interface AxiosRequestConfig {
        _retry?: boolean;
        _skipAuthInterceptor?: boolean;
        _isRefreshRequest?: boolean;
    }
    interface AxiosResponse {
        code?: TokenErrorCode;
    }
}

// The exact type isn't known  since it is a promise resolution.
interface QueueItem {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: (value?: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject: (reason?: any) => void;
}

const baseUrl = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
    baseURL: baseUrl, // Replace with your API's base URL
    withCredentials: true, // Ensure credentials (cookies) are sent with each request
});

// Token refresh state
let isRefreshing = false; // Global state flag
let failedQueue: QueueItem[] = []; // Stores pending requests

const processQueue = (error?: AxiosError | null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: unknown) => {
        if (!axios.isAxiosError(error) || !error.response || error.response.status !== 401) {
            return Promise.reject(error);
        }
        const originalRequest = error.config as AxiosRequestConfig;
        const errorCode = error.response.data.code as TokenErrorCode | undefined;
        // Skip interceptor for excluded requests or non token error with error 401.
        // _isRefreshREquest would be true if we have attempted to refresh the token but failed.
        // _retry would be true if we have set it to true and run axiosInstance(originalRequest), and still fails.
        // NOTE: we would only be able to run axiosInstance(originalRequest), if we have successfully refresh the token.
        if (
            originalRequest._skipAuthInterceptor ||
            originalRequest._isRefreshRequest ||
            !errorCode ||
            originalRequest._retry
        ) {
            return Promise.reject(error);
        }
        if (
            [
                TOKEN_ERRORS.EXPIRED_ACCESS,
                TOKEN_ERRORS.INVALID_ACCESS,
                TOKEN_ERRORS.MISSING_ACCESS,
            ].includes(errorCode as TokenErrorCode)
        ) {
            // This code handles the scenario where multiple API requests fail simultaneously due to
            // invalid/expired access token.
            if (isRefreshing) {
                // 1. Create a new Promise and store its resolve/reject
                return (
                    new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                        // 2. When refresh completes, retry original request
                        .then(() => axiosInstance(originalRequest))
                        .catch((err) => Promise.reject(err))
                );
            }
            originalRequest._retry = true; //Only one attempt to refresh the token.
            isRefreshing = true;
            try {
                await axios.post(`${baseUrl}/api/v1/auth/refresh`, null, {
                    withCredentials: true,
                    _isRefreshRequest: true,
                });
                processQueue();
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError as AxiosError);
                if (isRefreshTokenError(refreshError)) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false; // Guaranteed cleanup
            }
        }
        return Promise.reject(error);
    }
);

// Helper function to check refresh errors
const isRefreshTokenError = (error: unknown): boolean => {
    return (
        axios.isAxiosError(error) &&
        [
            TOKEN_ERRORS.EXPIRED_REFRESH,
            TOKEN_ERRORS.INVALID_REFRESH,
            TOKEN_ERRORS.MISSING_REFRESH,
        ].includes(error.response?.data?.code)
    );
};

export default axiosInstance;
