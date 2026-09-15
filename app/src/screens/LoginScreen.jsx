import React, { useState } from 'react';
import { 
  Activity, 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function LoginScreen({ onLoginSuccess, onBackToLanding }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('demo.patient@healthpulse.edge');
  const [password, setPassword] = useState('pass1234');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = (e) => {
    e?.preventDefault();
    setErrorMessage('');

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    // Success transition
    onLoginSuccess({
      email,
      name: mode === 'signup' ? name : 'Demo User'
    });
  };

  const handleDemoQuickAccess = () => {
    onLoginSuccess({
      email: 'clinician.reviewer@sih.qualcomm',
      name: 'Judge / Reviewer'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '16px 0' }}>
      <div className="app-card" style={{ width: '100%', maxWidth: '360px', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Logo & Wordmark Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#0E7C7B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', marginBottom: '4px' }}>
            <Activity size={20} color="#FFFFFF" />
          </div>
          <h2 className="text-display" style={{ fontSize: '20px', lineHeight: '26px' }}>
            HealthPulse<span style={{ color: '#0E7C7B' }}>EDGE</span>
          </h2>
          <p className="text-caption" style={{ color: '#6B7280', fontSize: '12px' }}>
            Your health data stays on this device.
          </p>
        </div>

        {/* Segmented Control: Log In / Sign Up */}
        <div className="segmented-control">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMessage(''); }}
            className={`segmented-control-btn ${mode === 'login' ? 'active' : ''}`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMessage(''); }}
            className={`segmented-control-btn ${mode === 'signup' ? 'active' : ''}`}
          >
            Sign Up
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mode === 'signup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="text-caption" style={{ fontWeight: 600, color: '#15181C', fontSize: '12px' }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                style={{
                  height: '46px',
                  borderRadius: '12px',
                  border: focusedField === 'name' ? '1.5px solid #0E7C7B' : '1px solid #E7E5E2',
                  background: '#FAFAF9',
                  padding: '0 12px',
                  fontSize: '14px',
                  color: '#15181C',
                  outline: 'none',
                  transition: 'border 0.2s ease'
                }}
              />
            </div>
          )}

          {/* Email Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label className="text-caption" style={{ fontWeight: 600, color: '#15181C', fontSize: '12px' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              style={{
                height: '46px',
                borderRadius: '12px',
                border: focusedField === 'email' ? '1.5px solid #0E7C7B' : '1px solid #E7E5E2',
                background: '#FAFAF9',
                padding: '0 12px',
                fontSize: '14px',
                color: '#15181C',
                outline: 'none',
                transition: 'border 0.2s ease'
              }}
            />
          </div>

          {/* Password Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="text-caption" style={{ fontWeight: 600, color: '#15181C', fontSize: '12px' }}>
                Password
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => alert('Password reset token generated on local storage.')}
                  style={{ background: 'none', border: 'none', color: '#0E7C7B', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                >
                  Forgot?
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              style={{
                height: '46px',
                borderRadius: '12px',
                border: focusedField === 'password' ? '1.5px solid #0E7C7B' : '1px solid #E7E5E2',
                background: '#FAFAF9',
                padding: '0 12px',
                fontSize: '14px',
                color: '#15181C',
                outline: 'none',
                transition: 'border 0.2s ease'
              }}
            />
          </div>

          {mode === 'signup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="text-caption" style={{ fontWeight: 600, color: '#15181C', fontSize: '12px' }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
                style={{
                  height: '46px',
                  borderRadius: '12px',
                  border: focusedField === 'confirmPassword' ? '1.5px solid #0E7C7B' : '1px solid #E7E5E2',
                  background: '#FAFAF9',
                  padding: '0 12px',
                  fontSize: '14px',
                  color: '#15181C',
                  outline: 'none',
                  transition: 'border 0.2s ease'
                }}
              />
            </div>
          )}

          {/* Inline Validation Error in Critical Red (#C93A3A) */}
          {errorMessage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#C93A3A', marginTop: '2px' }}>
              <AlertCircle size={14} color="#C93A3A" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Primary Submit Button */}
          <button
            type="submit"
            style={{
              height: '46px',
              borderRadius: '14px',
              background: '#0E7C7B',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'var(--font-display)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '6px',
              boxShadow: '0 2px 6px rgba(14, 124, 123, 0.25)'
            }}
          >
            <span>{mode === 'login' ? 'Log In' : 'Create Account'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Fast Access for Judges */}
        <div style={{ borderTop: '1px solid #E7E5E2', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={handleDemoQuickAccess}
            style={{
              height: '38px',
              borderRadius: '10px',
              background: '#FAFAF9',
              border: '1px solid #E7E5E2',
              color: '#0E7C7B',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={14} color="#0E7C7B" />
            <span>Judge Demo Access (1-Click)</span>
          </button>

          {/* Switch Mode Prompt */}
          <div style={{ textAlign: 'center', marginTop: '2px' }}>
            <span className="text-caption" style={{ fontSize: '12px', color: '#6B7280' }}>
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErrorMessage(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#0E7C7B',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                padding: 0
              }}
            >
              {mode === 'login' ? 'Sign Up' : 'Log In'}
            </button>
          </div>

          <button
            type="button"
            onClick={onBackToLanding}
            style={{
              background: 'none',
              border: 'none',
              color: '#6B7280',
              fontSize: '11px',
              cursor: 'pointer',
              textAlign: 'center',
              marginTop: '2px'
            }}
          >
            ← Back to Overview
          </button>
        </div>
      </div>
    </div>
  );
}
