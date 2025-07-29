import { render } from '@testing-library/svelte';
import ProgressBar from '../components/ProgressBar.svelte';

test('shows correct percent', () => {
    const { getByRole } = render(ProgressBar, { props: { progress: 50 } });
    const bar = getByRole('progressbar');
    expect(bar.style.width).toBe('50%');
});
