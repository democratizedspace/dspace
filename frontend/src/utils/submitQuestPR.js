export async function submitQuestPR(token, branch, questJson) {
    const branchName = branch || `quest-${Date.now()}`;
    const headers = {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
    };
    const content = btoa(unescape(encodeURIComponent(questJson)));
    const filePath = `submissions/quests/${branchName}.json`;
    const res = await fetch(
        `https://api.github.com/repos/democratizedspace/dspace/contents/${filePath}`,
        {
            method: 'PUT',
            headers,
            body: JSON.stringify({ message: 'Add quest submission', content, branch: branchName }),
        }
    );
    if (!res.ok) throw new Error(await res.text());
    const prRes = await fetch('https://api.github.com/repos/democratizedspace/dspace/pulls', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            title: `Quest submission: ${branchName}`,
            head: branchName,
            base: 'v3',
            body: 'Automated quest submission.',
        }),
    });
    if (!prRes.ok) throw new Error(await prRes.text());
    const prData = await prRes.json();
    return prData.html_url;
}
