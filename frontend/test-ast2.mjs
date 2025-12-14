import { compile } from 'svelte/compiler';

const source = `<button type="button">Click me</button>`;
try {
  const result = compile(source, { filename: 'test.svelte' });
  if (result.ast && result.ast.html) {
    const html = result.ast.html;
    console.log('HTML type:', html.type);
    console.log('HTML keys:', Object.keys(html));
    if (html.children) {
      console.log('Children count:', html.children.length);
      if (html.children[0]) {
        const firstChild = html.children[0];
        console.log('\n=== First Child ===');
        console.log('Type:', firstChild.type);
        console.log('Keys:', Object.keys(firstChild));
        console.log('Name:', firstChild.name);
        if (firstChild.attributes) {
          console.log('Attributes:', firstChild.attributes.length);
          console.log('\n=== Attribute Structure ===');
          console.log(JSON.stringify(firstChild.attributes[0], null, 2));
        }
      }
    }
  }
} catch (e) {
  console.error('Error:', e.message);
}
