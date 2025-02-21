import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import { prisma } from './db/prisma';

// 扩展 Session 用户类型
declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
        }
    }
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            profile(profile) {
                return {
                    id: profile.id.toString(),
                    name: profile.name || profile.login,
                    email: profile.email,
                    image: profile.avatar_url,
                };
            },
        }),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password required');
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user || !user.password) {
                    throw new Error('Invalid email or password');
                }

                const isValid = await bcrypt.compare(credentials.password, user.password);

                if (!isValid) {
                    throw new Error('Invalid email or password');
                }

                // 检查邮箱是否已验证
                if (!user.emailVerified) {
                    throw new Error('Please verify your email before logging in');
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            }
        })
    ],
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        strategy: 'jwt'
    },
    callbacks: {
        async session({ session, token }) {
            if (session?.user) {
                session.user.id = token.sub!;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async signIn({ user, account }) {
            // 只处理 GitHub 登录
            if (account?.provider === 'github') {
                try {
                    // 检查是否已存在相同的 GitHub 账号
                    const existingAccount = await prisma.account.findFirst({
                        where: {
                            provider: 'github',
                            providerAccountId: account.providerAccountId,
                        },
                    });

                    // 如果已经存在 GitHub 账号，允许登录
                    if (existingAccount) {
                        return true;
                    }

                    // 如果是新的 GitHub 账号，创建新用户
                    if (!existingAccount && user.email) {
                        // 创建新用户
                        const newUser = await prisma.user.create({
                            data: {
                                email: user.email,
                                name: user.name,
                                image: user.image,
                                emailVerified: new Date(), // GitHub 邮箱已验证
                            },
                        });

                        // 创建账号关联
                        await prisma.account.create({
                            data: {
                                userId: newUser.id,
                                type: account.type,
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                                access_token: account.access_token,
                                token_type: account.token_type,
                                scope: account.scope,
                            },
                        });

                        return true;
                    }

                    return true;
                } catch (error) {
                    console.error('Error in signIn callback:', error);
                    return false;
                }
            }

            // 对于其他登录方式，允许登录
            return true;
        },
        async redirect({ url, baseUrl }) {
            // 默认重定向到文档列表页面
            const defaultPath = '/documents';

            // 如果URL以基础URL开头，直接返回
            if (url.startsWith(baseUrl)) {
                return url;
            }
            // 如果是相对路径，添加基础URL
            else if (url.startsWith('/')) {
                return `${baseUrl}${url}`;
            }
            // 默认重定向到文档列表页面
            return `${baseUrl}${defaultPath}`;
        },
    },
    debug: process.env.NODE_ENV === 'development',
}; 