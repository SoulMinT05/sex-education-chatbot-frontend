'use client';

import React from 'react';

import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { EffectFade, Navigation, Pagination, Autoplay } from 'swiper/modules';

import slider1 from '../../public/slider_1.jpg';
import slider2 from '../../public/slider_2.png';

import './HomeBannerSlider.scss';
import Image from 'next/image';

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
                    <Image width={1600} height={230} src={slider1} className="lg:h-[230px] w-full" alt="slider" />
                </div>
            </SwiperSlide>
            <SwiperSlide>
                <div className="item w-full rounded-md overflow-hidden">
                    <Image width={1600} height={230} src={slider2} className="lg:h-[230px] w-full" alt="slider" />
                </div>
            </SwiperSlide>
        </Swiper>
    );
};

export default HomeBannerSlider;
