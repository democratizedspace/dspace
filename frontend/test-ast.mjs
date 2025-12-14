import { compile } from 'svelte/compiler';

const source = `<button type="button">Click me</button>`;
try {
  const result = compile(source, { filename: 'test.svelte' });
  console.log('=== Svelte 5 Compile Result ===');
  console.log('Result keys:', Object.keys(result));
  console.log('Has ast:', !!result.ast);
  if (result.ast) {
    console.log('\n=== AST Structure ===');
    console.log('AST keys:', Object.keys(result.ast));
    if (result.ast.fragment) {
      console.log('\n=== Fragment Node ===');
      console.log('Fragment type:', result.ast.fragment.type);
      console.log('Fragment keys:', Object.keys(result.ast.fragment));
      if (result.ast.fragment.nodes) {
        console.log('Fragment nodes count:', result.ast.fragment.nodes.length);
        if (result.ast.fragment.nodes[0]) {
          const firstNode = result.ast.fragment.nodes[0];
          console.log('\n=== First Fragment Node ===');
          console.log('Node type:', firstNode.type);
          console.log('Node keys:', Object.keys(firstNode));
          console.log('Node name:', firstNode.name);
          if (firstNode.attributes) {
            console.log('Attributes count:', firstNode.attributes.length);
            console.log('\n=== First Attribute ===');
            console.log(JSON.stringify(firstNode.attributes[0], null, 2));
          }
        }
      }
    }
  }
} catch (e) {
  console.error('Error:', e.message);
}
