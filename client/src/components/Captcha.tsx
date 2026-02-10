import { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { captchaAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface CaptchaProps {
  value?: string;
  onChange?: (value: string, captchaId: string) => void;
  onRefresh?: () => void;
  className?: string;
}

export const Captcha = ({ value, onChange, onRefresh, className }: CaptchaProps) => {
  const { t } = useTranslation();
  const [captchaId, setCaptchaId] = useState<string>('');
  const [inputValue, setInputValue] = useState(value || '');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 同步外部 value 变化
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  // 生成验证码
  const generateCaptcha = async () => {
    try {
      setLoading(true);
      const response = await captchaAPI.generate();
      const data = response.data.data || response.data;
      
      setCaptchaId(data.captchaId);
      setInputValue('');
      if (onChange) {
        onChange('', data.captchaId);
      }
      
      // 绘制验证码到 canvas
      drawCaptcha(data.text);
    } catch (error: any) {
      console.error('Error generating captcha:', error);
      toast.error(error.response?.data?.error || t('captcha.generateError', '生成验证码失败'));
    } finally {
      setLoading(false);
    }
  };

  // 在 canvas 上绘制验证码
  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 设置背景
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);

    // 添加干扰线
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100}, 0.3)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.stroke();
    }

    // 绘制文字
    const chars = text.split('');
    const charWidth = width / chars.length;
    
    chars.forEach((char, index) => {
      const x = charWidth * index + charWidth / 2;
      const y = height / 2 + 10;
      
      // 随机颜色
      ctx.fillStyle = `rgb(${Math.random() * 100 + 50}, ${Math.random() * 100 + 50}, ${Math.random() * 100 + 50})`;
      
      // 随机旋转
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.5);
      
      // 随机字体大小
      const fontSize = 24 + Math.random() * 8;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });

    // 添加干扰点
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // 初始化时生成验证码
  useEffect(() => {
    generateCaptcha();
  }, []);

  // 当输入值变化时，通知父组件
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    setInputValue(newValue);
    if (onChange && captchaId) {
      onChange(newValue, captchaId);
    }
  };

  // 刷新验证码
  const handleRefresh = () => {
    generateCaptcha();
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2">
        {t('captcha.label', '验证码')}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={t('captcha.placeholder', '请输入验证码')}
            maxLength={4}
            className="uppercase"
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <canvas
            ref={canvasRef}
            width={120}
            height={40}
            className="border rounded cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleRefresh}
            title={t('captcha.clickToRefresh', '点击刷新验证码')}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-10 px-3"
            title={t('captcha.refresh', '刷新验证码')}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
};
