import { prisma } from '@/lib/db/prisma';
import { sendVerificationEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
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
        const { email, password, name } = await request.json();

        // 验证输入
        if (!email || !password || !name) {
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

        // 检查邮箱是否已存在
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 400 }
            );
        }

        // 密码加密
        const hashedPassword = await bcrypt.hash(password, 12);

        // 生成验证令牌
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24小时后过期

        // 创建用户和验证记录
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                emailVerification: {
                    create: {
                        token: verificationToken,
                        expiresAt: tokenExpiry,
                    },
                },
            },
        });

        // 发送验证邮件
        await sendVerificationEmail(email, verificationToken);

        return NextResponse.json(
            { message: 'User created successfully. Please check your email to verify your account.' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
} 