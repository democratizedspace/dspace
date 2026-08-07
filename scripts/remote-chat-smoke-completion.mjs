import { writeFile } from 'node:fs/promises';

export const remoteChatSmokeCompletionMarker =
  'dspace-remote-chat-smoke-journey-complete-v1\n';

export async function writeRemoteChatSmokeCompletion(file) {
  await writeFile(file, remoteChatSmokeCompletionMarker, {
    encoding: 'utf8',
    mode: 0o600,
    flag: 'w',
  });
}
