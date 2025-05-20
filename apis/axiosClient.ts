import axios from 'axios';
import Cookies from 'js-cookie';

// Dùng cho api cần Bearer token và để duy trì phiên user như user-details, ...

const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

axiosClient.interceptors.request.use(
    async (config) => {
        const accessToken = Cookies.get('accessToken');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        config.withCredentials = true;
        return config;
    },
    (err) => {
        return Promise.reject(err);
    },
);

axiosClient.interceptors.response.use(
    (res) => {
        return res;
    },
    async (err) => {
        const originalRequest = err.config;

        if (err.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const { data } = await axiosClient.get('/api/user/refreshToken');
                const newAccessToken = data?.data?.accessToken;

                if (newAccessToken) {
                    Cookies.set('accessToken', newAccessToken); // Lưu lại token mới
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

                    return axiosClient(originalRequest);
                } else {
                    throw new Error('No access token received');
                }
            } catch (error) {
                Cookies.remove('accessToken');
                Cookies.remove('refreshToken');
                return Promise.reject(error);
            }
        }
        // Nếu không phải lỗi 401 hoặc đã thử refresh token
        return Promise.reject(err);
    },
);

export default axiosClient;
