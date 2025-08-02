import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './index.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

// import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { MyContextProvider } from '@/contexts/MyContext';
import { Toaster } from '@/components/ui/sonner';
import MainLayout from '@/components/MainLayout';
import ReduxProvider from '@/providers/ReduxProvider';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Sex Education Chatbot',
    description: 'Sex Education Chatbot by Tam Nguyen',
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // const cookieStore = await cookies();
    // const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

    const headersList = await headers();
    // const domain = headersList.get('x-forwarded-host') || 'localhost:3000';
    // const protocol = headersList.get('x-forwarded-proto') || 'http';

    const referer = headersList.get('referer') || '';
    const pathname = referer ? new URL(referer).pathname : '/login'; // 'login
    console.log('pathname: ', pathname);
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex`}>
                <ReduxProvider>
                    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                        <MyContextProvider>
                            <MainLayout>{children}</MainLayout>
                            <Toaster position="top-right" />
                        </MyContextProvider>
                    </ThemeProvider>
                </ReduxProvider>
            </body>
        </html>
    );
}
