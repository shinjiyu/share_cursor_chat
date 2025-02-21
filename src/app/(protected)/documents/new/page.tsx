'use client';

import { Spinner } from '@/components/ui/spinner';
import '@uiw/react-markdown-preview/markdown.css';
import '@uiw/react-md-editor/markdown-editor.css';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// 动态导入 Markdown 编辑器，避免 SSR 问题
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => <Spinner />,
});

export default function NewDocumentPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.name.endsWith('.md') && !file.name.toLowerCase().endsWith('.markdown')) {
      setError('Please upload a Markdown file (.md or .markdown)');
      return;
    }

    // 检查文件大小（1MB限制）
    if (file.size > 1024 * 1024) {
      setError('File size should not exceed 1MB');
      return;
    }

    // 从文件名设置标题（去掉扩展名）
    const fileName = file.name.replace(/\.(md|markdown)$/i, '');
    setTitle(fileName);

    // 读取文件内容
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setContent(content);
    };
    reader.onerror = () => {
      setError('Error reading file');
    };
    reader.readAsText(file);
  };

  async function handleSave() {
    if (!title || !content) {
      setError('Title and content are required');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          isPublic,
        }),
      });

      if (!res.ok) throw new Error('Failed to create post');
      
      router.push('/documents');
    } catch (_) {
      setError('Failed to create document');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8" data-color-mode="dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
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

            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700">
                  Title
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="title"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Upload Markdown File
                </label>
                <div className="mt-1">
                  <input
                    type="file"
                    accept=".md,.markdown"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Upload a Markdown file (.md or .markdown) up to 1MB
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Content
                </label>
                <div className="mt-1">
                  <MDEditor
                    value={content}
                    onChange={(value) => setContent(value || '')}
                    height={400}
                    preview="edit"
                    hideToolbar={false}
                    className="prose max-w-none"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="isPublic"
                  name="isPublic"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 block text-sm text-slate-700">
                  Make this document public
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 