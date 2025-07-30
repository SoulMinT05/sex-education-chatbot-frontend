import React, { useEffect, useState } from 'react';
import {
    // Home, Inbox, Calendar, Settings, Search,
    User2,
    ChevronUp,
} from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from './ui/sidebar';
import Link from 'next/link';
import Image from 'next/image';

import logo from '../public/dogcute.jpg';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useMyContext } from '@/contexts/MyContext';
import axiosClient from '@/apis/axiosClient';
import { Skeleton } from './ui/skeleton';

const AppSidebarComponent = () => {
    const { userInfo, conversation, setConversation, isLogin } = useMyContext();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    useEffect(() => {
        if (!isLogin) return;

        const getConversations = async () => {
            try {
                setIsLoading(true);
                const { data } = await axiosClient.get('/api/conversation');
                if (data.success) {
                    setTimeout(() => {
                        setConversation(data.conversations);
                    }, 300);
                }
            } catch (error) {
                console.log(error);
            } finally {
                setTimeout(() => {
                    setIsLoading(false);
                }, 300);
            }
        };
        getConversations();
    }, [userInfo?.id]);

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="py-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/">
                                <Image src={logo} alt="logo" width={20} height={20} />
                                <span>Chatbot Giáo dục giới tính</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarSeparator className="w-full mx-auto " />

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Lịch sử trò chuyện</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {isLoading && conversation?.length === 0 && (
                                <div className="space-y-2">
                                    {Array.from({ length: 9 }).map((_, index) => (
                                        <div
                                            key={index}
                                            className="bg-accent text-accent-foreground w-[239px] !rounded-md overflow-hidden"
                                        >
                                            <Skeleton className="w-[239px] h-[32px] rounded-md" />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {Array.isArray(conversation) &&
                                conversation?.length !== 0 &&
                                conversation?.map((conv) => {
                                    const firstUserMsg = conv.conversation
                                        .find((pair) => pair.find((msg) => msg.role === 'user'))
                                        ?.find((msg) => msg.role === 'user');

                                    return (
                                        <SidebarMenuItem key={conv.id}>
                                            <SidebarMenuButton
                                                className={`${
                                                    activeConversationId === conv.id
                                                        ? 'bg-accent text-accent-foreground w-[239px] !rounded-md overflow-hidden' // Màu khi active
                                                        : ''
                                                }`}
                                                asChild
                                                onClick={() => setActiveConversationId(conv.id)}
                                            >
                                                <Link href={`/conversation/${conv.id}`}>
                                                    <span>{firstUserMsg?.content || 'Không có câu hỏi'}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton>
                                    {userInfo?.avatar ? (
                                        <Image
                                            src={userInfo?.avatar}
                                            alt="logo"
                                            width={20}
                                            height={20}
                                            objectFit="cover"
                                            className="rounded-full object-cover"
                                        />
                                    ) : (
                                        <User2 />
                                    )}
                                    {userInfo?.name}
                                    <ChevronUp className="ml-auto" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Tài khoản</DropdownMenuItem>
                                <DropdownMenuItem>Cài đặt</DropdownMenuItem>
                                <DropdownMenuItem variant="destructive">Đăng xuất</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
};

export default AppSidebarComponent;
