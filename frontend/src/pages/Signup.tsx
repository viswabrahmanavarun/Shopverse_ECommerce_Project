import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store/authStore';
import { User, Mail, Lock, UserPlus, Sparkles, ArrowRight } from 'lucide-react';

const signupSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  identifier: z.string().min(5, 'Email or Phone Number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string().min(6, 'Please confirm your password'),
  role: z.enum(['customer', 'seller']),
  otp_code: z.string().length(6, 'OTP must be 6 digits').optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showOTP, setShowOTP] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'customer'
    }
  });

  const identifier = watch('identifier');

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/google', {
        token: credentialResponse.credential
      });
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      const userResponse = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      setAuth(userResponse.data, access_token);
      navigate('/');
    } catch (err: any) {
      setError('Google authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!showOTP) {
        // Step 1: Send OTP
        await api.post('/auth/send-otp', {
          identifier: data.identifier,
          purpose: 'signup'
        });
        setShowOTP(true);
        return;
      }

      // Step 2: Verify OTP and Signup
      if (!data.otp_code) {
        setError('Please enter the 6-digit code');
        return;
      }

      // Verify OTP
      await api.post('/auth/verify-otp', {
        identifier: data.identifier,
        code: data.otp_code,
        purpose: 'signup'
      });

      // Complete Signup
      const isEmail = data.identifier.includes('@');
      await api.post('/auth/signup', {
        full_name: data.full_name,
        email: isEmail ? data.identifier : undefined,
        phone_number: !isEmail ? data.identifier : undefined,
        password: data.password,
        role: data.role,
        otp_code: data.otp_code
      });
      navigate('/login', { state: { message: 'Account created! Please log in.' } });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden px-4 py-12">
      {/* Premium Colorful Background Assets */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Colorful Fashion Asset */}
        <motion.img 
          src="/assets/fashion_colorful.png"
          animate={{ 
            x: [0, 40, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 -left-20 w-[500px] opacity-[0.2] blur-[1px]" 
        />
        
        {/* Colorful Lifestyle Asset */}
        <motion.img 
          src="/assets/lifestyle_colorful.png"
          animate={{ 
            y: [0, 70, 0],
            rotate: [0, -15, 0],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-20 right-0 w-[600px] opacity-[0.18] blur-[1px]" 
        />

        {/* Colorful Tech Asset */}
        <motion.img 
          src="/assets/tech_colorful.png"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-[400px]" 
        />

        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/white-diamond.png')] opacity-[0.2]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-white/90 backdrop-blur-md border border-gray-100 p-10 rounded-[40px] shadow-2xl shadow-gray-200/50">
          <div className="text-center mb-10">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl mb-6 shadow-xl shadow-purple-600/20"
            >
              <UserPlus className="text-white" size={32} />
            </motion.div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">Join Universe</h1>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Start Your Journey Today</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-3"
                >
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  {error}
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
                    <User className="absolute left-4 top-[46px] text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
                    <Input
                      label="Full Identity"
                      placeholder="John Doe"
                      className="bg-gray-50 border-gray-100 text-gray-900 placeholder:text-gray-300 pl-12 h-14 rounded-2xl focus:ring-brand/10 focus:border-brand transition-all"
                      error={errors.full_name?.message}
                      {...register('full_name')}
                    />
                  </div>

                  <div className="relative group">
                    <Mail className="absolute left-4 top-[46px] text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
                    <Input
                      label="Email or Phone Number"
                      placeholder="name@example.com or +1234567890"
                      className="bg-gray-50 border-gray-100 text-gray-900 placeholder:text-gray-300 pl-12 h-14 rounded-2xl focus:ring-brand/10 focus:border-brand transition-all"
                      error={errors.identifier?.message}
                      {...register('identifier')}
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-[46px] text-gray-400 group-focus-within:text-brand transition-colors" size={18} />
                    <Input
                      label="Secure Key"
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
                      label="Confirm Secure Key"
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
              {showOTP ? 'Confirm Identity' : 'Initialize Identity'} <ArrowRight size={18} />
            </Button>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white/80 px-4 text-gray-400 font-black tracking-[0.3em]">Neural Link</span>
              </div>
            </div>

            <div className="flex justify-center scale-110">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Link Failed')}
                useOneTap
                theme="outline"
                shape="pill"
              />
            </div>
          </form>

          <p className="mt-10 text-center text-xs text-gray-400 font-bold">
            ALREADY PART OF THE GALAXY?{' '}
            <Link to="/login" className="text-brand hover:text-brand-dark underline underline-offset-4 decoration-2">
              SIGN IN
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
