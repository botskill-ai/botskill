import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getOAuthUrl } from '@/lib/api';
import { Captcha } from '@/components/Captcha';

const LoginPage = () => {
  const { t } = useTranslation();
  const { login, loginWithOAuthToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthProcessing, setIsOAuthProcessing] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    captcha: '',
    captchaId: ''
  });
  const [captchaRefreshKey, setCaptchaRefreshKey] = useState(0);

  // 处理 OAuth 回调：URL 中带有 token 表示从第三方登录返回
  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const oauthError = searchParams.get('oauth_error');

    if (oauthError) {
      toast.error(decodeURIComponent(oauthError));
      setSearchParams({}, { replace: true });
      return;
    }

    if (token) {
      setIsOAuthProcessing(true);
      setIsLoading(true);
      const redirect = searchParams.get('redirect');
      loginWithOAuthToken(token, refreshToken || undefined)
        .then(() => {
          toast.success(t('auth.login.success') || 'Login successful!');
          // 清除 URL 参数
          setSearchParams({}, { replace: true });
          // 延迟一下确保状态更新完成
          setTimeout(() => {
            if (redirect) {
              navigate(redirect, { replace: true });
            } else {
              navigate('/', { replace: true });
            }
          }, 100);
        })
        .catch((err) => {
          console.error('OAuth login error:', err);
          toast.error(t('auth.login.generalError') || 'Login failed');
          setSearchParams({}, { replace: true });
        })
        .finally(() => {
          setIsLoading(false);
          setIsOAuthProcessing(false);
        });
    }
  }, [searchParams, loginWithOAuthToken, navigate, t, setSearchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证验证码
    if (!formData.captcha || !formData.captchaId) {
      toast.error(t('auth.captchaRequired', '请输入验证码'));
      return;
    }

    setIsLoading(true);

    try {
      await login(formData.email, formData.password, formData.captchaId, formData.captcha);
      
      // 显示成功消息
      toast.success(t('auth.login.success') || 'Login successful!');
      
      // 检查是否有 redirect 参数
      const redirect = searchParams.get('redirect');
      if (redirect) {
        navigate(redirect);
      } else {
        // 立即导航到主页或其他受保护的页面
        navigate('/');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = t('auth.login.generalError') || 'An error occurred during login';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      // 登录失败时刷新验证码
      setCaptchaRefreshKey(k => k + 1);
      setFormData(prev => ({ ...prev, captcha: '', captchaId: '' }));
    } finally {
      setIsLoading(false);
    }
  };

  // 如果正在处理 OAuth 登录，显示加载状态
  if (isOAuthProcessing) {
    return (
      <div className="bg-background">
        <div className="pt-14 pb-14">
          <div className="w-full max-w-md mx-auto p-6 space-y-6 bg-card rounded-xl border shadow-sm">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-4 animate-pulse">
                <User className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold font-heading">{t('auth.login.title')}</h2>
              <p className="text-muted-foreground mt-2">
                {t('auth.login.loading') || '正在登录...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="pt-14 pb-14">
        <div className="w-full max-w-md mx-auto p-6 space-y-6 bg-card rounded-xl border shadow-sm">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-primary rounded-full flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold font-heading">{t('auth.login.title')}</h2>
            <p className="text-muted-foreground mt-2">
              {t('auth.login.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                {t('auth.login.emailOrUsername') || t('auth.login.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="text"
                  placeholder={t('auth.login.emailPlaceholder') || 'your@email.com or username'}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium">
                  {t('auth.login.password')}
                </label>
                <a href="#" className="text-sm text-primary hover:underline">
                  {t('auth.login.forgotPassword')}
                </a>
              </div>
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
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm">
                {t('auth.login.rememberMe')}
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('auth.login.loading') : t('auth.login.signIn')}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            {t('auth.login.noAccount')}{' '}
            <a href="/register" className="text-primary hover:underline">
              {t('auth.login.signUp')}
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
    </div>
  );
};

export default LoginPage;