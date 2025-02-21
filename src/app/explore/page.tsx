'use client';

import { Spinner } from '@/components/ui/spinner';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Author {
  id: string;
  name: string;
  image: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  author: Author;
  upvotes: number;
  downvotes: number;
  userVote?: 'UP' | 'DOWN' | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ExplorePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  async function fetchPosts(page = 1) {
    try {
      setLoading(true);
      const res = await fetch(`/api/posts/public?page=${page}&limit=10`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to load documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(postId: string, voteType: 'UP' | 'DOWN') {
    if (!session) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: voteType }),
      });

      if (!res.ok) throw new Error('Failed to vote');
      
      // 更新投票状态
      const updatedPost = await res.json();
      setPosts(posts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              upvotes: updatedPost.upvotes,
              downvotes: updatedPost.downvotes,
              userVote: updatedPost.userVote
            }
          : post
      ));
    } catch (error) {
      console.error('Failed to vote:', error);
      setError('Failed to vote');
    }
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">Explore Public Documents</h1>
        </div>

        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <ul className="divide-y divide-slate-200">
            {posts.map((post) => (
              <li key={post.id} className="hover:bg-slate-50">
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <img
                          className="h-8 w-8 rounded-full"
                          src={post.author.image || '/default-avatar.png'}
                          alt={post.author.name}
                        />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-600">
                            <Link href={`/documents/${post.id}`} className="hover:underline">
                              {post.title}
                            </Link>
                          </p>
                          <p className="text-sm text-slate-500">
                            By {post.author.name} • {new Date(post.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleVote(post.id, 'UP')}
                          className={`p-1 rounded-full hover:bg-slate-100 ${
                            post.userVote === 'UP' ? 'text-green-600' : 'text-slate-400'
                          }`}
                          title="Upvote"
                        >
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <span className="text-sm font-medium text-slate-600">{post.upvotes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleVote(post.id, 'DOWN')}
                          className={`p-1 rounded-full hover:bg-slate-100 ${
                            post.userVote === 'DOWN' ? 'text-red-600' : 'text-slate-400'
                          }`}
                          title="Downvote"
                        >
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11a1 1 0 10-2 0v-3.586L7.707 10.707a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 9.414V13z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <span className="text-sm font-medium text-slate-600">{post.downvotes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {posts.length === 0 && (
          <div className="bg-white shadow-sm rounded-lg p-12 text-center">
            <h3 className="text-sm font-medium text-slate-800">No public documents yet</h3>
            <p className="mt-1 text-sm text-slate-500">Be the first to share a document with the community.</p>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <nav className="bg-white shadow-sm rounded-md inline-flex">
              {Array.from({ length: pagination.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => fetchPosts(i + 1)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                    pagination.page === i + 1
                      ? 'text-blue-600 bg-blue-50 border-blue-600 z-10'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 border-transparent'
                  } ${i === 0 ? 'rounded-l-md' : ''} ${
                    i === pagination.totalPages - 1 ? 'rounded-r-md' : ''
                  } border transition-colors`}
                >
                  {i + 1}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
} 