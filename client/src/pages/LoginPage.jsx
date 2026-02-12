import { useState } from 'react';
import useStore from '../store/useStore';

function LoginPage() {
  const { login } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = login(username, password);
    if (!success) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border border-white/30 rounded-full" />
          <div className="absolute bottom-40 right-10 w-48 h-48 border border-white/20 rounded-full" />
          <div className="absolute top-1/2 left-10 w-24 h-24 border border-white/20 rounded-full" />
        </div>

        {/* Logo and Icon */}
        <div className="relative z-10 text-center">
          <div className="relative inline-block mb-8">
            <img 
              src="https://forklift.olt.mn/logo.png" 
              alt="OT Logistic" 
              className="w-28 h-28 object-contain mx-auto drop-shadow-2xl"
            />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            Convoy Management System
          </h1>
          <p className="text-blue-200 text-sm mb-12">
            Logistics Management System
          </p>

          {/* Features */}
          <div className="space-y-4 text-left max-w-xs mx-auto">
            <div className="flex items-center gap-4 text-white/90">
              <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center">
                <span className="text-lg">🚚</span>
              </div>
              <span className="text-sm">Real-time convoy tracking</span>
            </div>
            <div className="flex items-center gap-4 text-white/90">
              <div className="w-10 h-10 bg-green-500/30 rounded-lg flex items-center justify-center">
                <span className="text-lg">📊</span>
              </div>
              <span className="text-sm">Dispatch & planning analytics</span>
            </div>
            <div className="flex items-center gap-4 text-white/90">
              <div className="w-10 h-10 bg-amber-500/30 rounded-lg flex items-center justify-center">
                <span className="text-lg">📅</span>
              </div>
              <span className="text-sm">Holiday & schedule management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img 
              src="https://forklift.olt.mn/logo.png" 
              alt="OT Logistic" 
              className="w-16 h-16 object-contain mx-auto mb-4"
            />
          </div>

          {/* Login Header */}
          <div className="text-center mb-8">
            <div className="lg:hidden w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚛</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Sign In</h2>
            <p className="text-slate-500 text-sm mt-1">Access your convoy dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                className="w-full px-4 py-3.5 bg-slate-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400"
                placeholder="Username"
                autoFocus
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="w-full px-4 py-3.5 bg-slate-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-400"
                placeholder="Password"
              />
            </div>

            {error && (
              <div className="text-red-500 text-xs font-medium bg-red-50 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3.5 rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-blue-600 transition shadow-lg shadow-blue-500/30"
            >
              Sign In
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <span className="text-xs text-slate-400">
              © 2026 OT Logistic. Internal Use Only.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
