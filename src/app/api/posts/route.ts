import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

// 最大文件大小限制：1MB
const MAX_CONTENT_SIZE = 1 * 1024 * 1024; // 1MB in bytes

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { title, content, isPublic = false } = await request.json();

        // 验证必填字段
        if (!title || !content) {
            return NextResponse.json(
                { error: 'Title and content are required' },
                { status: 400 }
            );
        }

        // 检查内容大小
        const contentSize = new Blob([content]).size;
        if (contentSize > MAX_CONTENT_SIZE) {
            return NextResponse.json(
                { error: 'Content size exceeds the 1MB limit' },
                { status: 400 }
            );
        }

        // 创建文档
        const post = await prisma.post.create({
            data: {
                title,
                content,
                isPublic,
                authorId: session.user.id,
            },
        });

        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        console.error('Create post error:', error);
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const isPublic = searchParams.get('isPublic') === 'true';

        const skip = (page - 1) * limit;

        let where = {};

        if (session?.user?.id) {
            // 已登录用户：显示自己的所有文档和其他人的公开文档
            where = {
                OR: [
                    { authorId: session.user.id },
                    { isPublic: true }
                ]
            };
        } else {
            // 未登录用户：只显示公开文档
            where = { isPublic: true };
        }

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    content: true,
                    isPublic: true,
                    createdAt: true,
                    updatedAt: true,
                    author: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        }
                    }
                }
            }),
            prisma.post.count({ where })
        ]);

        return NextResponse.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get posts error:', error);
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
} 