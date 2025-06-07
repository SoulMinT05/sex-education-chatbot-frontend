import fetch from 'node-fetch';
import fs from 'fs/promises';

interface GeminiResponse {
    candidates?: Array<{
        content?: {
            parts?: string[];
        };
    }>;
    [key: string]: unknown;
}

async function fetchGeminiResponse(apiKey: string, userMessage: string): Promise<string> {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
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

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gemini error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const result: GeminiResponse = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0] || 'No response from Gemini.';
        return text.trim();
    } catch (error) {
        console.error('Gemini Error:', error);
        return 'Tôi không thể xử lý yêu cầu. Vui lòng thử lại.';
    }
}

async function main() {
    try {
        // Đọc file config api.json lấy key Gemini
        const apiConfigRaw = await fs.readFile('/api.json', 'utf8');
        const apiConfig = JSON.parse(apiConfigRaw);
        const geminiKey: string = apiConfig.gemini_key;

        const userInput = 'Ai là CEO của Tesla?';
        const geminiResponse = await fetchGeminiResponse(geminiKey, userInput);

        console.log('User Input:', userInput);
        console.log('Gemini Response:', geminiResponse);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
