// hooks/useVideoAgent.js
import { useRef, useState, useEffect } from 'react';

interface ApiConfig {
    key: string;
    gemini_key: string;
    openai_key: string;
    did_url: string;
    gemini_url: string;
    model: string;
    voice_id: string;
}
interface UseVideoAgentParams {
    idleVideoRef: React.RefObject<HTMLVideoElement | null>;
    talkVideoRef: React.RefObject<HTMLVideoElement | null>;
    userInputRef: React.RefObject<HTMLInputElement | null>;
    connectButtonRef: React.RefObject<HTMLButtonElement | null>;
    destroyButtonRef: React.RefObject<HTMLButtonElement | null>;
}

export function useVideoAgent({
    idleVideoRef,
    talkVideoRef,
    userInputRef,
    connectButtonRef,
    destroyButtonRef,
}: UseVideoAgentParams) {
    const DID_API_URL = useRef('https://api.d-id.com');

    const [isLoadingConnect, setIsLoadingConnect] = useState(false);
    const [isLoadingDisconnect, setIsLoadingDisconnect] = useState(false);
    const [apiConfig, setApiConfig] = useState<ApiConfig>();

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const streamIdRef = useRef<string | null>(null);
    const sessionIdRef = useRef<string | null>(null);

    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    const [statsIntervalId, setStatsIntervalId] = useState<NodeJS.Timeout | null>(null);
    const [lastBytesReceived, setLastBytesReceived] = useState(0);
    const [videoIsPlaying, setVideoIsPlaying] = useState(false);

    const [isConnected, setIsConnected] = useState(false);

    const [statusMap, setStatusMap] = useState<Record<string, string>>({
        peer: 'disconnected',
        ice: 'disconnected',
        signaling: 'stable',
        // ...
    });

    useEffect(() => {
        const init = async () => {
            try {
                const res = await fetch('/api.json');
                console.log('resInit: ', res);
                const config = await res.json();
                if (!config.key) throw new Error('Missing D-ID key in api.json');
                if (!config.gemini_key) throw new Error('Missing Gemini Key in api.json');
                if (!config.openai_key) throw new Error('Missing OpenAI Key in api.json');
                if (config.did_url) {
                    DID_API_URL.current = config.did_url;
                }
                setApiConfig(config);
                console.log('Initialized successfully');
            } catch (err: unknown) {
                if (err instanceof Error) {
                    alert(`Talk error: ${err.message}`);
                } else {
                    alert('Talk error: Unknown error');
                }
            }
        };
        init();
    }, []);

    const handleConnect = async () => {
        setIsLoadingConnect(true);
        try {
            if (peerConnectionRef.current?.connectionState === 'connected') return;

            cleanup();
            console.log('Cleaned up!');

            const response = await createStream();
            const { id, offer, ice_servers, session_id } = await response.json();

            streamIdRef.current = id;
            sessionIdRef.current = session_id;

            const answer = await createPeerConnection(offer, ice_servers); // = this.createPeerConnection(offer, ice_servers)
            console.log('answerPeerConnection: ', answer);

            await sendSDPAnswer(answer); // = this.sendSDPAnswer(answer)
            console.log('Sended SDP Answer');

            setIsConnected(true);

            updateUI(true); // giống this.updateUI(true)
            console.log('Updated UI!');

            userInputRef.current?.focus();
        } catch (err: unknown) {
            if (err instanceof Error) {
                alert(`Talk error: ${err.message}`);
            } else {
                alert('Talk error: Unknown error');
            }
            cleanup();
            setIsConnected(false);
        } finally {
            setIsLoadingConnect(false);
        }
    };

    const handleTalk = async () => {
        try {
            const userInput = userInputRef.current?.innerText?.trim();
            if (!userInput) throw new Error('Please enter a message');

            // const { fetchGeminiResponse } = await import('../lib/gemini'); // or wherever you store it
            // if (!apiConfig?.gemini_key) throw new Error('Cần có Gemini API Key');
            // const aiResponse = await fetchGeminiResponse(apiConfig.gemini_key, userInput);
            const { fetchOpenAIResponse } = await import('../lib/openai'); // or wherever you store it
            if (!apiConfig?.openai_key) throw new Error('Cần có OpenAI API Key');
            const aiResponse = await fetchOpenAIResponse(apiConfig.openai_key, userInput);

            await fetch(`${apiConfig?.did_url || 'https://api.d-id.com'}/talks/streams/${streamIdRef.current}`, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${btoa(apiConfig?.key + ':')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    script: {
                        type: 'text',
                        input: aiResponse,
                        provider: {
                            type: 'microsoft',
                            voice_id: apiConfig.voice_id,
                        },
                    },
                    config: { fluent: true, stitch: true },
                    driver_url: 'bank://lively/',
                    session_id: sessionIdRef.current,
                }),
            });

            const userInputEl = userInputRef.current;
            if (!userInputEl) throw new Error('Cần nhập câu hỏi');

            userInputEl.innerText = '';
        } catch (err: unknown) {
            if (err instanceof Error) {
                alert(`Talk error: ${err.message}`);
            } else {
                alert('Talk error: Unknown error');
            }
        }
    };

    const handleDestroy = async () => {
        try {
            if (streamIdRef) {
                await deleteStream();
            }
        } catch (error) {
            console.error('Destroy error:', error);
        } finally {
            cleanup();
            updateUI(false);
            if (connectButtonRef.current) {
                connectButtonRef.current.classList.remove('connected', 'loading');
            }
        }
    };

    const createStream = async () => {
        return await fetch(`${DID_API_URL.current}/talks/streams`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${btoa(apiConfig?.key + ':')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source_url: 'https://raw.githubusercontent.com/jjmlovesgit/D-id_Streaming_Chatgpt/main/oracle_pic.jpg',
                stream_warmup: true,
                config: {
                    video_quality: 'hd',
                },
            }),
        });
    };

    const createPeerConnection = async (offer: RTCSessionDescriptionInit, iceServers: RTCIceServer[]) => {
        const pc = new RTCPeerConnection({ iceServers });

        pc.onicecandidate = (event) => {
            if (event.candidate && streamIdRef && sessionIdRef) {
                if (!apiConfig) throw new Error('Cần có D-ID Key');

                fetch(`${DID_API_URL.current}/talks/streams/${streamIdRef.current}/ice`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Basic ${btoa(apiConfig.key + ':')}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        candidate: event.candidate.candidate,
                        sdpMid: event.candidate.sdpMid,
                        sdpMLineIndex: event.candidate.sdpMLineIndex,
                        session_id: sessionIdRef.current,
                    }),
                }).catch(console.error);
            }
        };

        pc.ontrack = (event) => {
            if (event.track.kind === 'video') {
                const interval = setInterval(async () => {
                    const stats = await pc.getStats(event.track);
                    stats.forEach((report) => {
                        if (report.type === 'inbound-rtp' && report.kind === 'video') {
                            const isPlaying = report.bytesReceived > lastBytesReceived;
                            if (isPlaying !== videoIsPlaying) {
                                setVideoIsPlaying(isPlaying);
                                updateStatus('streaming', isPlaying ? 'streaming' : 'idle');

                                const videoEl = talkVideoRef.current;
                                const idleEl = idleVideoRef.current;

                                if (isPlaying) {
                                    if (idleEl) idleEl.style.display = 'none';

                                    if (videoEl) {
                                        videoEl.style.display = 'block';

                                        // Chỉ gán nếu chưa có srcObject
                                        if (!videoEl.srcObject) {
                                            videoEl.srcObject = event.streams[0];

                                            videoEl.onloadedmetadata = () => {
                                                videoEl
                                                    .play()
                                                    .then(() => console.log('🎬 Video started'))
                                                    .catch((error) => console.error('Video play error:', error));
                                            };
                                        }
                                    }
                                } else {
                                    // Khi không còn streaming, reset lại srcObject
                                    if (videoEl) {
                                        videoEl.pause();
                                        videoEl.srcObject = null;
                                        videoEl.style.display = 'none';
                                    }
                                    if (idleEl) idleEl.style.display = 'block';
                                }
                            }
                            setLastBytesReceived(report.bytesReceived);
                        }
                    });
                }, 500);

                setStatsIntervalId(interval);
            }
        };
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        setPeerConnection(pc);
        return answer;
    };

    const sendSDPAnswer = async (answer: RTCSessionDescriptionInit) => {
        if (!streamIdRef || !sessionIdRef) return;

        if (!apiConfig?.key) throw new Error('Cần có D-ID Key');

        await fetch(`${DID_API_URL.current}/talks/streams/${streamIdRef.current}/sdp`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${btoa(apiConfig.key + ':')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                answer,
                session_id: sessionIdRef.current,
            }),
        });
    };

    const deleteStream = async () => {
        setIsLoadingDisconnect(true);
        console.log('streamIdRef?.current: ', streamIdRef?.current);
        console.log('sessionIdRef?.current: ', sessionIdRef?.current);
        try {
            if (!streamIdRef?.current || !sessionIdRef?.current) {
                throw new Error('Thiếu streamId hoặc sessionId');
            }

            if (!apiConfig?.key) throw new Error('Cần có D-ID Key');

            const res = await fetch(`${DID_API_URL.current}/talks/streams/${streamIdRef.current}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Basic ${btoa(apiConfig.key + ':')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ session_id: sessionIdRef.current }),
            });

            console.log('resDeleteStream: ', res);
            const data = await res.json();
            console.log('dataDeleteStream: ', data);
        } catch (err) {
            console.error('Lỗi xóa stream:', err);
        } finally {
            setIsLoadingDisconnect(false);
        }
        // if (!streamIdRef || !sessionIdRef) return;
        // if (!apiConfig?.key) throw new Error('Cần có D-ID Key');

        // const res = await fetch(`${DID_API_URL.current}/talks/streams/${streamIdRef.current}`, {
        //     method: 'DELETE',
        //     headers: {
        //         Authorization: `Basic ${btoa(apiConfig.key + ':')}`,
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify({ session_id: sessionIdRef.current }),
        // });
        // console.log('resDeleteStream: ', res);
        // const data = await res.json();
        // console.log('dataDeleteStream: ', data);
        // setIsLoadingDisconnect(false);
    };

    const cleanup = () => {
        if (peerConnection) {
            peerConnection.close();
            setPeerConnection(null);
        }

        if (talkVideoRef.current) {
            // 🛑 Stop and remove all tracks
            if (talkVideoRef.current.srcObject) {
                (talkVideoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());

                talkVideoRef.current.srcObject = null;
            }

            talkVideoRef.current.pause();
            talkVideoRef.current.style.display = 'none';
        }

        if (idleVideoRef.current) {
            idleVideoRef.current.style.display = 'block';
        }

        if (statsIntervalId) {
            clearInterval(statsIntervalId);
            setStatsIntervalId(null);
        }

        ['peer', 'ice', 'iceGathering', 'signaling', 'streaming'].forEach((type) => {
            updateStatus(type, type === 'signaling' ? 'stable' : 'disconnected');
        });
    };

    const updateUI = (connected: boolean) => {
        const connectButton = connectButtonRef.current;
        const destroyButton = destroyButtonRef.current;

        if (destroyButton) {
            destroyButton.disabled = !connected;
        }

        // if (connectButton) {
        //     if (connected) {
        //         connectButton.classList.add('connected');
        //         connectButton.innerText = 'Connected';
        //     } else {
        //         connectButton.classList.remove('connected', 'loading');
        //         connectButton.innerText = 'Connect';
        //     }
        // }
    };

    const updateStatus = (type: string, state: string) => {
        setStatusMap((prev) => ({ ...prev, [type]: state }));
    };

    useEffect(() => {
        updateUI(isConnected);
    }, [isConnected]);

    return {
        isConnected,
        setIsConnected,
        isLoadingConnect,
        setIsLoadingConnect,
        isLoadingDisconnect,
        setIsLoadingDisconnect,
        handleConnect,
        handleTalk,
        handleDestroy,
        createStream,
        createPeerConnection,
        sendSDPAnswer,
        deleteStream,
        cleanup,
        updateUI,
        updateStatus,
    };
}
