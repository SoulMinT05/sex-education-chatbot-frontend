'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Button } from '@/components/ui/button';

import { LogOut, Moon, Send, Settings, Sun, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
    SidebarTrigger,
    // useSidebar
} from './ui/sidebar';
import { useMyContext } from '@/contexts/MyContext';
import axiosToken from '@/apis/axiosToken';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Link from 'next/link';

const NavbarComponent = () => {
    const { userInfo, setIsLogin, openAlertBox } = useMyContext();
    const { setTheme } = useTheme();
    // const [isLoading, setIsLoading] = useState<boolean>(false);
    // const { toggleSidebar } = useSidebar();
    const router = useRouter();
    const handleLogout = async () => {
        // setIsLoading(true);
        try {
            const { data } = await axiosToken.post('/api/user/logout', {
                withCredentials: true,
            });

            if (data.success) {
                Cookies.remove('access_token');
                setIsLogin(false);
                openAlertBox('success', data.message);
                router.push('/login');
            } else {
                openAlertBox('error', data.message);
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Lỗi đăng nhập:', error.message);
            } else {
                console.error('Lỗi đăng nhập:', error);
            }
        }
        //  finally {
        //     setIsLoading(false);
        // }
    };
    return (
        <nav className="p-4 flex items-center justify-between">
            {/* LEFT */}
            <div className="flex items-center gap-0 ">
                <SidebarTrigger className="!h-6 !w-6 !cursor-pointer" />

                <Button
                    className="!cursor-pointer"
                    onClick={() => router.push('/new-conversation')}
                    variant="ghost"
                    size="icon"
                >
                    <Send strokeWidth={1.25} className="!h-6 !w-6" />
                </Button>
            </div>
            {/* <Button variant="outline" onClick={() => toggleSidebar()}>
                Custom Button
            </Button> */}
            {/* RIGHT */}
            <div className="flex items-center gap-4">
                <Button variant="outline">
                    <Link href="/">Trang chủ</Link>
                </Button>
                <Button variant="outline">
                    <Link href="/new-conversation">Nhắn tin cùng AI</Link>
                </Button>
                {/* <Link href="/video-agent">Text AI</Link> */}
                <Button variant="outline">
                    <Link href="/video-agent-voice">Trò chuyện cùng AI</Link>
                </Button>
                {/* THEME MENU */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="cursor-pointer">
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* USER MENU */}
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <Avatar className="cursor-pointer">
                            <AvatarImage src={userInfo?.avatar} />
                            <AvatarFallback>{userInfo?.name}</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={10}>
                        <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer">
                            <User className="h-[19px] w-[19px] mr-2" />
                            Thông tin cá nhân
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                            <Settings className="h-[19px] w-[19px] mr-2" />
                            Cài đặt
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" className="cursor-pointer">
                            <div className="flex gap-2 items-center" onClick={handleLogout}>
                                <LogOut className="h-[19px] w-[19px] mr-2" />
                                Đăng xuất
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </nav>
    );
};

export default NavbarComponent;
