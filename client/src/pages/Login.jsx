import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Database, Lock, Mail, User, Phone, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../services/api';
import toast from 'react-hot-toast';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password & OTP state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState('+91 XXXXX X1233');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, phone: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isRegistering) {
      const cleanPhone = (formData.phone || '').trim().replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        setError('Contact number must be exactly 10 digits starting with 6, 7, 8, or 9.');
        toast.error('Invalid contact number. Must be 10 digits starting with 6-9.');
        setIsLoading(false);
        return;
      }
    }

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('NetworkError') || err.message?.includes('Failed to fetch')) {
        const networkError = 'Unable to connect to RicozLake server. Please ensure the backend is running on port 5000.';
        setError(networkError);
        toast.error(networkError);
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForgotPassword = async () => {
    const cleanEmail = (formData.email || '').trim();
    if (!cleanEmail) {
      toast.error('Please enter your registered email address in the Email field first.');
      return;
    }

    setIsOtpLoading(true);
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setResendCooldown(30);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      const phoneDisplay = data.maskedPhone || '+91 XXXXX X1233';
      setMaskedPhone(phoneDisplay);
      setIsForgotModalOpen(true);
      toast.success(`OTP has successfully sent to ${phoneDisplay}!`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isOtpLoading) return;
    setIsOtpLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, phone: formData.phone })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend OTP');

      const phoneDisplay = data.maskedPhone || maskedPhone;
      setMaskedPhone(phoneDisplay);
      setResendCooldown(30);
      toast.success(`A new OTP has been sent to ${phoneDisplay}!`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    if (!otpCode || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields (OTP, New Password, and Confirm Password)');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New Password and Confirm Password do not match');
      return;
    }

    setIsOtpLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          otp: otpCode,
          newPassword,
          confirmPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      toast.success('Password reset successfully! Please sign in with your new password.');
      setIsForgotModalOpen(false);
      setFormData({ ...formData, password: '' });
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsOtpLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: 'var(--bg-secondary)',
      padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: '420px', animation: 'slideUpFade 0.4s ease-out' }}>
        <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
          <button 
            type="button" 
            onClick={() => navigate('/onboarding')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              cursor: 'pointer', 
              fontSize: '0.85rem', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              padding: 0
            }}
          >
            ← Back to Ricoz Ecosystem & Onboarding
          </button>
        </div>
        <Card style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '1rem' }}>
              <Database size={24} color="var(--accent-primary)" />
            </div>
            <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
              {isRegistering ? 'Create an Account' : 'Sign in to RicozLake'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>
              {isRegistering ? 'Sign up to start managing datasets.' : 'Enter your details to access your datasets.'}
            </p>
          </div>

          {error && (
            <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: 'var(--status-error)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {isRegistering && (
              <>
                <Input 
                  name="name"
                  label="Full Name" 
                  type="text" 
                  placeholder="John Doe" 
                  icon={User}
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <Input 
                  name="phone"
                  label="Contact Number" 
                  type="tel" 
                  placeholder="(+91) XXXXX XXXXX" 
                  icon={Phone}
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={10}
                  required
                />
              </>
            )}
            <Input 
              name="email"
              label="Email" 
              type="email" 
              placeholder="name@company.com" 
              icon={Mail}
              value={formData.email}
              onChange={handleChange}
              required
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Password</span>
                {!isRegistering && (
                  <button 
                    type="button"
                    onClick={handleOpenForgotPassword}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', padding: 0 }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input 
                name="password"
                type="password" 
                placeholder="••••••••" 
                icon={Lock}
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <Button variant="primary" type="submit" style={{ marginTop: '0.5rem', width: '100%' }} disabled={isLoading}>
              {isLoading ? 'Processing...' : isRegistering ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
              style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', fontWeight: 500, cursor: 'pointer', padding: 0 }}
            >
              {isRegistering ? 'Sign In' : 'Request Access'}
            </button>
          </div>
        </Card>
      </div>

      {/* Direct Forgot Password Modal */}
      <Modal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} title="Reset Your Password">
        <form onSubmit={handleVerifyAndReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid var(--accent-primary)', padding: '0.875rem', borderRadius: '8px', fontSize: '0.875rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              OTP has successfully sent to {maskedPhone || '+91 XXXXX X1233'}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Please check your mobile SMS for your 6-digit verification code and enter it below.
            </div>
          </div>

          <div>
            <Input 
              label="6-Digit OTP Code" 
              type="text" 
              placeholder="e.g. 123456" 
              icon={Key}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Didn't receive the OTP?</span>
              <button 
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isOtpLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--accent-secondary)',
                  fontWeight: 600,
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  padding: 0,
                  textDecoration: resendCooldown > 0 ? 'none' : 'underline'
                }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </div>

          <Input 
            label="Change Password (New Password)" 
            type="password" 
            placeholder="Enter new strong password" 
            icon={Lock}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input 
            label="Confirm Password" 
            type="password" 
            placeholder="Re-enter new password to confirm" 
            icon={Lock}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button variant="secondary" type="button" onClick={() => setIsForgotModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isOtpLoading}>
              {isOtpLoading ? 'Verifying...' : 'Verify OTP & Reset Password'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
