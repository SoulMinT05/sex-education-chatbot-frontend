import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    blogs: [],
};

const blogSlice = createSlice({
    name: 'blog',
    initialState,
    reducers: {
        fetchBlogs: (state, action) => {
            state.blogs = action.payload;
        },
    },
});

export const { fetchBlogs } = blogSlice.actions;

export default blogSlice.reducer;
