export async function submitBundlePR(token, branch, bundleJson) {
    const branchName = branch || `bundle-${Date.now()}`;
    const headers = {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
    };
    const content = btoa(unescape(encodeURIComponent(bundleJson)));
    const filePath = `submissions/bundles/${branchName}.json`;
    const res = await fetch(
        `https://api.github.com/repos/democratizedspace/dspace/contents/${filePath}`,
        {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                message: 'Add custom content bundle submission',
                content,
                branch: branchName,
            }),
        }
    );
    if (!res.ok) throw new Error(await res.text());
    const prRes = await fetch('https://api.github.com/repos/democratizedspace/dspace/pulls', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            title: `Custom content bundle: ${branchName}`,
            head: branchName,
            base: 'v3',
            body: 'Automated custom content bundle submission containing quests, items, and/or processes.',
        }),
    });
    if (!prRes.ok) throw new Error(await prRes.text());
    const prData = await prRes.json();
    return prData.html_url;
}
