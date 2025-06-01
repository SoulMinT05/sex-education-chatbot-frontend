'use client';

import { useParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/button';
// import { chat } from '@/actions/chat';
// import { readStreamableValue } from 'ai/rsc';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Skeleton } from '../../../components/ui/skeleton';
import axiosClient from '@/apis/axiosClient';
import { useMyContext } from '@/contexts/MyContext';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

type ConversationDetails = Message[][];

const ConversationPage = () => {
    const params = useParams();
    const id = params?.id;

    const [conversationDetails, setConversationDetails] = useState<ConversationDetails>([]);

    const { getConversations } = useMyContext();
    const messageEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState<string>('');

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingSendMessage, setIsLoadingSendMessage] = useState<boolean>(false);
    const [hasStartedChat, setHasStartedChat] = useState<boolean>(false);

    const { theme } = useTheme();

    useEffect(() => {
        const getConversationDetails = async () => {
            try {
                setIsLoading(true);
                const { data } = await axiosClient.get(`/api/conversation/${id}`);
                if (data.success) {
                    setTimeout(() => {
                        setConversationDetails(data.conversation);
                    }, 1000);
                }
            } catch (error) {
                console.log(error);
            } finally {
                setTimeout(() => {
                    setIsLoading(false); // trì hoãn 1 giây để giữ skeleton
                }, 1000);
            }
        };
        getConversationDetails();
    }, [id]);

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({
            behavior: 'smooth',
        });
    };

    useEffect(() => {
        scrollToBottom();
    }, [input]);

    const paddingBottom = hasStartedChat ? (input.split('\n').length > 3 ? '140px' : '72px') : '0px';

    const handleSendMessage = async () => {
        if (!input.trim() || isLoadingSendMessage) return;

        const userMessage: Message = {
            role: 'user',
            content: input.trim(),
        };

        setInput('');
        setIsLoadingSendMessage(true);
        setConversationDetails((prev: Message[][]) => [...prev, [userMessage]]);
        setHasStartedChat(true);

        setTimeout(() => scrollToBottom(), 50);

        try {
            const { data } = await axiosClient.post(`/api/conversation/chat-auth/${id}`, {
                question: input.trim(),
            });
            console.log('dataChat: ', data);

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.answer || 'Không tìm thấy câu trả lời phù hợp.',
            };

            setConversationDetails((prev: Message[][]) => {
                if (prev.length === 0) {
                    // Trường hợp chưa có chunk nào (ít xảy ra)
                    return [[assistantMessage]];
                }
                const updated = [...prev];
                // lấy chunk cuối cùng
                const lastChunk = [...updated[updated.length - 1]];
                // thêm assistantMessage vào chunk cuối
                lastChunk.push(assistantMessage);
                // cập nhật chunk cuối cùng
                updated[updated.length - 1] = lastChunk;

                return updated;
            });

            setTimeout(() => scrollToBottom(), 100);
            getConversations();
        } catch (error) {
            console.log('Error:', error);
            setConversationDetails((prev) => {
                const updated = [...prev];
                const lastChunk = updated[updated.length - 1] || [];
                updated[updated.length - 1] = [
                    ...lastChunk,
                    {
                        role: 'assistant',
                        content: 'Đã có lỗi xảy ra khi xử lý câu hỏi.',
                    },
                ];
                return updated;
            });
        } finally {
            setIsLoadingSendMessage(false);
        }
    };
    return (
        <div className="relative h-full flex flex-col items-center">
            {/* Message Container. */}
            <div className="flex-1 w-full max-w-3xl px-4">
                {
                    <motion.div
                        // animate={{
                        //     paddingBottom: input ? (input?.split('\n').length > 3 ? '206px' : '110px') : '80px',
                        // }}
                        animate={{ paddingBottom }}
                        transition={{ duration: 0.2 }}
                        className="pt-8 space-y-4"
                    >
                        {isLoading &&
                            conversationDetails?.length === 0 &&
                            Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="mb-4">
                                    <motion.div
                                        className={cn('flex', {
                                            'justify-end': index % 2 === 0,
                                            'justify-start': index % 2 !== 0,
                                        })}
                                    >
                                        <div className="max-w-[80%] rounded-xl px-4 py-2 mb-4 bg-muted">
                                            <Skeleton className="w-[536px] h-[48px] rounded-md" />
                                        </div>
                                    </motion.div>
                                </div>
                            ))}
                        {conversationDetails?.length !== 0 &&
                            conversationDetails?.map((chunk, chunkIndex) => (
                                <div key={chunkIndex} className="mb-4">
                                    {chunk.map((message, msgIndex) => {
                                        const isLastMessage =
                                            chunkIndex === conversationDetails.length - 1 &&
                                            msgIndex === chunk.length - 1;
                                        return (
                                            <motion.div
                                                key={msgIndex}
                                                className={cn('flex', {
                                                    'justify-end': message.role === 'user',
                                                    'justify-start': message.role === 'assistant',
                                                })}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                <div
                                                    className={cn('max-w-[80%] rounded-xl px-4 py-2 mb-4', {
                                                        'bg-foreground text-background': message.role === 'user',
                                                        'bg-muted': message.role === 'assistant',
                                                    })}
                                                >
                                                    {message.role === 'assistant' &&
                                                    isLastMessage &&
                                                    isLoadingSendMessage ? (
                                                        <Skeleton className="w-[536px] h-[48px] rounded-full" />
                                                    ) : (
                                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ))}

                        <div ref={messageEndRef}></div>
                    </motion.div>
                }
            </div>

            {/* Input Container */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, position: hasStartedChat ? 'fixed' : 'relative' }}
                className={`w-full bg-gradient-to-t
                    ${theme === 'white' ? 'from-white via-white' : 'from-background via-background '}
                     to-transparent pb-4 pt-6 bottom-0 mt-auto`}
            >
                <div className="max-w-3xl mx-auto px-4">
                    <motion.div
                        animate={{ height: 'auto' }}
                        whileFocus={{ scale: 1.01 }} // khi focus vào thì phóng to lên 1 chút
                        transition={{ duration: 0.2 }}
                        className="relative border rounded-2xl lg:rounded-e-3xl p-2.5 flex items-end gap-2 bg-background"
                    >
                        <div
                            contentEditable
                            role="textbox"
                            onInput={(e) => {
                                setInput(e.currentTarget.textContent || '');
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            onPaste={(e) => {
                                e.preventDefault();
                                const text = e.clipboardData.getData('text/plain');
                                document.execCommand('insertText', false, text); // bỏ định dạng
                            }}
                            ref={(element) => {
                                inputRef.current = element;
                                // element: <div contentEditable  role="textbox" onInput={(e) => {
                                // input:  Create a real-time financial dashboard or ...
                                if (element && !input) {
                                    element.textContent = '';
                                }
                            }}
                            data-placeholder="Đặt câu hỏi ..."
                            className="flex-1 min-h-[36px] overflow-y-auto px-3 py-2 focus:outline-none text-sm 
                                    bg-background rounded-md empty:before:text-muted-foreground 
                                    empty:before:content-[attr(data-placeholder)] whitespace-pre-wrap break-words
                                "
                        />
                        <Button size="icon" className="rounded-full shrink-0 mb-0.5 cursor-pointer">
                            <ArrowUpIcon strokeWidth={2.5} className="size-5" />
                        </Button>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default ConversationPage;
