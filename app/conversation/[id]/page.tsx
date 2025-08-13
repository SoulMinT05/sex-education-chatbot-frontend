'use client';

import { useParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpIcon, Image as ImageLucide, XIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/button';
// import { chat } from '@/actions/chat';
// import { readStreamableValue } from 'ai/rsc';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Skeleton } from '../../../components/ui/skeleton';
import axiosClient from '@/apis/axiosClient';
import { useMyContext } from '@/contexts/MyContext';
import Image from 'next/image';

type Message = {
    role: 'user' | 'assistant';
    content: string;
    imageBase64?: string | File | null;
};

type ConversationDetails = Message[][];

const ConversationPage = () => {
    const params = useParams();
    const id = params?.id;

    const [conversationDetails, setConversationDetails] = useState<ConversationDetails>([]);

    const { getConversations, setIsLogin } = useMyContext();
    const messageEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [input, setInput] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingSendMessage, setIsLoadingSendMessage] = useState<boolean>(false);
    const [hasStartedChat, setHasStartedChat] = useState<boolean>(false);

    const { theme } = useTheme();

    useEffect(() => {
        const checkIsLogin = async () => {
            const { data } = await axiosClient.get('/api/user/check-is-login');
            console.log('isLogin: ', data);
            if (data?.success) {
                setIsLogin(true);
            }
        };
        checkIsLogin();
    }, []);

    useEffect(() => {
        const getConversationDetails = async () => {
            try {
                setIsLoading(true);
                const { data } = await axiosClient.get(`/api/conversation/${id}`);
                if (data.success) {
                    setTimeout(() => {
                        setConversationDetails(data.conversation);
                    }, 300);
                }
            } catch (error) {
                console.log(error);
            } finally {
                setTimeout(() => {
                    setIsLoading(false); // trì hoãn 1 giây để giữ skeleton
                }, 300);
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

    // Mở dialog chọn ảnh
    const handleImageButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedImage(e.target.files[0]);
        }
    };

    const paddingBottom = hasStartedChat ? (input.split('\n').length > 3 ? '140px' : '72px') : '0px';

    const handleSendMessage = async () => {
        if ((!input.trim() && !selectedImage) || isLoadingSendMessage) return;

        const userMessage: Message = {
            role: 'user',
            content: input.trim() || '',
            imageBase64: selectedImage || null,
        };

        setInput('');
        setSelectedImage(null);
        setIsLoadingSendMessage(true);
        setConversationDetails((prev: Message[][]) => [...prev, [userMessage]]);
        setHasStartedChat(true);

        setTimeout(() => scrollToBottom(), 50);

        try {
            const formData = new FormData();
            formData.append('question', input.trim());

            if (selectedImage) {
                formData.append('imageBase64', selectedImage); // selectedImage là File object
            }

            const { data } = await axiosClient.post(`/api/conversation/chat-auth/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

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

            if (fileInputRef.current) fileInputRef.current.value = '';
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
                    <motion.div animate={{ paddingBottom }} transition={{ duration: 0.2 }} className="pt-8 space-y-4">
                        {isLoading &&
                            conversationDetails?.length === 0 &&
                            Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className="mb-4">
                                    <motion.div
                                        className={cn('flex', {
                                            'justify-end ': index % 2 === 0,
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
                                        return (
                                            <motion.div
                                                key={msgIndex}
                                                className={cn('flex', {
                                                    'flex-col items-end': message.role === 'user',
                                                    'justify-start': message.role === 'assistant',
                                                })}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                {message?.imageBase64 && (
                                                    <div className="h-[240px]">
                                                        <Image
                                                            src={
                                                                typeof message.imageBase64 === 'string'
                                                                    ? message.imageBase64
                                                                    : URL.createObjectURL(message.imageBase64 as File)
                                                            }
                                                            width={300}
                                                            height={240}
                                                            alt="image sent"
                                                            className="mt-2 h-[240px] max-w-full rounded-lg block"
                                                        />
                                                    </div>
                                                )}

                                                <br />
                                                {message?.content?.trim() && (
                                                    <div
                                                        className={cn(
                                                            'max-w-[80%] rounded-xl px-4 py-2 mb-4',
                                                            // message.role === 'user' && message?.imageBase64
                                                            //     ? 'mt-[116px]'
                                                            //     : 'mt-4',
                                                            {
                                                                // 'mt-[116px]': !!message?.imageBase64,
                                                                'bg-foreground text-background self-end':
                                                                    message.role === 'user',
                                                                'bg-muted self-start': message.role === 'assistant',
                                                            }
                                                        )}
                                                    >
                                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                                    </div>
                                                )}
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
                        className="relative border  rounded-2xl lg:rounded-e-3xl p-2.5 flex items-end gap-2 bg-background"
                    >
                        {selectedImage && (
                            <div className="">
                                <div className="absolute top-5 left-[30px] -translate-y-4 z-20">
                                    <Image
                                        width={60}
                                        height={50}
                                        className="w-[60px] h-[40px]"
                                        src={
                                            typeof selectedImage === 'string'
                                                ? selectedImage
                                                : URL.createObjectURL(selectedImage)
                                        }
                                        alt="slider"
                                    />
                                </div>
                                <button
                                    type="button"
                                    aria-label="Remove image"
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute top-1 left-[69px] -translate-y-1/2 translate-x-1/2 bg-white rounded-full 
                                        p-0.5 shadow-md cursor-pointer hover:bg-gray-200 z-20"
                                >
                                    <XIcon className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                        )}

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
                            className={`${
                                selectedImage ? 'pt-10' : 'pt-[20px]'
                            } flex-1 min-h-[36px] overflow-y-auto px-3 py-2 focus:outline-none text-sm 
                                    bg-background rounded-md empty:before:text-muted-foreground 
                                    empty:before:content-[attr(data-placeholder)] whitespace-pre-wrap break-words
                                `}
                        />
                        <div className="flex gap-1">
                            {isLoadingSendMessage ? (
                                <div className="mb-[15px]">
                                    <span className="text-sm italic text-gray-600 flex items-center">
                                        Đang trả lời
                                        <span className="animate-pulse">.</span>
                                        <span className="animate-pulse delay-150">.</span>
                                        <span className="animate-pulse delay-300">.</span>
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <Button
                                        onClick={() => handleSendMessage()}
                                        size="icon"
                                        className="rounded-full shrink-0 mb-0.5 cursor-pointer"
                                    >
                                        <ArrowUpIcon strokeWidth={2.5} className="size-5" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        className="rounded-full shrink-0 mb-0.5 cursor-pointer p-1 transition-colors"
                                        aria-label="Upload image"
                                        onClick={handleImageButtonClick}
                                    >
                                        <ImageLucide strokeWidth={2.5} className="size-5" />
                                    </Button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                    />
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default ConversationPage;
