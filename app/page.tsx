'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Editor from 'react-simple-wysiwyg';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';

import { LogOut, Moon, Settings, Sun, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMyContext } from '@/contexts/MyContext';
import axiosToken from '@/apis/axiosToken';

import Cookies from 'js-cookie';
import Image from 'next/image';

import sex_3_logo from '../public/sex_3.jpg';
import HomeBannerSlider from '@/components/HomeBannerSlider/HomeBannerSlider';
import HomeBannerImage from '@/components/HomeBannerImage/HomeBannerImage';

import slider2 from '../public/slider_2.png';
import slider3 from '../public/slider_3.jpg';
import HomeBlogsItem from '@/components/HomeBlogsItem';
import { useEffect, useState } from 'react';
import axiosClient from '@/apis/axiosClient';
import { AxiosError } from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { fetchBlogs } from '@/redux/blogSlice';

type AddBlog = {
    name: string;
    description: string;
    images: Array<string | { file: File; preview: string }>;
};

function HomePage() {
    const { setTheme } = useTheme();
    const { userInfo, setIsLogin, openAlertBox } = useMyContext();
    const router = useRouter();

    const { blogs } = useSelector((state: RootState) => state.blog);
    const dispatch = useDispatch();

    const [html, setHtml] = useState<string>('');
    const [formFields, setFormFields] = useState<AddBlog>({
        name: '',
        description: '',
        images: [],
    });
    const [isLoadingAddBlog, setIsLoadingAddBlog] = useState<boolean>(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        const getBlogs = async () => {
            const { data } = await axiosClient.get('/api/blog/get_all_blogs');
            console.log('blogs: ', data);
            if (data?.success) {
                dispatch(fetchBlogs(data?.blogs));
            }
        };
        getBlogs();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormFields(() => {
            return {
                ...formFields,
                [name]: value,
            };
        });
    };

    const handleSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const imageObj = {
            file,
            preview: URL.createObjectURL(file),
        };

        setFormFields((prev) => ({
            ...prev,
            images: [imageObj], // Ghi đè, chỉ giữ 1 ảnh duy nhất
        }));
    };

    const handleChangeDescription = (e: { target: { value: string } }) => {
        const value = e.target.value;
        setHtml(value);
        setFormFields((prev) => ({
            ...prev,
            description: value,
        }));
    };

    const handleAddBlog = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsLoadingAddBlog(true);
        try {
            const formData = new FormData();
            formData.append('name', formFields.name);
            formData.append('description', formFields.description);

            formFields.images
                .filter((img): img is { file: File; preview: string } => typeof img !== 'string')
                .forEach((img) => {
                    formData.append('images', img.file);
                });

            console.log('formFields: ', JSON.parse(JSON.stringify(formFields)));
            console.log('formData: ', JSON.parse(JSON.stringify(formData)));

            const { data } = await axiosClient.post('/api/blog/create', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('dataAdd : ', data);
            if (data.success) {
                openAlertBox('success', data.message);
                setIsDialogOpen(false);
                setFormFields({ name: '', description: '', images: [] });
                setHtml('');
            }
        } catch (err) {
            const error = err as AxiosError<{ message: string }>;
            const errorMsg = error.response?.data?.message || 'Đã có lỗi xảy ra';

            console.error('Add blog error:', errorMsg);
            openAlertBox('error', errorMsg);
        } finally {
            setIsLoadingAddBlog(false);
        }
    };

    const handleLogout = async () => {
        try {
            const { data } = await axiosToken.post('/api/user/logout', {
                withCredentials: true,
            });

            if (data.success) {
                Cookies.remove('access_token');
                setIsLogin(false);
                openAlertBox('success', data.message);
                router.push('/login');
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
        <div className=" w-full h-dvh bg-background">
            {/* Header */}
            <header className="fixed w-full top-0 z-50 py-4 px-12 xl:px-25 flex items-center justify-between bg-muted shadow-md border-b border-border">
                <div className="flex items-center gap-2 ">
                    <Link href="/">
                        <Image
                            className="object-cover rounded-sm "
                            src={sex_3_logo}
                            alt="logo"
                            width={90}
                            height={90}
                        />
                    </Link>
                    <span className="text-[19px] font-[600] ">Chatbot giáo dục giới tính</span>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline">
                        <Link href="/">Trang chủ</Link>
                    </Button>
                    <Button variant="outline">
                        <Link href="/new-conversation">Nhắn tin cùng AI</Link>
                    </Button>
                    <Button variant="outline">
                        <Link href="/video-agent-voice">Trò chuyện cùng AI</Link>
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="cursor-pointer">
                                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span className="sr-only">Toggle theme</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* USER MENU */}
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Avatar className="cursor-pointer">
                                <AvatarImage src={userInfo?.avatar} />
                                <AvatarFallback>{userInfo?.name}</AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent sideOffset={10}>
                            <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">
                                <User className="h-[19px] w-[19px] mr-2" />
                                Thông tin cá nhân
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                                <Settings className="h-[19px] w-[19px] mr-2" />
                                Cài đặt
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" className="cursor-pointer">
                                <div className="flex gap-2 items-center" onClick={handleLogout}>
                                    <LogOut className="h-[19px] w-[19px] mr-2" />
                                    Đăng xuất
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            <main className="mt-45 h-full">
                {/* Navigate to Chatbot */}
                <div className="max-w-5xl mx-auto mt-10 px-6 py-8 bg-white rounded-xl shadow-md text-center space-y-4">
                    <h2 className="text-[24px] font-[700]">🎉 Chào mừng bạn đến với</h2>
                    <h1 className="text-[30px] font-[600] text-green-600">Hệ thống Chatbot giáo dục giới tính!</h1>
                    <p className="text-gray-500 text-[14px]">Hãy trải nghiệm ngay với một vài câu hỏi của bạn.</p>
                    <Button
                        onClick={() => router.push('/new-conversation')}
                        className="cursor-pointer bg-green-600 hover:bg-green-700 text-white"
                    >
                        🌟 Thử ngay
                    </Button>
                </div>

                {/* Slider and Banner */}
                <div className="my-8 mx-1 bg-white">
                    <div className="container flex flex-col lg:flex-row gap-2 lg:gap-1">
                        <div className="part1 w-full lg:w-[70%] lg:h-[230px]">
                            <HomeBannerSlider />
                        </div>
                        <div className="part2 w-full lg:w-[30%] lg:h-[230px] flex items-center gap-2 lg:gap-1 justify-between flex-row lg:flex-col">
                            <HomeBannerImage image={slider2} />
                            <HomeBannerImage image={slider3} />
                        </div>
                    </div>
                </div>

                {/* Add Blog Modal */}
                <div className="max-w-5xl mx-auto mt-12 px-6 py-8 bg-white rounded-xl shadow-md text-center space-y-4">
                    <h1 className="text-[30px] font-[600] text-blue-600">Thêm bài viết</h1>
                    <p className="text-gray-500 text-[14px]">
                        Bạn hoàn toàn có thể nêu lên suy nghĩ của mình về giáo dục giới tính
                    </p>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <form>
                            <DialogTrigger asChild>
                                <Button
                                    onClick={() => setIsDialogOpen(true)}
                                    className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    🌟 Tạo bài viết
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[800px] w-full overflow-hidden">
                                <div className="max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Tạo bài viết</DialogTitle>
                                        <DialogDescription>
                                            Hãy nhập các thông tin bên dưới để thêm bài viết
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 mt-4">
                                        <div className="grid gap-3">
                                            <Label htmlFor="images">Hình ảnh</Label>
                                            <Input
                                                id="images"
                                                type="file"
                                                onChange={handleSelectImage}
                                                accept="image/*"
                                            />
                                        </div>
                                        <div className="grid gap-3">
                                            <Label htmlFor="name">Tên bài viết</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={formFields.name}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="grid gap-3">
                                            <Label htmlFor="description">Nội dung bài viết</Label>
                                            <Editor
                                                value={html}
                                                containerProps={{ style: { resize: 'vertical' } }}
                                                onChange={handleChangeDescription}
                                            ></Editor>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button className="cursor-pointer" variant="outline">
                                                Quay lại
                                            </Button>
                                        </DialogClose>

                                        <Button className="cursor-pointer" onClick={handleAddBlog}>
                                            {isLoadingAddBlog ? 'Loading....' : 'Tạo bài viết'}
                                        </Button>
                                    </DialogFooter>
                                </div>
                            </DialogContent>
                        </form>
                    </Dialog>
                </div>

                {/* Blogs List */}
                {blogs?.length !== 0 && (
                    <div className="blogSection mt-10 py-5 pb-8 pt-0 bg-white">
                        <div className="container">
                            <h2 className="text-[14px] sm:text-[14px] md:text-[16px] lg:text-[20px] font-[600] mb-4">
                                Bài viết mới nhất
                            </h2>
                            <Swiper
                                slidesPerView={4}
                                spaceBetween={30}
                                navigation={true}
                                modules={[Navigation, FreeMode]}
                                freeMode={true}
                                breakpoints={{
                                    250: {
                                        slidesPerView: 1,
                                        spaceBetween: 10,
                                    },
                                    300: {
                                        slidesPerView: 2,
                                        spaceBetween: 10,
                                    },
                                    530: {
                                        slidesPerView: 3,
                                        spaceBetween: 10,
                                    },
                                    600: {
                                        slidesPerView: 3,
                                        spaceBetween: 10,
                                    },
                                    800: {
                                        slidesPerView: 4,
                                        spaceBetween: 10,
                                    },
                                    990: {
                                        slidesPerView: 4,
                                        spaceBetween: 10,
                                    },
                                    1100: {
                                        slidesPerView: 6,
                                        spaceBetween: 20,
                                    },
                                }}
                                className="blogSwiper"
                            >
                                {blogs?.map((blog, index) => {
                                    return (
                                        <SwiperSlide key={index}>
                                            <HomeBlogsItem blog={blog} />
                                        </SwiperSlide>
                                    );
                                })}
                            </Swiper>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
export default HomePage;

// export const blogs = [
//     {
//         _id: '1',
//         name: 'Hiểu về tuổi dậy thì: Cơ thể bạn thay đổi ra sao?',
//         images: ['/slider_2.png'],
//         description:
//             '<p>Dậy thì là một giai đoạn quan trọng. Cơ thể bạn sẽ trải qua nhiều thay đổi, từ thể chất đến tâm lý.</p>',
//         createdAt: '2025-07-25T08:00:00Z',
//     },
//     {
//         _id: '2',
//         name: '5 điều bạn nên biết về sức khỏe sinh sản',
//         images: ['/slider_2.png'],
//         description:
//             '<p>Sức khỏe sinh sản không chỉ là vấn đề của người lớn. Học sinh cũng cần hiểu để tự bảo vệ bản thân.</p>',
//         createdAt: '2025-07-27T10:30:00Z',
//     },
//     {
//         _id: '3',
//         name: 'Tình bạn và tình yêu ở tuổi học trò',
//         images: ['/slider_2.png'],
//         description: '<p>Phân biệt tình bạn và tình yêu là điều quan trọng giúp bạn có các mối quan hệ lành mạnh.</p>',
//         createdAt: '2025-07-29T14:15:00Z',
//     },
//     {
//         _id: '4',
//         name: 'Làm gì khi bị quấy rối nơi công cộng?',
//         images: ['/slider_2.png'],
//         description:
//             '<p>Trang bị kiến thức và kỹ năng tự vệ là điều cần thiết để bảo vệ chính mình trước nguy cơ bị xâm hại.</p>',
//         createdAt: '2025-07-30T18:45:00Z',
//     },
//     {
//         _id: '5',
//         name: 'Giới tính và bản dạng giới: Đừng nhầm lẫn!',
//         images: ['/slider_2.png'],
//         description:
//             '<p>Giới tính không chỉ có nam và nữ. Hãy cùng tìm hiểu về sự đa dạng giới trong xã hội hiện đại.</p>',
//         createdAt: '2025-07-31T21:00:00Z',
//     },
//     {
//         _id: '6',
//         name: 'Giới tính và bản dạng giới: Đừng nhầm lẫn!',
//         images: ['/slider_2.png'],
//         description:
//             '<p>Giới tính không chỉ có nam và nữ. Hãy cùng tìm hiểu về sự đa dạng giới trong xã hội hiện đại.</p>',
//         createdAt: '2025-07-31T21:00:00Z',
//     },
//     {
//         _id: '7',
//         name: 'Giới tính và bản dạng giới: Đừng nhầm lẫn!',
//         images: ['/slider_2.png'],
//         description:
//             '<p>Giới tính không chỉ có nam và nữ. Hãy cùng tìm hiểu về sự đa dạng giới trong xã hội hiện đại.</p>',
//         createdAt: '2025-07-31T21:00:00Z',
//     },
// ];
