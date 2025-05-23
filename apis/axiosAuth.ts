import axios from 'axios';

// Dùng cho api không cần Bearer token như đăng ký,...

const axiosAuth = axios.create({
    // baseURL: process.env.NEXT_PUBLIC_BACKEND_URL_NODEJS,
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL_PYTHON,
    timeout: 600000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

axiosAuth.interceptors.request.use(
    async (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

export default axiosAuth;
