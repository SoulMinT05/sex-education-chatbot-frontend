'use client';

import AppSidebarComponent from '@/components/AppSidebarComponent';
import NavbarComponent from '@/components/NavbarComponent';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useMyContext } from '@/contexts/MyContext';
import axiosClient from '@/apis/axiosClient';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
    const [defaultOpen, setDefaultOpen] = useState(true);

    const pathname = usePathname();
    const { isLogin, setUserInfo, setConversation } = useMyContext(); // 👈 Lấy trạng thái đăng nhập từ Context

    useEffect(() => {
        if (!isLogin) return;

        const getUserDetails = async () => {
            try {
                const { data } = await axiosClient.get('/api/user/get-user-details');
                setUserInfo(data?.user);
            } catch (error) {
                console.log(error);
            }
        };
        getUserDetails();
    }, [isLogin]);

    useEffect(() => {
        if (!isLogin) return;

        const getConversations = async () => {
            try {
                const { data } = await axiosClient.get('/api/conversation');
                setTimeout(() => {
                    setConversation(data.conversations);
                }, 300);
            } catch (error) {
                console.log(error);
            }
        };
        getConversations();
    }, [isLogin]);

    // 👇 Load trạng thái sidebar từ localStorage
    useEffect(() => {
        const sidebarState = localStorage.getItem('sidebar_state');
        setDefaultOpen(sidebarState === 'true');
    }, []);

    return pathname !== '/login' && pathname !== '/' ? (
        <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebarComponent />
            <main className="w-full">
                <NavbarComponent />
                <div className="px-4">{children}</div>
            </main>
        </SidebarProvider>
    ) : (
        <main className="w-full">{children}</main>
    );
};

export default MainLayout;
