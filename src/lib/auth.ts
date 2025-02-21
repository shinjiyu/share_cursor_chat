import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import { prisma } from './db/prisma';

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
        }),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user || !user.password) {
                    return null;
                }

                const isValid = await bcrypt.compare(credentials.password, user.password);

                if (!isValid) {
                    return null;
                }

                return {
                    id: user.id.toString(),
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            }
        })
    ],
    session: {
        strategy: 'jwt'
    },
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub!;
            }
            return session;
        }
    }
}; 