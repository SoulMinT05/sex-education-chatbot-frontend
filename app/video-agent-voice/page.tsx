'use client';
import { useEffect, useRef, useState } from 'react';

import { motion } from 'framer-motion';
import './page.scss';
import { Button } from '@/components/ui/button';
import { ArrowUpIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useVideoAgentVoice } from '@/hooks/useVideoAgentVoice';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
// import Image from 'next/image';

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface Window {
    webkitSpeechRecognition: {
        prototype: SpeechRecognition;
        new (): SpeechRecognition;
    };
}

const VideoAgentVoice = () => {
    const idleVideoRef = useRef<HTMLVideoElement>(null);
    const talkVideoRef = useRef<HTMLVideoElement>(null);
    const userInputRef = useRef<HTMLInputElement>(null);
    const [isLoadingVoiceTypingUser, setIsLoadingVoiceTypingUser] = useState(false);

    const connectButtonRef = useRef<HTMLButtonElement>(null);
    const voiceTypingButtonRef = useRef<HTMLButtonElement>(null);
    // const talkButtonRef = useRef<HTMLButtonElement>(null);
    const destroyButtonRef = useRef<HTMLButtonElement>(null);

    const responseContainerRef = useRef<HTMLTextAreaElement>(null);

    const peerStatusLabelRef = useRef<HTMLSpanElement>(null);
    const iceStatusLabelRef = useRef<HTMLSpanElement>(null);
    const iceGatheringStatusLabelRef = useRef<HTMLSpanElement>(null);
    const signalingStatusLabelRef = useRef<HTMLSpanElement>(null);
    const streamingStatusLabelRef = useRef<HTMLSpanElement>(null);
    const [sendToDID, setSendToDID] = useState(true);

    const voiceRecognitionRef = useRef<SpeechRecognition | null>(null);

    const {
        isConnected,
        isLoadingConnect,
        isLoadingDisconnect,
        // isLoadingTalk,
        handleConnect,
        handleTalk,
        handleDisconnect,
    } = useVideoAgentVoice({
        idleVideoRef,
        talkVideoRef,
        userInputRef,
        connectButtonRef,
        destroyButtonRef,
        peerStatusLabelRef,
        iceStatusLabelRef,
        iceGatheringStatusLabelRef,
        signalingStatusLabelRef,
        streamingStatusLabelRef,
        sendToDID,
        setSendToDID,
        responseContainerRef,
    });

    useEffect(() => {
        // Kiểm tra browser có hỗ trợ webkitSpeechRecognition không
        if (!('webkitSpeechRecognition' in window)) {
            alert('Web Speech API is not supported in this browser.');
            return;
        }

        // Khởi tạo recognition
        const win = window as Window & {
            webkitSpeechRecognition?: {
                prototype: SpeechRecognition;
                new (): SpeechRecognition;
            };
        };
        if (win.webkitSpeechRecognition) {
            const recognition = new win.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            // recognition.lang = 'en-US';
            recognition.lang = 'vi-VN';

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                let final_transcript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    console.log('Result:', event.results[i][0].transcript);
                    if (event.results[i].isFinal) {
                        final_transcript += event.results[i][0].transcript;
                    }
                }
                if (userInputRef.current) {
                    userInputRef.current.innerText = final_transcript;
                }
            };

            recognition.onerror = (event: SpeechRecognitionEvent) => {
                console.error('Speech recognition error', event);
            };

            voiceRecognitionRef.current = recognition;

            // Cleanup khi unmount component
            return () => {
                recognition.stop();
            };
        }
    }, []);

    const [isWaitingBotResponse, setIsWaitingBotResponse] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleStartRecognition = () => {
        if (isWaitingBotResponse) {
            console.log('Đang chờ bot trả lời, không thể hỏi tiếp.');
            return;
        }

        setIsLoadingVoiceTypingUser(true);
        console.log('STARTING RECOGNITION');

        if (voiceRecognitionRef.current) {
            voiceRecognitionRef.current.stop();

            voiceRecognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
                let final_transcript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final_transcript += event.results[i][0].transcript;
                    }
                }

                if (userInputRef.current) {
                    userInputRef.current.innerText = final_transcript;
                }

                // Clear timeout cũ
                if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

                // Đặt timeout gọi handleTalk sau 5s ngừng nói
                silenceTimeoutRef.current = setTimeout(() => {
                    console.log('🕒 Đã ngừng nói 5s, gọi handleTalk');

                    setIsWaitingBotResponse(true);
                    setCountdown(3);

                    // Bắt đầu đếm ngược 3 giây
                    countdownIntervalRef.current = setInterval(() => {
                        setCountdown((prev) => {
                            if (prev <= 1) {
                                clearInterval(countdownIntervalRef.current!);
                                setIsWaitingBotResponse(false); // Mở lại nút hỏi
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);

                    handleTalk();
                }, 5000);
            };

            voiceRecognitionRef.current.onerror = (event: SpeechRecognitionEvent) => {
                console.error('❌ Speech recognition error', event);
            };

            (
                voiceRecognitionRef.current as SpeechRecognition & {
                    onend: (this: SpeechRecognition, ev: Event) => void;
                }
            ).onend = () => {
                console.log('📭 Speech recognition ended');

                // Clear timeout cũ
                if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

                silenceTimeoutRef.current = setTimeout(() => {
                    console.log('🕒 Không nói tiếp, gọi handleTalk');

                    setIsWaitingBotResponse(true);
                    setCountdown(3);

                    countdownIntervalRef.current = setInterval(() => {
                        setCountdown((prev) => {
                            if (prev <= 1) {
                                clearInterval(countdownIntervalRef.current!);
                                setIsWaitingBotResponse(false);
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);

                    handleTalk();
                }, 3000);
            };

            voiceRecognitionRef.current.start();
        }

        setIsLoadingVoiceTypingUser(false);
    };

    const { theme } = useTheme();

    return (
        <div className="min-h-[1000px]">
            <div className="flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-semibold">D-ID AI Video Agent - Voice</h1>
                    <h2 className="text-xl text-muted-foreground">Bạn có thể trò chuyện trực tiếp với AI</h2>
                </div>
            </div>
            <div className="video-wrapper flex items-center justify-center">
                <div className="video-container w-[320px] h-[320px] overflow-hidden rounded-full mx-auto mt-4">
                    <video
                        className="idle-video h-[320px] w-[320px] object-cover rounded-full"
                        ref={idleVideoRef}
                        // src="./oracle_Idle.mp4"
                        src="./co-gai-cuoi.mp4"
                        autoPlay
                        muted
                        loop
                        playsInline
                    />
                    <video className="talk-video" ref={talkVideoRef} autoPlay playsInline style={{ display: 'none' }} />
                </div>
            </div>
            {/* <div className="">
                <Image
                    src="/Co Gai Hay Cuoi Large.png"
                    width={200}
                    height={200}
                    alt=""
                    className="w-[200px] h-[200px]"
                />
            </div> */}
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

            <div className="max-w-3xl mx-auto mt-6 flex items-center justify-center gap-2">
                <Checkbox id="toggleDID" checked={sendToDID} onCheckedChange={(checked) => setSendToDID(!!checked)} />
                <Label htmlFor="toggleDID">Gửi đến DID</Label>
            </div>
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
                {/* <Button
                    ref={voiceTypingButtonRef}
                    id="voice-typing-button"
                    type="button"
                    className={`py-[14px] px-[20px] cursor-pointer`}
                    onClick={handleStartRecognition}
                    disabled={isLoadingVoiceTypingUser}
                >
                    {isLoadingVoiceTypingUser ? 'Đang xử lý...' : 'Người dùng hỏi'}
                </Button> */}
                <Button
                    ref={voiceTypingButtonRef}
                    id="voice-typing-button"
                    type="button"
                    className={`py-[14px] px-[20px] cursor-pointer`}
                    onClick={handleStartRecognition}
                    disabled={isLoadingVoiceTypingUser || isWaitingBotResponse}
                >
                    {isLoadingVoiceTypingUser
                        ? 'Đang xử lý...'
                        : isWaitingBotResponse
                        ? `Chờ bot trả lời trong ${countdown}s`
                        : 'Người dùng hỏi'}
                </Button>

                {/* <Button
                    ref={talkButtonRef}
                    id="talk-button"
                    type="button"
                    className={`py-[14px] px-[20px] cursor-pointer`}
                    onClick={handleTalk}
                    disabled={isLoadingTalk}
                >
                    {isLoadingTalk ? 'Bot đang xử lý...' : 'Bot trả lời'}
                </Button> */}
                <Button
                    ref={destroyButtonRef}
                    className="destroy-button py-[14px] px-[20px] cursor-pointer "
                    type="button"
                    disabled={!isConnected || isLoadingDisconnect}
                    onClick={handleDisconnect}
                >
                    {isLoadingDisconnect ? 'Đang ngắt kết nối...' : 'Ngắt kết nối'}
                </Button>
            </div>
            <div className="response-container max-w-3xl mx-auto mt-6 ">
                <Textarea
                    ref={responseContainerRef}
                    className="min-h-[100px]"
                    placeholder="Server response will appear here for reference"
                />
            </div>
            <div className="status max-w-3xl mx-auto mt-4 block">
                <div className="text-center">
                    ICE gathering status: {'  '}
                    <span ref={iceGatheringStatusLabelRef} className="ice-gathering-status-label "></span>
                </div>
                <div className="text-center">
                    ICE status: <span ref={iceStatusLabelRef} className="ice-status-label"></span>
                </div>
                <div className="text-center">
                    Peer connection status: <span ref={peerStatusLabelRef} className="peer-status-label"></span>
                </div>
                <div className="text-center">
                    Signaling status: <span ref={signalingStatusLabelRef} className="signaling-status-label"></span>
                </div>
                <div className="text-center">
                    Streaming status: <span ref={streamingStatusLabelRef} className="streaming-status-label"></span>
                </div>
                <br />
            </div>
            <audio id="audio-element" className="hidden-audio" autoPlay />
        </div>
    );
};

export default VideoAgentVoice;
