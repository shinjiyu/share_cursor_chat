import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = params;

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { type } = await request.json();

        if (!['UP', 'DOWN'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid vote type' },
                { status: 400 }
            );
        }

        // 检查文档是否存在且是公开的
        const post = await prisma.post.findUnique({
            where: { id },
        });

        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        if (!post.isPublic) {
            return NextResponse.json(
                { error: 'Cannot vote on private posts' },
                { status: 400 }
            );
        }

        // 检查用户是否已经投票
        const existingVote = await prisma.vote.findUnique({
            where: {
                postId_userId: {
                    postId: id,
                    userId: session.user.id,
                }
            }
        });

        // 开始事务处理
        const result = await prisma.$transaction(async (tx) => {
            // 如果已经投过票
            if (existingVote) {
                // 如果是相同的投票类型，则取消投票
                if (existingVote.type === type) {
                    await tx.vote.delete({
                        where: { id: existingVote.id }
                    });

                    // 更新计数
                    return await tx.post.update({
                        where: { id },
                        data: {
                            upvotes: type === 'UP'
                                ? { decrement: 1 }
                                : undefined,
                            downvotes: type === 'DOWN'
                                ? { decrement: 1 }
                                : undefined,
                        },
                    });
                }

                // 如果是不同的投票类型，则更改投票
                await tx.vote.update({
                    where: { id: existingVote.id },
                    data: { type }
                });

                // 更新计数
                return await tx.post.update({
                    where: { id },
                    data: {
                        upvotes: type === 'UP'
                            ? { increment: 1 }
                            : { decrement: 1 },
                        downvotes: type === 'DOWN'
                            ? { increment: 1 }
                            : { decrement: 1 },
                    },
                });
            }

            // 如果是新投票
            await tx.vote.create({
                data: {
                    type,
                    postId: id,
                    userId: session.user.id,
                }
            });

            // 更新计数
            return await tx.post.update({
                where: { id },
                data: {
                    upvotes: type === 'UP'
                        ? { increment: 1 }
                        : undefined,
                    downvotes: type === 'DOWN'
                        ? { increment: 1 }
                        : undefined,
                },
            });
        });

        // 获取用户当前的投票状态
        const currentVote = await prisma.vote.findUnique({
            where: {
                postId_userId: {
                    postId: id,
                    userId: session.user.id,
                }
            }
        });

        return NextResponse.json({
            ...result,
            userVote: currentVote?.type || null,
        });
    } catch (error) {
        console.error('Vote error:', error);
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
} 