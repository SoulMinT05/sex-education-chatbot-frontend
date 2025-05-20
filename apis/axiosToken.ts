import axios from 'axios';
import Cookies from 'js-cookie';

// Dùng cho api logout

const axiosToken = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

axiosToken.interceptors.request.use(
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

export default axiosToken;
