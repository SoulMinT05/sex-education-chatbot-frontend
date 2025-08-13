'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BarChart3Icon, LineChartIcon, Mars, Venus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon, Image as ImageLucide, XIcon } from 'lucide-react';
import { Button } from './ui/button';
// import { chat } from '@/actions/chat';
// import { readStreamableValue } from 'ai/rsc';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import axiosClient from '@/apis/axiosClient';
import { useMyContext } from '@/contexts/MyContext';
import { useRouter } from 'next/navigation';
// import DOMPurify from 'dompurify';
import Image from 'next/image';
// import rehypeRaw from 'rehype-raw';

const prompts = [
    {
        icon: <Mars strokeWidth={1.8} className="size-5" />,
        text: 'Giới tính',
    },
    {
        icon: <LineChartIcon strokeWidth={1.8} className="size-5" />,
        text: 'Sinh sản',
    },
    {
        icon: <Venus strokeWidth={1.8} className="size-5" />,
        text: 'Giáo dục giới tính',
    },
    {
        icon: <BarChart3Icon strokeWidth={1.8} className="size-5" />,
        text: 'Bình đẳng giới',
    },
];

type Message = {
    role: 'user' | 'assistant';
    content: string;
    imageBase64?: string | File | null;
};
export type Conversation = Message[][];

export type PDFDoc = {
    pageContent: string;
    metadata?: {
        source?: string;
        pdf?: unknown; // hoặc cụ thể hơn nếu biết rõ cấu trúc
        loc?: unknown;
    };
};

const ChatbotUser = () => {
    const { getConversations, setIsLogin } = useMyContext();
    const router = useRouter();
    const messageEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [input, setInput] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [conversation, setConversation] = useState<Conversation>([]);

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

    const handlePromptClick = (text: string) => {
        setInput(text);
        if (inputRef.current) {
            inputRef.current.textContent = text;
        }
    };

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
        setConversation((prev) => [...prev, [userMessage]]);
        setHasStartedChat(true);

        setTimeout(() => scrollToBottom(), 50);

        try {
            const formData = new FormData();
            formData.append('question', input.trim());

            if (selectedImage) {
                formData.append('imageBase64', selectedImage); // selectedImage là File object
            }

            const { data } = await axiosClient.post('/api/conversation/chat-auth', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            router.push(`/conversation/${data?.conversation_id}`);

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.answer || 'Không tìm thấy câu trả lời phù hợp.',
            };

            setConversation((prev) => {
                const updated = [...prev];
                const lastTurn = updated.pop();

                if (lastTurn) {
                    updated.push([...lastTurn, assistantMessage]);
                }

                return updated;
            });

            if (fileInputRef.current) fileInputRef.current.value = '';
            setTimeout(() => scrollToBottom(), 100);
            await getConversations();
            console.log('Đã gọi getConversations sau khi submit!');
        } catch (error) {
            console.log('Error:', error);
            setConversation((prev) => {
                const updated = [...prev];
                const lastTurn = updated.pop();

                if (lastTurn) {
                    updated.push([
                        ...lastTurn,
                        {
                            role: 'assistant',
                            content: 'Đã có lỗi xảy ra khi xử lý câu hỏi.',
                        },
                    ]);
                }
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
                {!hasStartedChat ? (
                    <div className="flex flex-col justify-end h-full space-y-8">
                        <div className="text-center space-y-4">
                            <h1 className="text-4xl font-semibold">Chào bạn</h1>
                            <h2 className="text-xl text-muted-foreground">Tôi có thể giúp gì cho bạn?</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-4">
                            {/* AnimatePresence: tạo animation thoát ra mượt mà (chẳng hạn như mờ dần) thay vì biến mất ngay lập tức.*/}
                            <AnimatePresence>
                                {prompts?.map((prompt, index) => {
                                    return (
                                        <motion.button
                                            key={index}
                                            onClick={() => handlePromptClick(prompt.text)}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{
                                                duration: 0.4,
                                                delay: index * 0.05,
                                                type: 'spring', // chuyển động ban đầu nhanh rồi chậm dần
                                                bounce: 0.25, //  chỉ dùng khi type: 'spring' --> 0.25: nảy nhẹ nhàng
                                            }}
                                            className="cursor-pointer flex items-center gap-3 p-4 text-left border rounded-xl hover:bg-muted transition-all text-sm"
                                        >
                                            {prompt?.icon}
                                            <span>{prompt?.text}</span>
                                        </motion.button>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                ) : (
                    <motion.div
                        animate={{
                            paddingBottom: input ? (input?.split('\n').length > 3 ? '206px' : '110px') : '80px',
                        }}
                        transition={{ duration: 0.2 }}
                        className="pt-8 space-y-4"
                    >
                        {conversation?.length !== 0 &&
                            conversation?.map((messagePair, pairIndex) => (
                                <div key={pairIndex}>
                                    {messagePair?.map((message, msgIndex) => {
                                        return (
                                            <motion.div
                                                key={msgIndex}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={cn('flex', {
                                                    'flex-col items-end': message.role === 'user',
                                                    'justify-start': message.role === 'assistant',
                                                })}
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
                                                {/* <div
                                                    className={cn('max-w-[80%] rounded-xl px-4 py-2', {
                                                        'bg-foreground text-background': message.role === 'user',
                                                        'bg-muted': message.role === 'assistant',
                                                    })}
                                                >
                                                    {message.role === 'assistant' ? (
                                                        // <Skeleton className="w-[536px] h-[48px] rounded-full" />
                                                        isLast && isLoadingSendMessage ? (
                                                            <Skeleton className="w-[536px] h-[48px] rounded-full" />
                                                        ) : (
                                                            renderAssistantContent(message.content)
                                                        )
                                                    ) : (
                                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                                    )}
                                                </div> */}
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
                )}
            </div>

            {/* Input Container */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, position: hasStartedChat ? 'fixed' : 'relative' }}
                className={`w-full bg-gradient-to-t
                                ${theme === 'white' ? 'from-white via-white' : 'from-background via-background '}
                                 to-transparent pb-4 pt-6 bottom-0 mt-auto`}
            >
                <div className="max-w-3xl mx-auto px-4 min-h-[70px]">
                    <motion.div
                        animate={{ height: 'auto' }}
                        whileFocus={{ scale: 1.01 }} // khi focus vào thì phóng to lên 1 chút
                        transition={{ duration: 0.2 }}
                        className={`relative border ${
                            selectedImage ? 'min-h-[84px]' : 'min-h-[56px]'
                        } rounded-2xl lg:rounded-e-3xl p-2.5 flex items-end gap-2 bg-background`}
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
                            className="flex-1 min-h-[36px] overflow-y-auto px-3 py-2 focus:outline-none text-sm 
                                bg-background rounded-md empty:before:text-muted-foreground 
                                empty:before:content-[attr(data-placeholder)] whitespace-pre-wrap break-words
                            "
                        />
                        <div className="flex gap-1">
                            {isLoadingSendMessage ? (
                                <div className="mb-[8px]">
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

export default ChatbotUser;
