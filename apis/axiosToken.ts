import axios from 'axios';
import Cookies from 'js-cookie';

// Dùng cho api logout

const axiosToken = axios.create({
    // baseURL: process.env.NEXT_PUBLIC_BACKEND_URL_NODEJS,
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL_PYTHON,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

axiosToken.interceptors.request.use(
    async (config) => {
        const access_token = Cookies.get('access_token');
        if (access_token) {
            config.headers.Authorization = `Bearer ${access_token}`;
        }

        config.withCredentials = true;
        return config;
    },
    (err) => {
        return Promise.reject(err);
    },
);

export default axiosToken;
