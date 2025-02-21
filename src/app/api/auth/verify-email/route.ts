import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        // 查找验证记录
        const verification = await prisma.emailVerification.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!verification) {
            return NextResponse.json(
                { error: 'Invalid verification token' },
                { status: 400 }
            );
        }

        // 检查是否过期
        if (verification.expiresAt < new Date()) {
            await prisma.emailVerification.delete({
                where: { id: verification.id },
            });
            return NextResponse.json(
                { error: 'Verification token has expired' },
                { status: 400 }
            );
        }

        // 更新用户验证状态
        await prisma.user.update({
            where: { id: verification.userId },
            data: { emailVerified: new Date() },
        });

        // 删除验证记录
        await prisma.emailVerification.delete({
            where: { id: verification.id },
        });

        return NextResponse.json(
            { message: 'Email verified successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Email verification error:', error);
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
} 