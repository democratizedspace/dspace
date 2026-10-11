import { assertCredentialLaunch } from './managedImportStorage.js';
export async function submitBundlePR(token, branch, bundleJson) {
    token = token.trim();
    const credentialFetch = async (...args) => {
        await assertCredentialLaunch('github', token);
        return fetch(...args);
    };
    const branchName = branch || `bundle-${Date.now()}`;
    const headers = {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
    };

    // Get the SHA of the base branch (main)
    const baseRefRes = await credentialFetch(
        'https://api.github.com/repos/democratizedspace/dspace/git/refs/heads/main',
        { headers }
    );
    if (!baseRefRes.ok) throw new Error(await baseRefRes.text());
    const baseRefData = await baseRefRes.json();
    const baseSha = baseRefData.object.sha;

    // Create the new branch
    const createBranchRes = await credentialFetch(
        'https://api.github.com/repos/democratizedspace/dspace/git/refs',
        {
            method: 'POST',
            headers,
            body: JSON.stringify({
                ref: `refs/heads/${branchName}`,
                sha: baseSha,
            }),
        }
    );
    if (!createBranchRes.ok) throw new Error(await createBranchRes.text());

    // Create the file on the new branch
    const content = btoa(unescape(encodeURIComponent(bundleJson)));
    const filePath = `submissions/bundles/${branchName}.json`;
    const res = await credentialFetch(
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

    // Create the pull request
    const prRes = await credentialFetch(
        'https://api.github.com/repos/democratizedspace/dspace/pulls',
        {
            method: 'POST',
            headers,
            body: JSON.stringify({
                title: `Custom content bundle: ${branchName}`,
                head: branchName,
                base: 'main',
                body: 'Automated custom content bundle submission containing quests, items, and/or processes.',
            }),
        }
    );
    if (!prRes.ok) throw new Error(await prRes.text());
    const prData = await prRes.json();
    return prData.html_url;
}
