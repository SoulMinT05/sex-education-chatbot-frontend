'use client';

import React from 'react';

import { IoMdTime } from 'react-icons/io';
import { IoIosArrowForward } from 'react-icons/io';

// import DOMPurify from 'dompurify';
// import * as DOMPurify from 'dompurify';
import DOMPurify from 'isomorphic-dompurify';
import Link from 'next/link';
import Image from 'next/image';

type Blog = {
    _id: string;
    name: string;
    images: string[];
    description: string;
    created_at: string | Date;
};

function formatDate(dateString: string | Date) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

const HomeBlogsItem = ({ blog }: { blog: Blog }) => {
    const sanitizedDescription = DOMPurify.sanitize(blog?.description, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'span'],
    });

    return (
        <div className="blogItem group">
            <Link href={`/blog/${blog?._id}`}>
                <div className="imgWrapper w-full overflow-hidden rounded-md cursor-pointer relative">
                    {blog?.images[0] ? (
                        <Image
                            width={400}
                            height={220}
                            src={blog?.images[0]}
                            alt="Blog Image"
                            className="w-full h-[220px] object-cover transition-all group-hover:scale-105 group-hover:rotate-1"
                        />
                    ) : (
                        <div className="w-full h-[220px] bg-gray-200 flex items-center justify-center text-gray-500 text-sm italic">
                            Không có ảnh
                        </div>
                    )}
                    <div
                        className="flex items-center justify-center text-white absolute bottom-[15px] right-[15px] z-50 bg-primary rounded-md p-1 text-[11px] font-[500]
                    gap-1"
                    >
                        <IoMdTime className="text-[13px] lg:text-[16px]" />
                        <span>{formatDate(blog?.created_at)}</span>
                    </div>
                </div>
            </Link>
            <div className="info py-4">
                <h2 className="text-[12px] lg:text-[14px] font-[600] text-black mb-1 lg:mb-3 line-clamp-1">
                    <Link href={`/blog/${blog?._id}`} className="link">
                        {blog?.name}
                    </Link>
                </h2>
                <div
                    className="line-clamp-2 mb-4 text-[12px] lg:text-[13px]"
                    dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                />
                <Link
                    href={`/blog/${blog?._id}`}
                    className="link hover:text-blue-400 font-[500] text-[12px] lg:text-[13px] flex items-center gap-1"
                >
                    Xem thêm <IoIosArrowForward />
                </Link>
            </div>
        </div>
    );
};

export default HomeBlogsItem;
