import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const gemini = createGoogleGenerativeAI({
    apiKey: process.env.NEXT_GOOGLE_GEMINI_KEY,
});

export async function fetchGeminiResponse(apiKey: string, userMessage: string): Promise<string> {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: userMessage }],
                        },
                    ],
                }),
            },
        );

        console.log('responseFetchGemini: ', response);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gemini error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const result = await response.json();
        console.log('resultFetchGemini: ', result);
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
        return text.trim();
    } catch (error) {
        console.error('Gemini Error:', error);
        return 'Tôi không thể xử lý yêu cầu. Vui lòng thử lại.';
    }
}
