'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/types/auth';
import { motion } from 'framer-motion';
import { Loader2, User, Mail, Lock, ArrowRight, Briefcase } from 'lucide-react';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
    .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
    .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số'),
  role: z.nativeEnum(UserRole),
  manager_id: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, clearError, error } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: UserRole.CONTENT,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      clearError();
      await registerUser(data);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0f172a] relative overflow-hidden flex items-center justify-center font-sans selection:bg-blue-500/30">

      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl animate-pulse-slow will-change-transform"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow delay-1000 will-change-transform"></div>
      </div>

      <div className="container px-4 mx-auto relative z-10 flex flex-col items-center">

        {/* Logo/Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl shadow-blue-500/20 mb-4">
            <img src="/logo-vcb.jfif" alt="VCB" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Viễn Chí Bảo</h2>
          <p className="text-slate-400 text-sm mt-1">Đăng ký thành viên mới</p>
        </motion.div>

        {/* Glass Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-[480px]"
        >
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">

            <div className="mb-6 text-center">
              <h1 className="text-xl font-semibold text-white mb-2">Tạo tài khoản</h1>
              <p className="text-slate-400 text-sm">Điền thông tin để bắt đầu</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 ml-1">Họ và tên</label>
                <div className="relative group">
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    {...register('full_name')}
                    type="text"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                {errors.full_name && <p className="text-xs text-red-400 ml-1">{errors.full_name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 ml-1">Email (Tên đăng nhập)</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-400 ml-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 ml-1">Mật khẩu</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    {...register('password')}
                    type="password"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && <p className="text-xs text-red-400 ml-1">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 ml-1">Vai trò</label>
                <div className="relative group">
                  <Briefcase className="absolute left-4 top-3.5 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <select
                    {...register('role')}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium appearance-none cursor-pointer"
                  >
                    <option value={UserRole.CONTENT} className="bg-slate-900 text-slate-200">Content Creator</option>
                    <option value={UserRole.EDITOR} className="bg-slate-900 text-slate-200">Video Editor</option>
                    {/* ADMIN and MANAGER roles removed as requested */}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-4"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Đăng ký ngay <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

            </form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              Đã có tài khoản?{' '}
              <Link
                href="/login"
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                onClick={() => clearError()}
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
