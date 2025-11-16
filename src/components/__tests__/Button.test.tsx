import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('应该正确渲染按钮文本', () => {
    render(<Button>点击我</Button>);

    const button = screen.getByRole('button', { name: '点击我' });
    expect(button).toBeInTheDocument();
  });

  it('应该在点击时调用onClick处理函数', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>点击我</Button>);

    const button = screen.getByRole('button', { name: '点击我' });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('应该支持禁用状态', () => {
    render(<Button disabled>禁用按钮</Button>);

    const button = screen.getByRole('button', { name: '禁用按钮' });
    expect(button).toBeDisabled();
  });

  it('应该支持不同的变体', () => {
    const { rerender } = render(<Button variant="default">默认按钮</Button>);
    let button = screen.getByRole('button', { name: '默认按钮' });
    expect(button).toHaveClass('bg-primary');

    rerender(<Button variant="destructive">危险按钮</Button>);
    button = screen.getByRole('button', { name: '危险按钮' });
    expect(button).toHaveClass('bg-destructive');
  });

  it('应该支持不同的尺寸', () => {
    const { rerender } = render(<Button size="default">默认大小</Button>);
    let button = screen.getByRole('button', { name: '默认大小' });
    expect(button).toHaveClass('h-10');

    rerender(<Button size="sm">小按钮</Button>);
    button = screen.getByRole('button', { name: '小按钮' });
    expect(button).toHaveClass('h-9');

    rerender(<Button size="lg">大按钮</Button>);
    button = screen.getByRole('button', { name: '大按钮' });
    expect(button).toHaveClass('h-11');
  });
});
