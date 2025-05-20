'use client';

import ChatbotUser from '@/components/ChatbotUser';

function HomePage() {
    return (
        <main className="w-full h-dvh bg-background">
            <div className="max-w-4xl mx-auto h-full">
                <ChatbotUser />
            </div>
        </main>
    );
}
export default HomePage;
