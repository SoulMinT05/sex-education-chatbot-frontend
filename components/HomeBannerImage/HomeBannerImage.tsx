'use client';

import React from 'react';
import './HomeBannerImage.scss';
import Image, { StaticImageData } from 'next/image';

const HomeBannerImage = ({ image }: { image: string | StaticImageData }) => {
    return (
        <div className="lg:h-[210px] w-full overflow-hidden rounded-md group relative">
            <Image
                src={image}
                alt=""
                className="w-full lg:h-[115px] object-cover transition-all duration-150 group-hover:scale-105"
            />
        </div>
    );
};

export default HomeBannerImage;
