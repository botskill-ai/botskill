import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '@/components/ui/button';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="切换主题" className={className}>
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h5 w-5" />
      )}
    </Button>
  );
};

export default ThemeToggle;