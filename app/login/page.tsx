'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';

import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { firebaseApp } from '@/services/firebase';
import axiosAuth from '@/apis/axiosAuth';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useMyContext } from '@/contexts/MyContext';
import { Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
    const auth = getAuth(firebaseApp);
    const googleProvider = new GoogleAuthProvider();

    const { setIsLogin, openAlertBox } = useMyContext();

    const [isShowPassword, setIsShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formFields, setFormFields] = useState({
        email: '',
        password: '',
    });

    //  const context = useContext(MyContext);
    const router = useRouter(); // ✅ Thay cho useNavigate()

    // Điều kiện kiểm tra form
    const validateValue = Object.values(formFields).every((el) => el);

    // Xử lý thay đổi form
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormFields((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Xử lý chuyển hướng Forgot Password
    // const forgotPassword = () => {
    //     router.push('/forgot-password');
    // };

    // Xử lý Login
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!validateValue) {
                openAlertBox('error', 'Vui lòng điền đầy đủ thông tin!');
                return;
            }

            const { data } = await axiosAuth.post('/api/user/login', formFields);
            if (data.success) {
                openAlertBox('success', data.message);

                Cookies.set('accessToken', data?.data?.accessToken);
                setIsLogin(true);

                router.push('/'); // ✅ Thay cho navigate('/')
            } else {
                openAlertBox('error', data.message);
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Lỗi đăng nhập:', error.message);
            } else {
                console.error('Lỗi đăng nhập:', error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // // Đăng nhập với Google
    const handleAuthWithGoogle = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const fields = {
                name: user?.providerData[0]?.displayName,
                email: user?.providerData[0]?.email,
                password: null,
                avatar: user?.providerData[0]?.photoURL,
                phoneNumber: user?.providerData[0]?.phoneNumber,
                role: 'user',
            };
            const { data } = await axiosAuth.post('/api/user/auth-google', fields);
            if (data.success) {
                openAlertBox('success', data.message);
                Cookies.set('accessToken', data?.data?.accessToken);
                setIsLogin(true);
                router.push('/'); // ✅ Thay cho navigate('/')
            } else {
                openAlertBox('error', data.message);
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Lỗi đăng nhập:', error.message);
            } else {
                console.error('Lỗi đăng nhập:', error);
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen w-full">
            <Card className="w-full max-w-md md:max-w-lg mx-auto">
                <CardHeader className="text-center">
                    <CardTitle>Đăng nhập</CardTitle>
                    <CardDescription>Đăng nhập bằng email và password</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin}>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    name="email"
                                    value={formFields.email}
                                    disabled={isLoading === true ? true : false}
                                    onChange={handleChange}
                                    type="email"
                                    id="email"
                                    required
                                />
                            </div>
                            <div className="grid gap-2 relative">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    name="password"
                                    value={formFields.password}
                                    disabled={isLoading === true ? true : false}
                                    onChange={handleChange}
                                    type={isShowPassword === false ? 'password' : 'text'}
                                    id="password"
                                    required
                                />
                                <Button
                                    variant="ghost"
                                    className="!absolute top-[22px] right-[6px] z-50 !w-[35px] !h-[35px] !min-w-[35px] !rounded-full"
                                    onClick={(e: React.FormEvent) => {
                                        e.preventDefault();
                                        setIsShowPassword(!isShowPassword);
                                    }}
                                >
                                    {isShowPassword === false ? (
                                        <Eye className="text-[20px] opacity-75" />
                                    ) : (
                                        <EyeOff className="text-[20px] opacity-75" />
                                    )}
                                </Button>
                            </div>

                            <div className="flex justify-between items-center">
                                <label className="flex items-center text-sm">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="ml-2">Remember me</span>
                                </label>
                                <Link href="forgot-password" className="text-sm underline-offset-4 hover:underline">
                                    Quên mật khẩu?
                                </Link>
                            </div>
                            <Button type="submit" className="w-full cursor-pointer">
                                Đăng nhập
                            </Button>
                            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                                    Hoặc tiếp tục bằng
                                </span>
                            </div>
                            <div className="flex flex-col gap-4">
                                <Button
                                    onClick={handleAuthWithGoogle}
                                    className="w-full cursor-pointer flex gap-3 border  bg-white text-black hover:bg-gray-100"
                                >
                                    <FcGoogle className="icon-google text-[20px]" />
                                    Đăng nhập bằng Google
                                </Button>
                            </div>
                            <p className="text-center text-sm font-light">
                                Chưa có tài khoản?
                                <Link href="/register" className="font-medium text-gray-900 hover:underline">
                                    Đăng ký
                                </Link>
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginPage;
