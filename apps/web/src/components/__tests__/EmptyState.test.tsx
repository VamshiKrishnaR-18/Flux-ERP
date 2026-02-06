import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '../EmptyState';
import { FileText } from 'lucide-react';

describe('EmptyState', () => {
  it('renders content and triggers action', async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();

    render(
      <EmptyState
        title="No items"
        description="Add your first item"
        icon={FileText}
        actionLabel="Add Item"
        onAction={handleAction}
      />
    );

    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Add your first item')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add Item' }));
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});
