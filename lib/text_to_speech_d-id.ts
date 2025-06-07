import fetch from 'node-fetch';
import base64 from 'base-64';
import fs from 'fs/promises';

interface DidCredits {
    remaining: number;
    total: number;
    [key: string]: unknown;
}

async function getDidCredits(apiKey: string): Promise<DidCredits> {
    const url = 'https://api.d-id.com/credits';
    const authString = apiKey + ':';
    const base64AuthString = base64.encode(authString);

    const headers = {
        accept: 'application/json',
        Authorization: `Basic ${base64AuthString}`,
    };

    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error(`D-ID API error: ${response.status} ${response.statusText}`);
    }
    const data: DidCredits = await response.json();
    return data;
}

async function main() {
    try {
        // Đọc file api.json dạng JSON
        const apiKeyJsonRaw = await fs.readFile('/api.json', 'utf8');
        const apiKeyJson = JSON.parse(apiKeyJsonRaw);
        const apiKey: string = apiKeyJson.key;

        const didCredits = await getDidCredits(apiKey);
        const creditsSummary = {
            remaining: didCredits.remaining,
            total: didCredits.total,
        };
        console.log('Credits Summary:', creditsSummary);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
