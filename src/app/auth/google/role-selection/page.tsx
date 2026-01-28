'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, Video, Settings } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

const roles = [
  {
    value: 'EDITOR',
    label: 'Editor',
    description: 'Chỉnh sửa và sản xuất video',
    icon: Video,
    color: 'bg-blue-500',
  },
  {
    value: 'CONTENT',
    label: 'Content Creator',
    description: 'Tạo nội dung và kịch bản',
    icon: Users,
    color: 'bg-green-500',
  },
];

export default function RoleSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loadUser } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const tempToken = searchParams.get('tempToken');

  useEffect(() => {
    if (!tempToken) {
      router.push('/login?error=Invalid session');
    }
  }, [tempToken, router]);

  const handleRoleSelect = async () => {
    if (!selectedRole) {
      setError('Vui lòng chọn vai trò');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Completing Google registration with:', { tempToken, role: selectedRole });
      
      // Complete Google registration with selected role
      const response = await apiClient.post('/auth/google/complete', {
        tempToken,
        role: selectedRole,
      });

      console.log('Registration response:', response.data);

      // Save token to localStorage (check the key name used by backend)
      const token = response.data.access_token || response.data.token;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('auth_token', token);
      }

      // Load user profile
      await loadUser();

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Failed to complete registration:', err);
      console.error('Error response:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || err.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chọn vai trò của bạn
          </h1>
          <p className="text-gray-600">
            Vui lòng chọn vai trò phù hợp với công việc của bạn
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-2xl mx-auto">
          {roles.map((role) => (
            <button
              key={role.value}
              onClick={() => setSelectedRole(role.value)}
              disabled={isLoading}
              type="button"
              className={`relative z-10 p-6 rounded-xl border-2 transition-all ${
                selectedRole === role.value
                  ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-102'}`}
              style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
            >
              <div className={`${role.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto pointer-events-none`}>
                <role.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 pointer-events-none">
                {role.label}
              </h3>
              <p className="text-sm text-gray-600 pointer-events-none">{role.description}</p>
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleRoleSelect}
            disabled={!selectedRole || isLoading}
            className={`px-8 py-3 rounded-lg font-medium transition-all ${
              selectedRole && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Đang xử lý...
              </span>
            ) : (
              'Tiếp tục'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
