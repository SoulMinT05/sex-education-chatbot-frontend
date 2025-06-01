// export const runtime = 'nodejs';

// import { NextResponse } from 'next/server';
// import { loadOrCreateVectorStore } from '@/utils/load-pdf'; // Đường dẫn file bạn lưu

// export async function POST(request: Request) {
//     try {
//         const body = await request.json();
//         console.log('BODY:', body);

//         const query = body.query;
//         console.log('QUERY:', query);

//         if (!query) {
//             return NextResponse.json({ error: 'Missing query' }, { status: 400 });
//         }

//         // Load hoặc tạo vector store
//         const vectorStore = await loadOrCreateVectorStore();

//         // Tìm kiếm k gần nhất (vd 3 kết quả)
//         const results = await vectorStore.similaritySearch(query, 3);
//         console.log('RESULTS: ', results);
//         return NextResponse.json({ results }, { status: 200 });
//     } catch (error) {
//         console.error('API Error:', error);
//         return NextResponse.json({ error: (error as Error).message }, { status: 500 });
//     }
// }
