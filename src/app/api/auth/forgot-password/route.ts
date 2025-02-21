import { prisma } from '@/lib/db/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // 查找用户
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // 即使用户不存在也返回成功
        // 这是一个安全最佳实践，防止用户枚举
        if (!user) {
            return NextResponse.json(
                { message: 'If an account exists with this email, a password reset link has been sent.' },
                { status: 200 }
            );
        }

        // 生成重置令牌
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 1); // 1小时后过期

        // 保存重置令牌
        await prisma.passwordReset.create({
            data: {
                userId: user.id,
                token: resetToken,
                expiresAt: tokenExpiry,
            },
        });

        // 发送重置邮件
        await sendPasswordResetEmail(email, resetToken);

        return NextResponse.json(
            { message: 'If an account exists with this email, a password reset link has been sent.' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Password reset request error:', error);
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
} 