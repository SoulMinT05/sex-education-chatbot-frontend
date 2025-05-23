import axios from 'axios';
import Cookies from 'js-cookie';

// Dùng cho api cần Bearer token và để duy trì phiên user như user-details, ...

const axiosClient = axios.create({
    // baseURL: process.env.NEXT_PUBLIC_BACKEND_URL_NODEJS,
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL_PYTHON,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

axiosClient.interceptors.request.use(
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

axiosClient.interceptors.response.use(
    (res) => {
        return res;
    },
    async (err) => {
        const originalRequest = err.config;

        if (err.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const { data } = await axiosClient.get('/api/user/refresh_token');
                const new_access_token = data?.access_token;

                if (new_access_token) {
                    Cookies.set('access_token', new_access_token); // Lưu lại token mới
                    originalRequest.headers.Authorization = `Bearer ${new_access_token}`;
                    axios.defaults.headers.common['Authorization'] = `Bearer ${new_access_token}`;

                    return axiosClient(originalRequest);
                } else {
                    throw new Error('No access token received');
                }
            } catch (error) {
                Cookies.remove('access_token');
                Cookies.remove('refresh_token');
                return Promise.reject(error);
            }
        }
        // Nếu không phải lỗi 401 hoặc đã thử refresh token
        return Promise.reject(err);
    },
);

export default axiosClient;
