export async function submitProcessPR(token, branch, processJson) {
    const branchName = branch || `process-${Date.now()}`;
    const headers = {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
    };
    const content = btoa(unescape(encodeURIComponent(processJson)));
    const filePath = `submissions/processes/${branchName}.json`;
    const res = await fetch(
        `https://api.github.com/repos/democratizedspace/dspace/contents/${filePath}`,
        {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                message: 'Add process submission',
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
            title: `Process submission: ${branchName}`,
            head: branchName,
            base: 'v3',
            body: 'Automated process submission.',
        }),
    });
    if (!prRes.ok) throw new Error(await prRes.text());
    const prData = await prRes.json();
    return prData.html_url;
}
