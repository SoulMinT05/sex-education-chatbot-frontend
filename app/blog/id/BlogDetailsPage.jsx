'use client';

import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import axiosClient from '../../../apis/axiosClient';
import DOMPurify from 'dompurify';
import { Breadcrumbs } from '@mui/material';

import { MyContext } from '../../App';

import './BlogDetailsPage.scss';

const BlogDetailsPage = () => {
    const { id } = useParams();
    const context = useContext(MyContext);

    const [excludedBlogs, setExcludedBlogs] = useState([]);
    const [blogDetails, setBlogDetails] = useState({});

    useEffect(() => {
        const getExcludedBlogs = async () => {
            const { data } = await axiosClient.get(`/api/blog/all-blogs?excludeId=${id}`);
            console.log('excludeBlogs: ', data);
            if (data?.success) {
                setExcludedBlogs(data?.blogs);
            }
        };
        getExcludedBlogs();
    }, []);

    useEffect(() => {
        const getBlogDetails = async () => {
            const { data } = await axiosClient.get(`/api/blog/${id}`);
            console.log('details: ', data);
            if (data?.success) {
                setBlogDetails(data?.blog);
            }
        };
        getBlogDetails();
    }, [id]);

    const sanitizedDescription = DOMPurify.sanitize(blogDetails?.description, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'span', 'img'],
        ALLOWED_ATTR: ['src', 'alt', 'title', 'width', 'height', 'style'],
    });

    return (
        <section className="py-3 lg:py-8 w-full">
            <div className="pb-2 pt-0 container  flex items-center justify-between">
                <Breadcrumbs aria-label="breadcrumb">
                    <Link
                        underline="hover"
                        color="inherit"
                        to="/"
                        className="link transition !text-[14px] !lg:!text-[16px]"
                    >
                        Trang chủ
                    </Link>
                    <Link
                        underline="hover"
                        color="inherit"
                        to={`/blog/${blogDetails?._id}`}
                        className="link transition !text-[14px] !lg:!text-[16px]"
                    >
                        Chi tiết bài viết
                    </Link>
                </Breadcrumbs>
            </div>
            <div className="container flex flex-col lg:flex-row gap-5">
                {blogDetails && (
                    <div className="leftCol w-full lg:w-[70%]">
                        {Array.isArray(blogDetails?.images) && blogDetails?.images[0] && (
                            <img
                                src={blogDetails?.images[0]}
                                alt=""
                                className="w-full image_banner h-[400px] lg:h-[780px] xl:h-[900px] object-cover rounded-md mb-4"
                            />
                        )}
                        <h1 className="text-[18px] lg:text-[20px] mb-3">{blogDetails?.name}</h1>
                        <div
                            className="w-full description-content"
                            style={{ maxWidth: '100%', wordWrap: 'break-word' }}
                            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                        />
                    </div>
                )}

                {/* ✅ Chỉ 1 rightCol */}
                {excludedBlogs?.length > 0 && (
                    <div className="rightCol w-full lg:w-[40%] flex flex-col gap-3">
                        {context?.windowWidth < 1024 && <h1 className="text-[18px]">Bài viết liên quan</h1>}
                        {excludedBlogs.map((blog) => (
                            <Link to={`/blog/${blog?._id}`} key={blog?._id}>
                                <div className="flex items-center gap-3">
                                    <div className="img w-[30%] overflow-hidden rounded-md group">
                                        <img
                                            src={blog?.images[0]}
                                            alt=""
                                            className="w-full h-[170px] sm:h-[220px] md:h-[280px] lg:h-[128px] xl:h-[150px] object-cover group-hover:scale-105 transition-all"
                                        />
                                    </div>
                                    <h3 className="text-[14px] w-[60%] line-clamp-2 link transition-all">
                                        {blog?.name}
                                    </h3>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default BlogDetailsPage;
