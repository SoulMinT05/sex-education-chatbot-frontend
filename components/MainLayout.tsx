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
    // const router = useRouter();
    const { isLogin, setUserInfo, setConversation } = useMyContext(); // 👈 Lấy trạng thái đăng nhập từ Context

    // 👇 Thực hiện redirect nếu không đăng nhập mà cố vào trang chính
    // useEffect(() => {
    //     if (!isLoadingLogin) {
    //         if (!isLogin && pathname !== '/login') {
    //             router.push('/login');
    //         } else if (isLogin && pathname === '/login') {
    //             router.push('/');
    //         }
    //     }
    // }, [isLogin, pathname, router]);

    useEffect(() => {
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
        const getConversations = async () => {
            try {
                const { data } = await axiosClient.get('/api/conversation');
                setTimeout(() => {
                    setConversation(data.conversations);
                }, 1000);
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

    return pathname !== '/login' ? (
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
