import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

// 最大文件大小限制：1MB
const MAX_CONTENT_SIZE = 1 * 1024 * 1024;

// 获取单个文档
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = params;

        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    }
                }
            }
        });

        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        // 检查访问权限
        if (!post.isPublic && (!session?.user?.id || post.authorId !== session.user.id)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json(post);
    } catch (error) {
        console.error('Get post error:', error);
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
}

// 更新文档
export async function PUT(
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

        const post = await prisma.post.findUnique({
            where: { id },
        });

        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        // 检查是否是作者
        if (post.authorId !== session.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { title, content, isPublic } = await request.json();

        // 如果更新内容，检查大小
        if (content) {
            const contentSize = new Blob([content]).size;
            if (contentSize > MAX_CONTENT_SIZE) {
                return NextResponse.json(
                    { error: 'Content size exceeds the 1MB limit' },
                    { status: 400 }
                );
            }
        }

        // 更新文档
        const updatedPost = await prisma.post.update({
            where: { id },
            data: {
                title,
                content,
                isPublic,
            },
        });

        return NextResponse.json(updatedPost);
    } catch (error) {
        console.error('Update post error:', error);
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
}

// 删除文档
export async function DELETE(
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

        const post = await prisma.post.findUnique({
            where: { id },
        });

        if (!post) {
            return NextResponse.json(
                { error: 'Post not found' },
                { status: 404 }
            );
        }

        // 检查是否是作者
        if (post.authorId !== session.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await prisma.post.delete({
            where: { id },
        });

        return NextResponse.json(
            { message: 'Post deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Delete post error:', error);
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
} 