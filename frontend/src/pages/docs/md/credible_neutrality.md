---
title: "Credible Neutrality"
slug: "credible_neutrality"
---

The architecture of DSPACE can be split into two categories:

- Protocol-level systems
- Platform-level systems

## Protocol-level systems

Protocol-level systems will be smart contracts that are deployed on the Ethereum blockchain (through an [L2](https://ethereum.org/en/layer-2/)). They are core to every multiplayer aspect of DSPACE:

- Shops and markets
- Jobs
- Content moderation

These systems will be **credibly neutral**. Anyone with an Ethereum wallet can interact with them, and any possible transaction you can execute in the smart contracts will be uncensorable. This ensures that someone with a financial incentive (the [creator](https://futuroptimist.com) of the game, for example) or a desire to censor (an authoritarian government) cannot prevent you from executing some process in the way you expect. This also carries inherenet risks:

- A bad actor can inspect the code of a smart contract and discover some vulnerability, like a governance attack, a memory overflow, or something even more creative
- A bad actor can pretend to represent DSPACE and convince users to sign a transaction that drains their wallet
- A smart contract could have weaknesses that only emerge with scale

For this reason, these smart contracts will need to be as simple as possible (to minimze the attack surface), and platform-level actions (like delisting a spammy quest or banning a malicious user) add extra complexity.

Probably the biggest challenge at the protocol level is [decentralized content moderation](https://jaygraber.medium.com/designing-decentralized-moderation-a76430a8eab). This is (probably) necessary, as a bad actor could use the quest system to irreversibly store illegal content on IPFS, and that content would exist forever if someone has the financial means to pin it. The solution is pretty clear: community members must be selected (in a cryptographically random way) in order to approve new submissions (e.g. quests, items) before they're immortalized on IPFS or a blockchain. A detailed proposal for this can be found [here](/docs/reviews).

## Platform-level systems

Platform-level systems are much easier, as the solution to the content moderation problem could be as simple as implementing a blocklist in the source code controlled by the owner of a traditional website. That owner owns the domain name, can change the DNS records, and has (sometimes exclusive) access to the server or hosting platform.

In the case of DSPACE, [democratized.space](https://democratized.space) is a centralized website (currently) hosted on Netlify. This will never change, but that particular instance of the DSPACE platform is intended to eventually be one of many clients. Theoretically, anyone could fork the [Git repository](https://github.com/democratizedspace/dspace) and host the entire app on their own server. In fact, this is encouraged! The open source [license](https://github.com/democratizedspace/dspace/blob/main/LICENSE) is as permissive as humanly possible. You can reuse it for any purpose, including commercial use, with or without attribution. While the main (and original) DSPACE website will always have inherent censorship risk (on purpose!!) in order to protect the overall brand and community, other instances of the platform will be able to implement their own rules and policies. This is a good thing, as it allows for a diversity of opinions and cultures to flourish.

Brand risk (trust, reputation, safety) is also enforced at the protocol level through the content moderation smart contracts, but those are also open sourcable, so there's flexibility there too.

## Conclusion

The intention is to enable a fun and safe environment for everyone to play DSPACE, but also to allow for a diversity of opinions and cultures to flourish. This is a difficult balance to strike, but it's the only way to make DSPACE a truly credibly neutral entity for maximum fairness and inclusivity.