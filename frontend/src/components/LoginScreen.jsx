import React, { useState, useEffect } from 'react';
import { login, signup, getDemoAccounts } from '../services/api';

/**
 * LoginScreen Component (Modern Clean Light Edition):
 * Real database-backed Sign In and Sign Up portal for authorities and operators.
 * Pre-seeds Alice and Bob for 1-click test sessions.
 */
export default function LoginScreen({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'

  // Login Form State
  const [email, setEmail] = useState('alice@qkd.org');
  const [password, setPassword] = useState('alice123');

  // Signup Form State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupSite, setSignupSite] = useState('Station Charlie (Node C)');

  const [showPassword, setShowPassword] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    getDemoAccounts()
      .then((res) => setDemoAccounts(res.accounts || []))
      .catch(() => {});
  }, []);

  const executeLogin = async (loginEmail, loginPassword) => {
    const targetEmail = loginEmail || email;
    const targetPassword = loginPassword || password;
    if (!targetEmail || !targetPassword) {
      setError('Please provide your authority email and password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const data = await login(targetEmail, targetPassword);
      localStorage.setItem('qkd_auth_token', data.token);
      localStorage.setItem('qkd_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    executeLogin(email, password);
  };

  const handleSignup = async (e) => {
    if (e) e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const data = await signup({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        siteName: signupSite,
      });

      localStorage.setItem('qkd_auth_token', data.token);
      localStorage.setItem('qkd_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (acc) => {
    const defaultPass = acc.defaultPassword || 'password123';
    setEmail(acc.email);
    setPassword(defaultPass);
    setError('');
    setMode('login');
    executeLogin(acc.email, defaultPass);
  };

  return (
    <div className="min-h-screen bg-[#e9ecf8] flex flex-col justify-between text-[#0f172a] font-sans antialiased selection:bg-[#5e67ea] selection:text-white">
      {/* Top periwinkle accent bar */}
      <div className="h-1.5 bg-[#5e67ea] w-full" />

      {/* Main Split Layout: Title on Left, Auth Interface on Right */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-14 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-16 my-auto">
        {/* Left Side: Title & Subtitle */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center lg:items-start text-center lg:text-left space-y-3 sm:space-y-4">
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#eef1fc] border border-[#dce2f9] flex items-center justify-center text-[#5e67ea] shadow-xs">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#0f172a] tracking-tight leading-tight">
            QUANTUM SECURE CHAT PORTAL
          </h1>
          <p className="text-sm sm:text-lg text-[#4338ca] font-bold leading-relaxed">
            Real Dynamic E91 Key Distribution Platform
          </p>
          <div className="pt-2 flex flex-col gap-2 text-xs text-[#334155] font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
              <span>Per-Round Bell CHSH (S &gt; 2.0) Verification</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
              <span>Real-Time Eavesdropping Intercept-Resend Detection</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
              <span>Authenticated AES-256-GCM Ephemeral Encryption</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card (Sign In / Sign Up) */}
        <div className="w-full max-w-md flex-shrink-0">
          <div className="bg-white border border-[#dce2f9] rounded-3xl shadow-xl p-6 sm:p-8">
            {/* Tabs: Sign In vs Sign Up */}
            <div className="flex items-center bg-[#f0f3fa] p-1 rounded-2xl mb-6 border border-[#dce2f9]">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  mode === 'login' ? 'bg-[#5e67ea] text-white shadow-xs' : 'text-[#334155] hover:text-[#0f172a]'
                }`}
              >
                Sign In (Existing)
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  mode === 'signup' ? 'bg-[#5e67ea] text-white shadow-xs' : 'text-[#334155] hover:text-[#0f172a]'
                }`}
              >
                Create Account (Sign Up)
              </button>
            </div>

            <div className="text-center mb-5">
              <h2 className="text-lg font-bold text-[#0f172a]">
                {mode === 'login' ? 'Authority Terminal Sign In' : 'Register New Node Operator'}
              </h2>
              <p className="text-xs text-[#334155] mt-1 font-medium">
                {mode === 'login'
                  ? 'Sign in to access encrypted quantum communications'
                  : 'Your profile will be saved to PostgreSQL and visible across the network'}
              </p>
            </div>

            {error && (
              <div className="mb-4 text-xs bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] p-3 rounded-2xl flex items-center gap-2 font-bold">
                <span>⚠️</span> {error}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 text-xs bg-[#dcfce7] border border-[#bbf7d0] text-[#15803d] p-3 rounded-2xl flex items-center gap-2 font-bold">
                <span>✓</span> {successMsg}
              </div>
            )}

            {/* SIGN IN FORM */}
            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0f172a] mb-1.5">
                    Authority Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alice@qkd.org or bob@qkd.org"
                    className="w-full bg-[#f0f3fa] border border-[#dce2f9] rounded-2xl px-4 py-2.5 text-sm text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:border-[#5e67ea] transition font-sans font-medium"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-[#0f172a]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-[#4338ca] font-bold hover:underline"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#f0f3fa] border border-[#dce2f9] rounded-2xl px-4 py-2.5 text-sm text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:border-[#5e67ea] transition font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#5e67ea] hover:bg-[#4f59e0] disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Authenticating...
                    </>
                  ) : (
                    'Sign In to Chat'
                  )}
                </button>
              </form>
            ) : (
              /* SIGN UP FORM */
              <form onSubmit={handleSignup} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#0f172a] mb-1">
                    Full Name / Operator ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Charlie Evans (Relay Node 4)"
                    className="w-full bg-[#f0f3fa] border border-[#dce2f9] rounded-2xl px-4 py-2 text-sm text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:border-[#5e67ea] transition font-sans font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0f172a] mb-1">
                    Official Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="e.g. charlie@qkd.org"
                    className="w-full bg-[#f0f3fa] border border-[#dce2f9] rounded-2xl px-4 py-2 text-sm text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:border-[#5e67ea] transition font-sans font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0f172a] mb-1">
                    Station / Infrastructure Site
                  </label>
                  <input
                    type="text"
                    value={signupSite}
                    onChange={(e) => setSignupSite(e.target.value)}
                    placeholder="e.g. Station Charlie (East Grid Hub)"
                    className="w-full bg-[#f0f3fa] border border-[#dce2f9] rounded-2xl px-4 py-2 text-sm text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:border-[#5e67ea] transition font-sans font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0f172a] mb-1">
                    Security Password (min 6 characters) *
                  </label>
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#f0f3fa] border border-[#dce2f9] rounded-2xl px-4 py-2 text-sm text-[#0f172a] placeholder-[#64748b] focus:outline-none focus:border-[#5e67ea] transition font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#5e67ea] hover:bg-[#4f59e0] disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Creating PostgreSQL Account...
                    </>
                  ) : (
                    'Create Account & Enter Chat'
                  )}
                </button>
              </form>
            )}

            {/* Quick Demo Accounts (Alice & Bob) */}
            <div className="mt-6 pt-5 border-t border-[#edf0f8]">
              <p className="text-[11px] font-bold text-[#0f172a] uppercase tracking-wider mb-2.5 text-center font-mono">
                Demo Accounts (1-Click Login)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => selectDemoAccount(acc)}
                    className={`p-2.5 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                      email === acc.email && mode === 'login'
                        ? 'bg-[#eef1fc] border-[#5e67ea] shadow-xs'
                        : 'bg-[#f8fafd] border-[#dce2f9] hover:bg-[#f0f3fa]'
                    }`}
                  >
                    <img
                      src={acc.avatar}
                      alt={acc.name}
                      className="w-8 h-8 rounded-xl object-cover border border-[#dce2f9] flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#0f172a] truncate">{acc.name}</div>
                      <div className="text-[10px] text-[#4338ca] font-mono font-bold truncate">{acc.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Light Footer */}
      <footer className="py-4 text-center text-xs text-[#334155] font-semibold">
        Dynamic E91 Quantum Key Distribution · Real-time Ephemeral Security Active
      </footer>
    </div>
  );
}
