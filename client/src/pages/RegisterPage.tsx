import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { getOAuthUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PolicyModal from '@/components/PolicyModal';
import { Captcha } from '@/components/Captcha';

const RegisterPage = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',  // 添加全名字段（可选）
    captcha: '',
    captchaId: ''
  });
  const [captchaRefreshKey, setCaptchaRefreshKey] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证密码匹配
    if (formData.password !== formData.confirmPassword) {
      toast.error(t('auth.register.passwordMismatch') || 'Passwords do not match');
      return;
    }

    // 验证验证码
    if (!formData.captcha || !formData.captchaId) {
      toast.error(t('auth.captchaRequired', '请输入验证码'));
      return;
    }

    setIsLoading(true);

    // 准备发送到API的数据
    const { confirmPassword, ...registrationData } = formData;

    try {
      await register(registrationData);
      
      // 显示成功消息
      toast.success(t('auth.register.success') || 'Registration successful!');
      
      // 立即导航到主页或其他页面
      navigate('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = t('auth.register.generalError') || 'An error occurred during registration';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      // 注册失败时刷新验证码
      setCaptchaRefreshKey(k => k + 1);
      setFormData(prev => ({ ...prev, captcha: '', captchaId: '' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background">
      <div className="pt-14 pb-14">
        <div className="w-full max-w-md mx-auto p-6 space-y-6 bg-card rounded-xl border shadow-sm">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold font-heading">{t('auth.register.title')}</h2>
            <p className="text-muted-foreground mt-2">
              {t('auth.register.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                {t('auth.register.username')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                {t('auth.register.fullName')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                {t('auth.register.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                {t('auth.register.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t('auth.register.passwordRequirement')}
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                {t('auth.register.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Captcha
              key={captchaRefreshKey}
              value={formData.captcha}
              onChange={(value, captchaId) => {
                setFormData(prev => ({ ...prev, captcha: value, captchaId }));
              }}
              onRefresh={() => {
                setFormData(prev => ({ ...prev, captcha: '', captchaId: '' }));
              }}
            />

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm">
                {t('auth.register.acceptTerms')}{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTermsModal(true);
                  }}
                  className="text-primary hover:underline"
                >
                  {t('auth.register.terms')}
                </button>
                {' '}{t('auth.register.and')}{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPrivacyModal(true);
                  }}
                  className="text-primary hover:underline"
                >
                  {t('auth.register.privacy')}
                </button>
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('auth.register.loading') : t('auth.register.signUp')}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            {t('auth.register.hasAccount')}{' '}
            <a href="/login" className="text-primary hover:underline">
              {t('auth.register.signIn')}
            </a>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('auth.login.orContinueWith')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a href={getOAuthUrl('google')} className="contents">
              <Button variant="outline" type="button" className="w-full">
                {t('auth.login.continueWithGoogle')}
              </Button>
            </a>
            <a href={getOAuthUrl('github')} className="contents">
              <Button variant="outline" type="button" className="w-full">
                {t('auth.login.continueWithGithub')}
              </Button>
            </a>
          </div>
        </div>
      </div>

      <PolicyModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        type="terms"
      />
      <PolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        type="privacy"
      />
    </div>
  );
};

export default RegisterPage;