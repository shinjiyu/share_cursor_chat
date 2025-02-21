import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        // 只获取公开的文档
        const where = { isPublic: true };

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                orderBy: [
                    { upvotes: 'desc' },
                    { createdAt: 'desc' }
                ],
                skip,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    content: true,
                    isPublic: true,
                    createdAt: true,
                    updatedAt: true,
                    upvotes: true,
                    downvotes: true,
                    author: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        }
                    },
                    votes: session?.user?.id ? {
                        where: {
                            userId: session.user.id
                        },
                        select: {
                            type: true
                        }
                    } : false
                }
            }),
            prisma.post.count({ where })
        ]);

        // 处理投票信息
        const postsWithVotes = posts.map(post => ({
            ...post,
            userVote: post.votes?.[0]?.type || null,
            votes: undefined // 移除votes字段
        }));

        return NextResponse.json({
            posts: postsWithVotes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get public posts error:', error);
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
} 