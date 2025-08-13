// import type { NextConfig } from 'next';

// const nextConfig: NextConfig = {
//     /* config options here */
//     images: {
//         remotePatterns: [
//             {
//                 protocol: 'https',
//                 hostname: 'lh3.googleusercontent.com',
//                 pathname: '/**',
//             },
//         ],
//     },
// };

// export default nextConfig;

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'marketplace.canva.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'i.pinimg.com',
                pathname: '/**',
            },
        ],
    },
};

export default nextConfig;
