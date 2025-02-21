import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">
                Markdown Share
              </Link>
            </div>
            {session && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/documents"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-600 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600"
                >
                  My Documents
                </Link>
                <Link
                  href="/documents/new"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-600 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600"
                >
                  New Document
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center">
            {session ? (
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <img
                    className="h-8 w-8 rounded-full ring-2 ring-slate-200"
                    src={session.user?.image || '/default-avatar.png'}
                    alt={session.user?.name || 'User'}
                  />
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-slate-600">{session.user?.name}</div>
                  <div className="text-sm text-slate-500">{session.user?.email}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="ml-4 inline-flex items-center px-3 py-2 border border-slate-200 text-sm font-medium rounded-md text-slate-600 hover:text-blue-600 hover:border-blue-600 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-x-4">
                <Link
                  href="/login"
                  className="inline-flex items-center px-3 py-2 border border-slate-200 text-sm font-medium rounded-md text-slate-600 hover:text-blue-600 hover:border-blue-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 