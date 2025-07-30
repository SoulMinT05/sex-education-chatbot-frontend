'use client';

import { useMyContext } from "@/contexts/MyContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function HomePage() {
    const { isLogin } = useMyContext(); // 👈 Lấy trạng thái đăng nhập từ Context
    const router = useRouter()
        // 👇 Thực hiện redirect nếu không đăng nhập mà cố vào trang chính
        useEffect(() => {
            if (!isLogin) {
                router.push('/login')
            }
        }, []);

    return (
        <main className="w-full h-dvh bg-background">
            <div className="max-w-4xl mx-auto h-full">
                <h1>Hi</h1>
            </div>
        </main>
    );
}
export default HomePage;
