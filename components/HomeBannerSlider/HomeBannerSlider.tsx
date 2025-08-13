'use client';

import React from 'react';

import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { EffectFade, Navigation, Pagination, Autoplay } from 'swiper/modules';

import './HomeBannerSlider.scss';
import Image from 'next/image';

import slider1 from '../../public/slider_1.jpg';
import slider2 from '../../public/slider_2.jpg';
import slider3 from '../../public/slider_3.jpg';
import slider4 from '../../public/slider_4.jpg';

const HomeBannerSlider = () => {
    return (
        <Swiper
            loop={true}
            spaceBetween={30}
            effect={'fade'}
            navigation={true}
            modules={[EffectFade, Navigation, Pagination, Autoplay]}
            pagination={{
                clickable: true,
            }}
            autoplay={{
                delay: 2500,
                disableOnInteraction: false,
            }}
            className="homeBannerSlider"
        >
            <SwiperSlide>
                <div className="item w-full rounded-md overflow-hidden relative">
                    <Image width={1600} height={400} src={slider1} className="lg:h-[400px] w-full" alt="slider" />
                </div>
            </SwiperSlide>
            <SwiperSlide>
                <div className="item w-full rounded-md overflow-hidden">
                    <Image width={1600} height={400} src={slider2} className="lg:h-[400px] w-full" alt="slider" />
                </div>
            </SwiperSlide>
            <SwiperSlide>
                <div className="item w-full rounded-md overflow-hidden">
                    <Image width={1600} height={400} src={slider3} className="lg:h-[400px] w-full" alt="slider" />
                </div>
            </SwiperSlide>
            <SwiperSlide>
                <div className="item w-full rounded-md overflow-hidden">
                    <Image width={1600} height={400} src={slider4} className="lg:h-[400px] w-full" alt="slider" />
                </div>
            </SwiperSlide>
            <SwiperSlide>
                <div className="item w-full rounded-md overflow-hidden">
                    <Image
                        width={1600}
                        height={400}
                        src="https://i.pinimg.com/1200x/7a/f0/55/7af055d5a9287d1335d38f28ad42aa59.jpg"
                        className="lg:h-[400px] w-full"
                        alt="slider"
                    />
                </div>
            </SwiperSlide>
        </Swiper>
    );
};

export default HomeBannerSlider;
