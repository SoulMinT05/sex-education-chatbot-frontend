'use server';

import { streamText } from 'ai';
import { gemini } from '@/lib/gemini';

import { createStreamableValue } from 'ai/rsc';
import { Message } from '@/components/ChatbotUser';

export const chat = async (history: Message[]) => {
    const stream = createStreamableValue();

    (async () => {
        const { textStream } = await streamText({
            model: gemini('gemini-1.5-flash'),
            messages: history,
        });

        for await (const text of textStream) {
            // cập nhật nội dung phản hồi từng dòng một (giả sử mô hình đang "gõ chữ
            stream.update(text);
        }
        stream.done();
    })();
    return {
        messages: history, // lịch sử hội thoại
        newMessage: stream.value, // giá trị reactive được cập nhật dần theo thời gian.
    };
};
