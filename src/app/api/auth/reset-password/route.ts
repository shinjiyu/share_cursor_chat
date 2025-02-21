import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    return errors;
};

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 验证密码强度
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            return NextResponse.json(
                { error: passwordErrors[0] },
                { status: 400 }
            );
        }

        // 查找重置记录
        const resetRecord = await prisma.passwordReset.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetRecord) {
            return NextResponse.json(
                { error: 'Invalid reset token' },
                { status: 400 }
            );
        }

        // 检查是否过期
        if (resetRecord.expiresAt < new Date()) {
            // 删除过期的重置记录
            await prisma.passwordReset.delete({
                where: { id: resetRecord.id },
            });
            return NextResponse.json(
                { error: 'Reset token has expired' },
                { status: 400 }
            );
        }

        // 更新密码
        const hashedPassword = await bcrypt.hash(password, 12);
        await prisma.user.update({
            where: { id: resetRecord.userId },
            data: { password: hashedPassword },
        });

        // 删除重置记录
        await prisma.passwordReset.delete({
            where: { id: resetRecord.id },
        });

        return NextResponse.json(
            { message: 'Password has been reset successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Password reset error:', error);
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
} 