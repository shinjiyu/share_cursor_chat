'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    async function verifyEmail() {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          setStatus('success');
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 2000);
        } else {
          setStatus('error');
        }
      } catch (error) {
        setStatus('error');
      }
    }

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
          <div className="mt-4">
            {status === 'loading' && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Verifying your email...</p>
              </div>
            )}
            {status === 'success' && (
              <div className="text-center text-green-600">
                <p>Your email has been verified successfully!</p>
                <p className="mt-2 text-sm text-gray-500">
                  Redirecting to login page...
                </p>
              </div>
            )}
            {status === 'error' && (
              <div className="text-center text-red-600">
                <p>Failed to verify email.</p>
                <p className="mt-2 text-sm text-gray-500">
                  The verification link may be invalid or expired.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 