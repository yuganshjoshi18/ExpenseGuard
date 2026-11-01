import { render, screen, fireEvent } from '@testing-library/react';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { TrendingUp, TrendingDown } from 'lucide-react';

describe('StatCard', () => {
  test('renders title, value, and icon', () => {
    render(<StatCard title="Test Stat" value="$100.00" icon={<TrendingUp className="w-6 h-6" />} />);

    expect(screen.getByText('Test Stat')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  test('renders positive trend', () => {
    render(<StatCard
      title="Test"
      value="$100"
      icon={<TrendingUp />}
      trend={{ value: '+10%', label: 'vs last month', positive: true }}
    />);

    expect(screen.getByText(/\+10%/)).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  test('renders negative trend', () => {
    render(<StatCard
      title="Test"
      value="$100"
      icon={<TrendingDown />}
      trend={{ value: '-5%', label: 'vs last month', positive: false }}
    />);

    expect(screen.getByText(/-5%/)).toBeInTheDocument();
  });
});

describe('Button', () => {
  test('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  test('handles click', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  test('applies variant classes', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary-600');

    rerender(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });

  test('applies size classes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-3');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-6');
  });
});

describe('Input', () => {
  test('renders label and input', () => {
    render(<Input label="Email" placeholder="Enter email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  test('shows error message', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  test('shows helper text', () => {
    render(<Input label="Password" helperText="Must be 8+ characters" />);
    expect(screen.getByText('Must be 8+ characters')).toBeInTheDocument();
  });

  test('handles value change', () => {
    const handleChange = jest.fn();
    render(<Input value="test" onChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new value' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});

describe('Select', () => {
  test('renders options', () => {
    render(<Select
      label="Category"
      options={[
        { value: 'food', label: 'Food' },
        { value: 'transport', label: 'Transport' }
      ]}
    />);

    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Food' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Transport' })).toBeInTheDocument();
  });

  test('shows placeholder', () => {
    render(<Select
      placeholder="Select category"
      options={[]}
    />);
    expect(screen.getByRole('option', { name: 'Select category' })).toBeInTheDocument();
  });

  test('handles selection change', () => {
    const handleChange = jest.fn();
    render(<Select
      value="food"
      onChange={handleChange}
      options={[
        { value: 'food', label: 'Food' },
        { value: 'transport', label: 'Transport' },
      ]}
    />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'transport' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});

describe('Modal', () => {
  test('renders when open', () => {
    render(<Modal isOpen={true} onClose={jest.fn()} title="Test Modal">
      <p>Modal content</p>
    </Modal>);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(<Modal isOpen={false} onClose={jest.fn()}>
      <p>Hidden content</p>
    </Modal>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('closes on overlay click', () => {
    const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose}>
      <p>Content</p>
    </Modal>);

    fireEvent.click(screen.getByTestId('modal-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('closes on escape key', () => {
    const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose}>
      <p>Content</p>
    </Modal>);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Card', () => {
  test('renders header, title, and content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Card content</p>
        </CardContent>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });
});

describe('LoadingSpinner', () => {
  test('renders with default size', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('applies size classes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('status')).toHaveClass('w-4');

    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('w-12');
  });
});
