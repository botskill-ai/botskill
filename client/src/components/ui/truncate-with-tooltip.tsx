import * as Tooltip from '@radix-ui/react-tooltip';
import { ReactNode } from 'react';

interface TruncateWithTooltipProps {
  children: ReactNode;
  content?: string;
  className?: string;
}

/** 缩略显示，悬停时通过 Tooltip 显示完整内容 */
export function TruncateWithTooltip({ children, content, className = '' }: TruncateWithTooltipProps) {
  const displayContent = content ?? (typeof children === 'string' ? children : '');
  const hasContent = displayContent && String(displayContent).trim().length > 0;

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <span className={`block truncate min-w-0 cursor-default ${className}`}>
          {children}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          sideOffset={4}
          className="z-[9999] max-w-sm px-3 py-2 text-sm bg-popover text-popover-foreground border border-border rounded-md shadow-md break-words"
        >
          {hasContent ? displayContent : children}
          <Tooltip.Arrow className="fill-popover" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
