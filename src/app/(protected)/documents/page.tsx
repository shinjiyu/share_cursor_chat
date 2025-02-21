'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Post {
  id: string;
  title: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    image: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function DocumentsPage() {
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
      const res = await fetch(`/api/posts?page=${page}&limit=10`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete post');
      
      // 重新获取文档列表
      fetchPosts(pagination.page);
    } catch (err) {
      setError('Failed to delete document');
    }
  }

  async function handleVisibilityToggle(postId: string, currentVisibility: boolean) {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !currentVisibility }),
      });

      if (!res.ok) throw new Error('Failed to update visibility');
      
      // 重新获取文档列表
      fetchPosts(pagination.page);
    } catch (err) {
      setError('Failed to update document visibility');
    }
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-slate-800">My Documents</h1>
            <Link
              href="/documents/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              New Document
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
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
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        <Link href={`/documents/${post.id}`} className="hover:underline">
                          {post.title}
                        </Link>
                      </p>
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        post.isPublic ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {post.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleVisibilityToggle(post.id, post.isPublic)}
                        className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
                      >
                        {post.isPublic ? 'Make Private' : 'Make Public'}
                      </button>
                      <Link
                        href={`/documents/${post.id}/edit`}
                        className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-sm text-rose-600 hover:text-rose-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-slate-500">
                      Last updated {new Date(post.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {posts.length === 0 && (
          <div className="bg-white shadow-sm rounded-lg p-12 text-center">
            <h3 className="text-sm font-medium text-slate-800">No documents</h3>
            <p className="mt-1 text-sm text-slate-500">Get started by creating a new document.</p>
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