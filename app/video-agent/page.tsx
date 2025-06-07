'use client';
import { useRef } from 'react';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowUpIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useVideoAgent } from '@/hooks/useVideoAgent';
const AIAgent = () => {
    const idleVideoRef = useRef<HTMLVideoElement>(null);
    const talkVideoRef = useRef<HTMLVideoElement>(null);
    const userInputRef = useRef<HTMLInputElement>(null);
    const connectButtonRef = useRef<HTMLButtonElement>(null);
    const destroyButtonRef = useRef<HTMLButtonElement>(null);

    const { isConnected, isLoadingConnect, isLoadingDisconnect, handleConnect, handleDestroy, handleTalk } =
        useVideoAgent({
            idleVideoRef,
            talkVideoRef,
            userInputRef,
            connectButtonRef,
            destroyButtonRef,
        });

    const { theme } = useTheme();

    return (
        <div className="min-h-[1000px]">
            <div className="flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-semibold">D-ID AI Video Agent - Text</h1>
                    <h2 className="text-xl text-muted-foreground">Bạn có thể nhắn tin trực tiếp với AI</h2>
                </div>
            </div>
            <div className="video-wrapper flex items-center justify-center">
                <div className="video-container w-[320px] h-[320px] overflow-hidden rounded-full mx-auto mt-4">
                    <video
                        className="idle-video"
                        ref={idleVideoRef}
                        src="./oracle_Idle.mp4"
                        autoPlay
                        muted
                        loop
                        playsInline
                    />
                    <video className="talk-video" ref={talkVideoRef} autoPlay playsInline style={{ display: 'none' }} />
                </div>
            </div>
            <div className="input-container flex items-center justify-center mt-8">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
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
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleTalk();
                                    }
                                }}
                                onPaste={(e) => {
                                    e.preventDefault();
                                    const text = e.clipboardData.getData('text/plain');
                                    document.execCommand('insertText', false, text); // bỏ định dạng
                                }}
                                ref={userInputRef}
                                data-placeholder="Đặt câu hỏi ..."
                                className="user-input-field flex-1 min-h-[36px] overflow-y-auto px-3 py-2 focus:outline-none text-sm 
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
            <hr className="divider-line h-[2px] max-w-3xl mx-auto mt-4" />
            <div className="buttons flex items-center justify-center mt-[20px] gap-[20px] ">
                <Button
                    ref={connectButtonRef}
                    id="connect-button"
                    type="button"
                    className={`py-[14px] px-[20px] cursor-pointer ${isConnected} ? 'connected' : ${isLoadingConnect} ? 'loading' : ''`}
                    onClick={handleConnect}
                    disabled={isConnected || isLoadingConnect}
                >
                    {isLoadingConnect ? 'Đang kết nối...' : 'Kết nối'}
                </Button>
                <Button
                    ref={destroyButtonRef}
                    className="destroy-button py-[14px] px-[20px] cursor-pointer "
                    type="button"
                    disabled={!isConnected || isLoadingDisconnect}
                    onClick={handleDestroy}
                >
                    {isLoadingDisconnect ? 'Đang ngắt kết nối...' : 'Ngắt kết nối'}
                </Button>
            </div>
            <audio id="audio-element" className="hidden-audio" autoPlay />
        </div>
    );
};

export default AIAgent;
