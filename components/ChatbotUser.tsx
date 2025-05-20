'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BarChart3Icon, FileTextIcon, LineChartIcon, CalculatorIcon, ArrowUpIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { chat } from '@/actions/chat';
import { readStreamableValue } from 'ai/rsc';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

const prompts = [
    {
        icon: <CalculatorIcon strokeWidth={1.8} className="size-5" />,
        text: 'Generate the monthly income statement',
    },
    {
        icon: <LineChartIcon strokeWidth={1.8} className="size-5" />,
        text: 'Provide a 12-month cash flow forecast',
    },
    {
        icon: <FileTextIcon strokeWidth={1.8} className="size-5" />,
        text: 'Book a journal entry',
    },
    {
        icon: <BarChart3Icon strokeWidth={1.8} className="size-5" />,
        text: 'Create a real-time financial dashboard',
    },
];

export type Message = {
    role: 'user' | 'assistant';
    content: string;
};

const ChatbotUser = () => {
    const messageEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);

    const [input, setInput] = useState<string>('');
    const [conversation, setConversation] = useState<Message[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasStartedChat, setHasStartedChat] = useState<boolean>(false);

    const { theme } = useTheme();

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({
            behavior: 'smooth',
        });
    };

    useEffect(() => {
        scrollToBottom();
    }, [input]);

    const handlePromptClick = (text: string) => {
        setInput(text);
        if (inputRef.current) {
            inputRef.current.textContent = text;
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: input.trim(),
        };

        setInput('');
        setIsLoading(true);
        setConversation((prev) => [...prev, userMessage]);
        setHasStartedChat(true);

        try {
            const { newMessage } = await chat([...conversation, userMessage]);

            let textContent = '';

            const assistantMessage: Message = {
                role: 'assistant',
                content: '',
            };

            setConversation((prev) => [...prev, assistantMessage]);

            for await (const delta of readStreamableValue(newMessage)) {
                textContent += delta;

                setConversation((prev) => {
                    const newConversation = [...prev];
                    newConversation[newConversation.length - 1] = {
                        role: 'assistant',
                        content: textContent,
                    };
                    return newConversation;
                });
            }
        } catch (error) {
            console.log('Error:', error);
            setConversation((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Có lỗi xảy ra trong quá trình xử lý yêu cầu của bạn. Vui lòng thử lại sau.',
                },
            ]);
        } finally {
            setIsLoading(false);
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
                        {conversation?.map((message, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn('flex', {
                                    'justify-end': message.role === 'user',
                                    'justify-start': message.role === 'assistant',
                                })}
                            >
                                <div
                                    className={cn('max-w-[80%] rounded-xl px-4 py-2', {
                                        'bg-foreground text-background': message.role === 'user',
                                        'bg-muted': message.role === 'assistant',
                                    })}
                                >
                                    {message.role === 'assistant' ? (
                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                    ) : (
                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                    )}
                                </div>
                            </motion.div>
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

export default ChatbotUser;
