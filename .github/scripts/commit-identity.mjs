import { createHash } from 'node:crypto';

// No logging of API objects, metadata, exceptions, or caller-provided categories.
export const categories = new Set([
  'EXPECTED_COMMITTER',
  'COMMITTER_IDENTITY_MISMATCH',
  'ATTRIBUTED_COMMITTER_UNREVIEWED',
  'BOT_ATTRIBUTION_UNREVIEWED',
  'COVERAGE_NULL_ATTRIBUTION',
  'COVERAGE_INVALID_METADATA',
  'COVERAGE_INVALID_POLICY',
  'COVERAGE_API_ERROR',
  'COVERAGE_INVALID_RESPONSE',
  'COVERAGE_INCOMPLETE_PAGINATION',
  'COVERAGE_CHANGED_PR',
  'COVERAGE_NEW_BRANCH',
  'COVERAGE_FORCE_PUSH',
  'COVERAGE_DELETED_BRANCH',
  'COVERAGE_INVALID_EVENT',
  'COVERAGE_UNEXPECTED_ERROR',
  'COVERAGE_COMMIT_LIST_COMPLETE',
]);
export const shaPattern = /^[a-f0-9]{40}$(?![\s\S])/;
export const repoPattern =
  /^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9_][A-Za-z0-9_.-]{0,99}$(?![\s\S])/;
const digestPattern = /^[a-f0-9]{64}$(?![\s\S])/;
const zero = '0'.repeat(40);
export const digest = (value) =>
  createHash('sha256').update(value, 'utf8').digest('hex');
const positive = (value) => Number.isSafeInteger(value) && value > 0;
const validSha = (value) =>
  typeof value === 'string' && shaPattern.test(value) && value !== zero;
const failures = new WeakMap();
const fail = (category) => {
  const error = new Error();
  failures.set(error, category);
  throw error;
};

export function reporter(
  repository,
  write = (line) => process.stdout.write(line)
) {
  const prefix =
    typeof repository === 'string' && repoPattern.test(repository)
      ? `${repository} `
      : '';
  return (category, sha) => {
    const safe = categories.has(category)
      ? category
      : 'COVERAGE_UNEXPECTED_ERROR';
    const warning = ![
      'EXPECTED_COMMITTER',
      'ATTRIBUTED_COMMITTER_UNREVIEWED',
      'BOT_ATTRIBUTION_UNREVIEWED',
      'COVERAGE_COMMIT_LIST_COMPLETE',
    ].includes(safe);
    write(
      `${warning ? '::warning::' : ''}${prefix}${validSha(sha) ? `${sha} ` : ''}${safe}\n`
    );
  };
}

export function policyEntries(policy, repository) {
  const entries = policy?.repositories?.[repository]?.committers;
  if (
    policy?.version !== 1 ||
    !Array.isArray(entries) ||
    entries.length === 0
  ) {
    fail('COVERAGE_INVALID_POLICY');
  }
  const ids = new Set();
  for (const entry of entries) {
    if (
      !positive(entry.accountId) ||
      ids.has(entry.accountId) ||
      !/^[A-Za-z0-9-]{1,39}$(?![\s\S])/.test(entry.login) ||
      !digestPattern.test(entry.nameSha256) ||
      !digestPattern.test(entry.emailSha256)
    ) {
      fail('COVERAGE_INVALID_POLICY');
    }
    ids.add(entry.accountId);
  }
  return entries;
}

export function inspectCommit(commit, entries, emit) {
  if (!validSha(commit?.sha)) {
    emit('COVERAGE_INVALID_METADATA');
    return;
  }
  const sha = commit.sha;
  const raw = commit.commit?.committer;
  if (
    typeof raw?.name !== 'string' ||
    typeof raw?.email !== 'string' ||
    raw.name.length === 0 ||
    raw.email.length === 0 ||
    raw.name.length > 1024 ||
    raw.email.length > 1024
  ) {
    emit('COVERAGE_INVALID_METADATA', sha);
    return;
  }
  const name = digest(raw.name);
  const email = digest(raw.email);
  const account = commit.committer;
  // Authors are deliberately not compared: imports/cherry-picks retain authorship.
  // API attribution is evidence for review, not authentication or authorization.
  const entry = entries.find(
    (candidate) =>
      candidate.accountId === account?.id ||
      candidate.nameSha256 === name ||
      candidate.emailSha256 === email
  );
  if (entry) {
    if (
      name !== entry.nameSha256 ||
      email !== entry.emailSha256 ||
      (account !== null && account?.id !== entry.accountId)
    ) {
      emit('COMMITTER_IDENTITY_MISMATCH', sha);
    } else {
      emit('EXPECTED_COMMITTER', sha);
    }
  } else if (account?.type === 'Bot' && positive(account.id)) {
    // A self-declared Git name ending in [bot] never selects this category.
    emit('BOT_ATTRIBUTION_UNREVIEWED', sha);
  } else if (positive(account?.id) && account?.type === 'User') {
    emit('ATTRIBUTED_COMMITTER_UNREVIEWED', sha);
  }
  if (account === null) emit('COVERAGE_NULL_ATTRIBUTION', sha);
  else if (!positive(account?.id) || !['User', 'Bot'].includes(account?.type)) {
    emit('COVERAGE_INVALID_METADATA', sha);
  }
}

export function decodeJson(bytes) {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    fail('COVERAGE_INVALID_RESPONSE');
  }
}

