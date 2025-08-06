import { visit } from 'unist-util-visit';

export default function textToPlain() {
    return (tree) => {
        visit(tree, 'code', (node) => {
            if (node.lang === 'text') {
                node.lang = undefined;
            }
        });
    };
}
