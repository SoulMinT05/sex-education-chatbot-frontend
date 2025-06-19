// hooks/useVideoAgent.js
import axiosClient from '@/apis/axiosClient';
import { useMyContext } from '@/contexts/MyContext';
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

    peerStatusLabelRef: React.RefObject<HTMLSpanElement | null>;
    iceStatusLabelRef: React.RefObject<HTMLSpanElement | null>;
    iceGatheringStatusLabelRef: React.RefObject<HTMLSpanElement | null>;
    signalingStatusLabelRef: React.RefObject<HTMLSpanElement | null>;
    streamingStatusLabelRef: React.RefObject<HTMLSpanElement | null>;

    sendToDID: boolean;
    setSendToDID: React.Dispatch<React.SetStateAction<boolean>>;

    responseContainerRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function useVideoAgentVoice({
    idleVideoRef,
    talkVideoRef,
    userInputRef,
    peerStatusLabelRef,
    iceStatusLabelRef,
    iceGatheringStatusLabelRef,
    signalingStatusLabelRef,
    streamingStatusLabelRef,
    sendToDID,
    responseContainerRef,
}: UseVideoAgentParams) {
    const DID_API_URL = useRef('https://api.d-id.com');
    const { chatResponse, setChatResponse } = useMyContext();

    const [isLoadingConnect, setIsLoadingConnect] = useState(false);
    const [isLoadingDisconnect, setIsLoadingDisconnect] = useState(false);
    const [isLoadingTalk, setIsLoadingTalk] = useState(false);
    const [apiConfig, setApiConfig] = useState<ApiConfig>();

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const streamIdRef = useRef<string | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const sessionClientAnswerRef = useRef<RTCSessionDescriptionInit | null>(null);

    const [statsIntervalId, setStatsIntervalId] = useState<NodeJS.Timeout | null>(null);
    const [lastBytesReceived, setLastBytesReceived] = useState(0);
    const [videoIsPlaying, setVideoIsPlaying] = useState(false);

    const [isConnected, setIsConnected] = useState(false);
    const [disConnected, setDisConnected] = useState(false);

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
                if (talkVideoRef.current) {
                    talkVideoRef.current.setAttribute('playsinline', '');
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

            stopAllStreams();
            closePC();

            console.log('Cleaned up!');

            if (!apiConfig || !apiConfig.key) throw new Error('Cần có key của D-ID');

            const response = await createStream();

            const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await response.json();

            streamIdRef.current = newStreamId;
            sessionIdRef.current = newSessionId;

            try {
                const answer = await createPeerConnection(offer, iceServers);
                sessionClientAnswerRef.current = answer;

                await sendSDPAnswer(answer); // = this.sendSDPAnswer(answer)
                console.log('Sended SDP Answer');
            } catch (e) {
                console.log('error during streaming setup', e);
                stopAllStreams();
                closePC();
                return;
            }

            setIsConnected(true);

            userInputRef.current?.focus();
        } catch (err: unknown) {
            if (err instanceof Error) {
                alert(`Talk error: ${err.message}`);
            } else {
                alert('Talk error: Unknown error');
            }
            setIsConnected(false);
        } finally {
            setIsLoadingConnect(false);
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
                // source_url: 'https://raw.githubusercontent.com/jjmlovesgit/D-id_Streaming_Chatgpt/main/oracle_pic.jpg',
                source_url:
                    'https://raw.githubusercontent.com/SoulMinT05/avatar-storage/refs/heads/main/co-gai-hay-cuoi-large.png',
                stream_warmup: true,
                config: {
                    video_quality: 'hd',
                },
            }),
        });
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

    useEffect(() => {
        if (!chatResponse) return;

        if (sendToDID) {
            console.log('HANDLE DID STREAMING');
            handleDIDStreaming(chatResponse);
        } else {
            console.log('DID streaming is toggled off. Not sending to DID.');
        }
    }, [chatResponse, sendToDID]);

    const handleDIDStreaming = async (chatResponse: string) => {
        if (!apiConfig || !apiConfig.did_url) throw new Error('Cần url của D-ID');

        try {
            const talkResponse = await fetch(`${apiConfig.did_url}/talks/streams/${streamIdRef.current}`, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${btoa(apiConfig?.key + ':')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    script: {
                        type: 'text',
                        input: chatResponse, // Send the chatResponse to D-ID
                        provider: { type: 'microsoft', voice_id: apiConfig.voice_id },
                    },
                    config: {
                        fluent: true,
                        stitch: true,
                    },
                    driver_url: 'bank://lively/',
                    session_id: sessionIdRef.current,
                }),
            });

            // Handle the response from D-ID here
            if (!talkResponse.ok) {
                throw new Error(`D-ID streaming request failed with status ${talkResponse.status}`);
            }

            // Process the talkResponse if needed
            const responseData = await talkResponse.json();
            console.log('D-ID Streaming Response:', responseData);
        } catch (error) {
            console.error('Error during D-ID streaming:', error);
        }
    };

    const handleTalk = async () => {
        setIsLoadingTalk(true);
        if (!userInputRef.current || !responseContainerRef.current) return;
        const userInput = userInputRef.current.innerText;

        try {
            const { data } = await axiosClient.post('/api/conversation/chat-auth-voice', {
                question: userInput.trim(),
            });

            console.log('data: ', data);

            // Extract the 'text' property from the response
            const chatText = data.answer.trim(); // This removes any leading/trailing whitespace
            console.log(chatText);
            // Update the response container with the chatText
            responseContainerRef.current.value = chatText; // Display the chatText in the response container
            setChatResponse(chatText);
        } catch (error) {
            console.error('Error sending query to the server:', error);
            responseContainerRef.current.textContent = 'Error: Could not get a response.'; // Display error message
        } finally {
            setIsLoadingTalk(false);
        }
    };

    const handleDisconnect = async () => {
        if (!apiConfig || !apiConfig.did_url) throw new Error('Cần url của D-ID');

        setIsLoadingDisconnect(true);

        try {
            await fetch(`${apiConfig.did_url}/talks/streams/${streamIdRef.current}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Basic ${btoa(apiConfig.key + ':')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ session_id: sessionIdRef.current }),
            });
            setIsConnected(false);
        } catch (err) {
            console.error('Lỗi khi gọi DELETE stream:', err);
            setIsConnected(true);
        } finally {
            stopAllStreams();
            closePC();
            setIsLoadingDisconnect(false);
        }
    };

    const handleIceCandidate = (event: RTCPeerConnectionIceEvent) => {
        if (!event.candidate || !apiConfig || !apiConfig.did_url) return;

        const { candidate, sdpMid, sdpMLineIndex } = event.candidate;

        fetch(`${apiConfig.did_url}/talks/streams/${streamIdRef.current}/ice`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${btoa(apiConfig.key + ':')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                candidate,
                sdpMid,
                sdpMLineIndex,
                session_id: sessionIdRef.current,
            }),
        }).catch((err) => console.error('Lỗi khi gửi ICE candidate:', err));
    };

    const handleIceGatheringStateChange = () => {
        const pc = peerConnectionRef.current;
        if (!pc || !iceGatheringStatusLabelRef.current) return;

        iceGatheringStatusLabelRef.current.innerText = pc.iceGatheringState;
        iceGatheringStatusLabelRef.current.className = `iceGatheringState-${pc.iceGatheringState}`;
    };
    const handleIceConnectionStateChange = () => {
        const pc = peerConnectionRef.current;
        if (!pc || !iceStatusLabelRef.current) return;

        const state = pc.iceConnectionState;

        iceStatusLabelRef.current.innerText = state;
        iceStatusLabelRef.current.className = `iceConnectionState-${state}`;

        if (state === 'failed' || state === 'closed') {
            stopAllStreams();
            closePC();
        }
    };

    const handleConnectionStateChange = () => {
        const pc = peerConnectionRef.current;
        if (!pc || !peerStatusLabelRef.current) return;

        peerStatusLabelRef.current.innerText = pc.connectionState;
        peerStatusLabelRef.current.className = `peerConnectionState-${pc.connectionState}`;
    };

    const handleSignalingStateChange = () => {
        const pc = peerConnectionRef.current;
        if (!pc || !signalingStatusLabelRef.current) return;

        signalingStatusLabelRef.current.innerText = pc.signalingState;
        signalingStatusLabelRef.current.className = `signalingState-${pc.signalingState}`;
    };

    const handleVideoStatusChange = (videoIsPlaying: boolean, stream: MediaStream) => {
        if (!streamingStatusLabelRef.current) return;

        let status: string;

        if (videoIsPlaying) {
            status = 'streaming';
            setVideoElement(stream);
        } else {
            status = 'empty';
            playIdleVideo();
        }

        streamingStatusLabelRef.current.innerText = status;
        streamingStatusLabelRef.current.className = `streamingState-${status}`;
    };
    const createPeerConnection = async (
        offer: RTCSessionDescriptionInit,
        iceServers: RTCIceServer[],
    ): Promise<RTCSessionDescriptionInit> => {
        if (!peerConnectionRef.current || peerConnectionRef.current.signalingState === 'closed') {
            const pc = new RTCPeerConnection({ iceServers });

            pc.onicegatheringstatechange = handleIceGatheringStateChange;
            pc.onicecandidate = handleIceCandidate;
            pc.oniceconnectionstatechange = handleIceConnectionStateChange;
            pc.onconnectionstatechange = handleConnectionStateChange;
            pc.onsignalingstatechange = handleSignalingStateChange;
            pc.ontrack = handleTrack;

            peerConnectionRef.current = pc;
        }

        const pc = peerConnectionRef.current;
        if (!pc) throw new Error('PeerConnection chưa được khởi tạo');
        console.log('offer: ', offer);
        await pc.setRemoteDescription(offer);
        console.log('set remote sdp OK');

        const sessionClientAnswer = await pc.createAnswer();
        console.log('create local sdp OK');

        await pc.setLocalDescription(sessionClientAnswer);
        console.log('set local sdp OK');

        return sessionClientAnswer;
    };

    const playIdleVideo = () => {
        const videoEl = talkVideoRef.current;
        const idleEl = idleVideoRef.current;

        if (!videoEl || !idleEl) return;
        // Stop stream video
        if (videoEl.srcObject) {
            videoEl.pause();
            // Stop stream tracks để tránh resource leak hoặc đứt âm thanh
            const tracks = (videoEl.srcObject as MediaStream).getTracks();
            tracks.forEach((track) => track.stop());

            videoEl.srcObject = null;
            videoEl.style.display = 'none';
        }

        // Hiện idle video
        idleEl.src = '/5loop.mp4';
        idleEl.loop = true;
        idleEl.style.display = 'block';

        idleEl
            .play()
            .then(() => console.log('🎞️ Idle video playing'))
            .catch((err) => console.error('Idle video play error:', err));
    };

    const handleTrack = (event: RTCTrackEvent) => {
        if (!event.track || !peerConnectionRef.current) return;

        const videoEl = talkVideoRef.current;
        const idleEl = idleVideoRef.current;

        if (!videoEl || !idleEl) return;

        if (!videoEl.srcObject) {
            videoEl.srcObject = event.streams[0];
            videoEl.onloadedmetadata = () => {
                videoEl.play().catch(console.error);
            };
        }
        // Clear interval cũ nếu có
        if (statsIntervalId) {
            clearInterval(statsIntervalId);
            setStatsIntervalId(null);
        }

        const interval = setInterval(async () => {
            if (!peerConnectionRef.current) {
                clearInterval(interval);
                setStatsIntervalId(null);
                return;
            }
            // Kiểm tra track còn tồn tại trên peerConnection
            const senders = peerConnectionRef.current.getSenders();
            const receivers = peerConnectionRef.current.getReceivers();
            const trackStillExists =
                senders.some((s) => s.track === event.track) || receivers.some((r) => r.track === event.track);

            if (!trackStillExists) {
                clearInterval(interval);
                setStatsIntervalId(null);
                return;
            }

            try {
                const stats = await peerConnectionRef.current.getStats(event.track);
                stats.forEach((report) => {
                    if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                        const isNowPlaying = report.bytesReceived > lastBytesReceived;
                        const videoStatusChanged = videoIsPlaying !== isNowPlaying;

                        if (videoStatusChanged) {
                            setVideoIsPlaying(isNowPlaying);
                            handleVideoStatusChange(isNowPlaying, event.streams[0]);

                            if (isNowPlaying) {
                                if (idleEl) idleEl.style.display = 'none';
                                if (videoEl) {
                                    videoEl.style.display = 'block';
                                    videoEl.play().catch(console.error);
                                }
                            } else {
                                if (videoEl) {
                                    videoEl.pause();
                                    videoEl.style.display = 'none';
                                }
                                if (idleEl) idleEl.style.display = 'block';
                            }
                        }
                        setLastBytesReceived(report.bytesReceived);
                    }
                });
            } catch (error) {
                console.warn('getStats failed, stopping interval:', error);
                clearInterval(interval);
                setStatsIntervalId(null);
            }
        }, 500);

        setStatsIntervalId(interval);
    };

    const setVideoElement = (stream: MediaStream | null) => {
        const videoEl = talkVideoRef.current;
        const idleEl = idleVideoRef.current;

        if (!stream || !videoEl) return;

        const currentStream = videoEl.srcObject as MediaStream | null;

        if (currentStream?.id === stream.id && currentStream.getVideoTracks()[0]?.readyState === 'live') {
            return;
        }
        console.log('🔁 Cập nhật video stream');

        if (idleEl) {
            idleEl.pause();
            idleEl.style.display = 'none';
        }
        // Dừng stream cũ
        if (currentStream) {
            currentStream.getTracks().forEach((track) => track.stop());
            videoEl.srcObject = null;
        }

        videoEl.srcObject = stream;
        videoEl.style.display = 'block';
        videoEl.loop = false;

        const tryPlay = () => {
            if (videoEl.paused) {
                videoEl
                    .play()
                    .then(() => console.log('🎬 Video stream playing'))
                    .catch((err) => console.error('Video stream play error:', err));
            }
        };

        if (videoEl.readyState >= 2) {
            tryPlay();
        } else {
            videoEl.onloadedmetadata = tryPlay;
        }
    };

    const stopAllStreams = () => {
        const videoEl = talkVideoRef.current;
        if (!videoEl) return;
        if (videoEl.srcObject) {
            console.log('🛑 Stopping all video streams');
            const stream = videoEl.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            videoEl.srcObject = null;
        }
    };
    const closePC = () => {
        const pc = peerConnectionRef.current;
        if (!pc) return;

        console.log('🛑 Closing peer connection');
        pc.close();

        // Clear event listeners
        pc.onicegatheringstatechange = null;
        pc.onicecandidate = null;
        pc.oniceconnectionstatechange = null;
        pc.onconnectionstatechange = null;
        pc.onsignalingstatechange = null;
        pc.ontrack = null;

        // Clear stats interval
        if (statsIntervalId) {
            clearInterval(statsIntervalId);
            setStatsIntervalId(null);
        }

        // Clear UI status (nếu dùng useRef)
        if (iceGatheringStatusLabelRef.current) iceGatheringStatusLabelRef.current.innerText = '';
        if (signalingStatusLabelRef.current) signalingStatusLabelRef.current.innerText = '';
        if (iceStatusLabelRef.current) iceStatusLabelRef.current.innerText = '';
        if (peerStatusLabelRef.current) peerStatusLabelRef.current.innerText = '';

        console.log('✅ Peer connection closed');

        // Clear ref
        peerConnectionRef.current = null;
    };

    return {
        isConnected,
        setIsConnected,
        disConnected,
        setDisConnected,
        isLoadingConnect,
        setIsLoadingConnect,
        isLoadingDisconnect,
        setIsLoadingDisconnect,
        isLoadingTalk,
        setIsLoadingTalk,
        handleConnect,
        handleTalk,
        handleDisconnect,
        createStream,
        createPeerConnection,
        sendSDPAnswer,
    };
}
