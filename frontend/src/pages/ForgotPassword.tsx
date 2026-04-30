import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Sparkles, KeyRound } from 'lucide-react';

const forgotPasswordSchema = z.object({
  identifier: z.string().min(5, 'Email or Phone Number is required'),
  password: z.string().min(6, 'New password must be at least 6 characters'),
  confirm_password: z.string().min(6, 'Please confirm your new password'),
  otp_code: z.string().length(6, 'OTP must be 6 digits').optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showOTP, setShowOTP] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const identifier = watch('identifier');

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!showOTP) {
        // Step 1: Send OTP for Reset
        await api.post('/auth/send-otp', {
          identifier: data.identifier,
          purpose: 'reset_password'
        });
        setShowOTP(true);
        return;
      }

      // Step 2: Verify OTP
      if (!data.otp_code) {
        setError('Please enter the 6-digit code');
        return;
      }

      await api.post('/auth/verify-otp', {
        identifier: data.identifier,
        code: data.otp_code,
        purpose: 'reset_password'
      });

      // Step 3: Reset Password
      await api.post('/auth/reset-password', {
        identifier: data.identifier,
        password: data.password,
        otp_code: data.otp_code
      });

      setSuccess('Password updated successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password. Please check your credentials and OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden px-4 py-12">
      {/* Background Assets */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.img 
          src="/assets/tech_colorful.png"
          animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-[600px] opacity-[0.15] blur-[2px]" 
        />
        <motion.img 
          src="/assets/fashion_colorful.png"
          animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -left-20 w-[500px] opacity-[0.15] blur-[2px]" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-white/90 backdrop-blur-md border border-gray-100 p-10 rounded-[40px] shadow-2xl shadow-gray-200/50">
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-brand rounded-2xl mb-6 shadow-xl shadow-brand/20"
            >
              <KeyRound className="text-white" size={32} />
            </motion.div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">Reset Access</h1>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Recover Your Identity</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-3"
                >
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-3"
                >
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  {success}
                </motion.div>
              )}
              {showOTP && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-brand/5 border border-brand/10 text-brand px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-3"
                >
                  <div className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
                  Code sent to {identifier}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-5">
              {!showOTP ? (
                <>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-[46px] text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
                    <Input
                      label="Email or Phone"
                      placeholder="name@example.com or +1234567890"
                      className="bg-gray-50 border-gray-100 text-gray-900 placeholder:text-gray-300 pl-12 h-14 rounded-2xl focus:ring-brand/10 focus:border-brand transition-all"
                      error={errors.identifier?.message}
                      {...register('identifier')}
                    />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-[46px] text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="••••••••"
                      className="bg-gray-50 border-gray-100 text-gray-900 placeholder:text-gray-300 pl-12 h-14 rounded-2xl focus:ring-brand/10 focus:border-brand transition-all"
                      error={errors.password?.message}
                      {...register('password')}
                    />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-[46px] text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      placeholder="••••••••"
                      className="bg-gray-50 border-gray-100 text-gray-900 placeholder:text-gray-300 pl-12 h-14 rounded-2xl focus:ring-brand/10 focus:border-brand transition-all"
                      error={errors.confirm_password?.message}
                      {...register('confirm_password')}
                    />
                  </div>
                </>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative group"
                >
                  <Sparkles className="absolute left-4 top-[46px] text-brand transition-colors" size={18} />
                  <Input
                    label="Enter 6-Digit Code"
                    placeholder="000000"
                    maxLength={6}
                    className="bg-gray-50 border-brand/20 text-brand placeholder:text-gray-300 pl-12 h-14 rounded-2xl focus:ring-brand/10 focus:border-brand transition-all text-center tracking-[1em] font-black text-xl"
                    error={errors.otp_code?.message}
                    {...register('otp_code')}
                  />
                </motion.div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 bg-brand hover:bg-brand-dark text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-brand/30 transition-all flex items-center justify-center gap-2" 
              isLoading={isLoading}
            >
              {showOTP ? 'Update Password' : 'Send Code'} <ArrowRight size={18} />
            </Button>

            <p className="text-center text-xs text-gray-400 font-bold">
              REMEMBERED?{' '}
              <Link to="/login" className="text-brand hover:text-brand-dark underline underline-offset-4 decoration-2">
                BACK TO SIGN IN
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
