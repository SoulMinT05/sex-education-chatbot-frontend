'use client';

import { Button } from '@/components/ui/button';
import { useMyContext } from '@/contexts/MyContext';

function Home() {
    const { openAlertBox } = useMyContext();
    return (
        <div className="h-screen flex items-center justify-center">
            <Button onClick={() => openAlertBox('success', 'Bạn đã click nút!')}>Click me!</Button>
        </div>
    );
}
export default Home;
