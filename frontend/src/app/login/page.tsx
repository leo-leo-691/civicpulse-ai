'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import React, { useState, Suspense } from 'react';
import { ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/citizen';
  const error = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  let hintEmail = 'citizen@demo.com';
  let hintPass = 'citizen123';
  let roleTitle = 'Citizen';

  if (callbackUrl.includes('/admin')) {
    hintEmail = 'admin@demo.com';
    hintPass = 'admin123';
    roleTitle = 'Admin';
  } else if (callbackUrl.includes('/dashboard')) {
    hintEmail = 'policymaker@demo.com';
    hintPass = 'policy123';
    roleTitle = 'Policymaker';
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn('credentials', {
      email,
      password,
      callbackUrl,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060913] p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#060913] to-[#060913]"></div>
      
      <div className="bg-[#0c1222]/90 border border-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full relative z-10 backdrop-blur-md">
        <div className="flex flex-col items-center mb-8">
          <ShieldCheck className="w-12 h-12 text-cyan-400 mb-2" />
          <h1 className="text-2xl font-bold text-white">Sign In</h1>
          <p className="text-slate-400 text-sm">Access the CivicPulse AI Platform</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-700/50 text-red-300 text-sm rounded-lg text-center">
            {error === 'AccessDenied' ? 'You do not have permission to access that page.' : 'Authentication failed. Please check your credentials.'}
          </div>
        )}

        <button
          onClick={() => signIn('google', { callbackUrl })}
          className="w-full flex items-center justify-center gap-2 bg-white text-slate-900 font-bold py-2.5 rounded-xl hover:bg-slate-100 transition mb-6"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          Sign in with Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-slate-800 flex-1"></div>
          <span className="text-xs text-slate-500 uppercase font-semibold">Or use Demo Account</span>
          <div className="h-px bg-slate-800 flex-1"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Demo Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={`e.g. ${hintEmail}`}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Demo Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={`e.g. ${hintPass}`}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              Sign in as {roleTitle}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#060913] text-white">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
