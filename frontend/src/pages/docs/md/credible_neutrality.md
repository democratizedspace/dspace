---
title: "Credible Neutrality"
slug: "credible_neutrality"
---

The architecture of DSPACE will be split into two categories:

- Protocol-level systems
- Platform-level systems

## Protocol-level systems

Protocol-level systems will be smart contracts that are deployed on the Ethereum blockchain (through an [L2](https://ethereum.org/en/layer-2/)). They are core to every multiplayer aspect of DSPACE:

- Shops and markets
- Jobs
- Content moderation

These systems will be **credibly neutral**. That is, with an Ethereum wallet can interact with them, and any possible transaction you can execute in the smart contracts will be uncensorable. This ensures that someone with a financial incentive (the [creator](https://futuroptimist.com) of the game, for example) or a desire to censor (an authoritarian government) cannot prevent you from executing some process in the way you expect. This also carries inherent risks:

- A bad actor can inspect the code of a smart contract and discover some vulnerability
- A bad actor can pretend to represent DSPACE and convince users to sign a transaction that drains their wallet
- A smart contract could have weaknesses that only emerge with scale

For this reason, these smart contracts will need to be as simple as possible to minimze the attack surface.

Probably the biggest challenge at the protocol level is [decentralized content moderation](https://jaygraber.medium.com/designing-decentralized-moderation-a76430a8eab). This is (probably) necessary, as a bad actor could use the quest system to irreversibly store illegal content on IPFS, and that content would exist forever if someone has the financial means to [pin](https://docs.ipfs.tech/how-to/pin-files/) it. A potential solution emerges: community members must be selected (in a cryptographically random way) in order to approve new submissions (e.g. quests, items) before they're immortalized on IPFS or a blockchain. More on this soon.

## Platform-level systems

At the platform level, things become a little more straightforward. Since DSPACE, accessible at [democratized.space](https://democratized.space), is hosted on a centralized platform like Netlify, it is easy to incorporate a blocklist that's stored in source code and evaluated at runtime on the backend, and this will probably be sufficient to quickly prevent spammy or illegal content from appearing on the main site. However, a lot of effort will be made to make the entire site easily forkable so that anyone can host their own instance of DSPACE. This will be a great way to experiment with new features and ideas, and it will also be a great way to circumvent censorship, like if your tachyon questline gets denied from the main site for not obeying the laws of physics.

## Conclusion

The intention is to enable a fun and safe environment for everyone to play DSPACE, but also to allow for a diversity of opinions and cultures to flourish. This is a difficult balance to strike, but it's the only way to make DSPACE a truly credibly neutral entity for maximum fairness and inclusivity.