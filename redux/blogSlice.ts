import { createSlice } from '@reduxjs/toolkit';

type Blog = {
    _id: string;
    name: string;
    images: string[];
    description: string;
    created_at: string | Date;
};

type BlogState = {
    blogs: Blog[];
};

const initialState: BlogState = {
    blogs: [],
};

const blogSlice = createSlice({
    name: 'blog',
    initialState,
    reducers: {
        fetchBlogs: (state, action) => {
            state.blogs = action.payload;
        },
        addBlogs: (state, action) => {
            state.blogs.unshift(action.payload);
        },
    },
});

export const { fetchBlogs, addBlogs } = blogSlice.actions;

export default blogSlice.reducer;
