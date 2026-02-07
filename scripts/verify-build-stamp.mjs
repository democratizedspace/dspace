import { verifyChatBuildStamp } from './verify-chat-build-stamp.mjs';

const run = async () => {
    await verifyChatBuildStamp();
};

run().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
