import Prism from 'prismjs';
import 'prism-svelte';

describe('Prism Svelte language', () => {
  it('highlights Svelte code without throwing', () => {
    const code = `<script>let count = 0;</script>`;
    expect(() => Prism.highlight(code, Prism.languages.svelte, 'svelte')).not.toThrow();
  });
});
