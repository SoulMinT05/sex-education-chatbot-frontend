'use client'; // ✅ Phải để dòng này vì đây là client component

import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import Cookies from 'js-cookie'; // Thay đổi import từ 'cookie' sang 'js-cookie'

interface UserInfo {
    _id: string;
    name: string;
    email: string;
    avatar: string;
    role: string;
    address: string;
}

interface MyContextType {
    isLogin: boolean;
    setIsLogin: (value: boolean) => void;
    openAlertBox: (type: string, message: string) => void;
    isLoadingLogin: boolean;
    userInfo: UserInfo | null;
    setUserInfo: (value: UserInfo | null) => void;
}

const MyContext = createContext<MyContextType | null>(null);

export const useMyContext = () => {
    const context = useContext(MyContext);
    if (!context) {
        throw new Error('useMyContext must be used within a MyContextProvider');
    }
    return context;
};

export const MyContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLogin, setIsLogin] = useState(false);
    const [isLoadingLogin, setIsLoadingLogin] = useState(true);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

    useEffect(() => {
        const token = Cookies.get('access_token');
        if (token) {
            setIsLogin(true);
        }
        setIsLoadingLogin(false);
    }, []);

    const openAlertBox = (type: string, message: string) => {
        const variantClass = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-gray-500';

        toast(message, {
            action: {
                label: 'Huỷ',
                onClick: () => console.log('Huỷ clicked'),
            },
            className: `${variantClass} text-white px-4 py-2 rounded-md`,
        });
    };

    const values = { isLogin, setIsLogin, openAlertBox, isLoadingLogin, userInfo, setUserInfo };
    return <MyContext.Provider value={values}>{children}</MyContext.Provider>;
};