// Never follow API-supplied links, redirects, or URLs. Page numbers are generated here.
export function apiClient(repository, token, fetcher = fetch) {
  if (!repoPattern.test(repository)) fail('COVERAGE_INVALID_EVENT');
  return async (path) => {
    let response;
    try {
      response = await fetcher(
        `https://api.github.com/repos/${repository}/${path}`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
          },
          redirect: 'error',
          signal: AbortSignal.timeout(20000),
        }
      );
    } catch {
      fail('COVERAGE_API_ERROR');
    }
    if (!response.ok) fail('COVERAGE_API_ERROR');
    let bytes;
    try {
      const reader = response.body.getReader();
      const chunks = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 8 * 1024 * 1024) {
          await reader.cancel();
          fail('COVERAGE_INVALID_RESPONSE');
        }
        chunks.push(value);
      }
      bytes = Buffer.concat(chunks);
    } catch {
      fail('COVERAGE_INVALID_RESPONSE');
    }
    return {
      data: decodeJson(bytes),
      link: response.headers.get('link') || '',
    };
  };
}

async function enumerate(get, path, expected, compare, emit) {
  const commits = [];
  const seen = new Set();
  let complete = false;
  for (let page = 1; page <= 30; page++) {
    const { data, link } = await get(`${path}?per_page=100&page=${page}`);
    const items = compare ? data?.commits : data;
    if (
      !Array.isArray(items) ||
      items.length > 100 ||
      (compare && data.total_commits !== expected)
    ) {
      fail('COVERAGE_INVALID_RESPONSE');
    }
    for (const commit of items) {
      if (!validSha(commit?.sha) || seen.has(commit.sha))
        fail('COVERAGE_INCOMPLETE_PAGINATION');
      seen.add(commit.sha);
      commits.push(commit);
    }
    const next = /rel="next"/.test(link);
    // Count agreement plus a terminal page are both required. Never trust a count alone.
    if (!next && (items.length < 100 || commits.length === expected)) {
      complete = true;
      break;
    }
    if (commits.length > expected) break;
  }
  if (!complete || commits.length !== expected)
    emit('COVERAGE_INCOMPLETE_PAGINATION');
  return { commits, complete: complete && commits.length === expected };
}

export async function run({ event, eventName, repository, policy, get, emit }) {
  try {
    if (
      !repoPattern.test(repository) ||
      event?.repository?.full_name !== repository
    ) {
      fail('COVERAGE_INVALID_EVENT');
    }
    const entries = policyEntries(policy, repository);
    let result;
    let head;
    let limited = false;
    if (eventName === 'pull_request_target') {
      const pr = event.pull_request;
      if (
        !positive(pr?.number) ||
        !validSha(pr.head?.sha) ||
        !validSha(pr.base?.sha)
      ) {
        fail('COVERAGE_INVALID_EVENT');
      }
      const path = `pulls/${pr.number}`;
      const before = (await get(path)).data;
      if (
        before?.head?.sha !== pr.head.sha ||
        before?.base?.sha !== pr.base.sha ||
        !positive(before.commits)
      ) {
        fail('COVERAGE_CHANGED_PR');
      }
      head = pr.head.sha;
      result = await enumerate(
        get,
        `${path}/commits`,
        before.commits,
        false,
        emit
      );
      const after = (await get(path)).data;
      if (
        after?.head?.sha !== head ||
        after?.base?.sha !== pr.base.sha ||
        after?.commits !== before.commits
      ) {
        emit('COVERAGE_CHANGED_PR', head);
        limited = true;
      }
      if (before.commits > 250) {
        emit('COVERAGE_INCOMPLETE_PAGINATION', head);
        limited = true;
      }
    } else if (eventName === 'push') {
      if (
        typeof event.ref !== 'string' ||
        !event.ref.startsWith('refs/heads/') ||
        typeof event.before !== 'string' ||
        !shaPattern.test(event.before) ||
        typeof event.after !== 'string' ||
        !shaPattern.test(event.after) ||
        typeof event.created !== 'boolean' ||
        typeof event.deleted !== 'boolean' ||
        typeof event.forced !== 'boolean'
      )
        fail('COVERAGE_INVALID_EVENT');
      if (event.deleted && event.after === zero) {
        emit('COVERAGE_DELETED_BRANCH', event.before);
        return;
      }
      if (!validSha(event.after) || event.deleted)
        fail('COVERAGE_INVALID_EVENT');
      head = event.after;
      if (event.created || event.before === zero) {
        emit('COVERAGE_NEW_BRANCH', head);
        limited = true;
        result = {
          commits: [(await get(`commits/${head}`)).data],
          complete: false,
        };
      } else {
        const path = `compare/${event.before}...${head}`;
        const comparison = (await get(`${path}?per_page=1&page=1`)).data;
        if (
          !Number.isSafeInteger(comparison?.total_commits) ||
          comparison.total_commits < 0 ||
          !['ahead', 'behind', 'diverged', 'identical'].includes(
            comparison.status
          )
        ) {
          fail('COVERAGE_INVALID_RESPONSE');
        }
        if (event.forced || comparison.status !== 'ahead') {
          emit('COVERAGE_FORCE_PUSH', head);
          limited = true;
        }
        result = await enumerate(
          get,
          path,
          comparison.total_commits,
          true,
          emit
        );
      }
    } else {
      fail('COVERAGE_INVALID_EVENT');
    }
    for (const commit of result.commits) inspectCommit(commit, entries, emit);
    if (!result.commits.some((commit) => commit?.sha === head)) {
      emit('COVERAGE_INCOMPLETE_PAGINATION', head);
      limited = true;
    }
    if (result.complete && !limited)
      emit('COVERAGE_COMMIT_LIST_COMPLETE', head);
  } catch (error) {
    // Only our fixed coverage enums survive, never a raw exception or its stack.
    emit(failures.get(error) || 'COVERAGE_UNEXPECTED_ERROR');
  }
}
