export const SITE = {
	title: 'Documentation',
	description: 'Your website description.',
	defaultLanguage: 'en_US',
};

export const OPEN_GRAPH = {
	image: {
		src: 'https://github.com/withastro/astro/blob/main/assets/social/banner.jpg?raw=true',
		alt:
			'astro logo on a starry expanse of space,' +
			' with a purple saturn-like planet floating in the right foreground',
	},
	twitter: 'astrodotbuild',
};

// This is the type of the frontmatter you put in the docs markdown files.
export type Frontmatter = {
	title: string;
	description: string;
	layout: string;
	image?: { src: string; alt: string };
	dir?: 'ltr' | 'rtl';
	ogLocale?: string;
	lang?: string;
};

export const KNOWN_LANGUAGES = {
	English: 'en',
} as const;
export const KNOWN_LANGUAGE_CODES = Object.values(KNOWN_LANGUAGES);

export const GITHUB_EDIT_URL = `https://github.com/democratizedspace/dspace/tree/main/docs`;

export const COMMUNITY_INVITE_URL = `https://astro.build/chat`;

// See "Algolia" section of the README for more information.
export const ALGOLIA = {
	indexName: 'XXXXXXXXXX',
	appId: 'XXXXXXXXXX',
	apiKey: 'XXXXXXXXXX',
};

export type Sidebar = Record<
	typeof KNOWN_LANGUAGE_CODES[number],
	Record<string, { text: string; link: string }[]>
>;
export const SIDEBAR: Sidebar = {
	en: {
		'The basics': [
			{ text: 'About', link: 'en/about' },
			{ text: 'Mission', link: 'en/mission' },
			{ text: 'Roadmap', link: 'en/roadmap' },
			{ text: 'FAQ', link: 'en/faq' },
			{ text: 'Glossary', link: 'en/glossary' },
			{ text: 'Contribute', link: 'en/contribute' },
		],
		'Concepts': [
			{ text: 'Hyperstructures', link: 'en/hyperstructures' },
			{ text: 'Decentralized science', link: 'en/desci' },
			{ text: 'Credible neutrality', link: 'en/desci' },
			{ text: 'Gradual decentralization', link: 'en/desci' },
		],
		'Skills': [
			{ text: '3D printing', link: 'en/3dprinting' },
			{ text: 'Solar panels', link: 'en/solar' },
			{ text: 'Hydroponics', link: 'en/solar' },
			{ text: 'Rockets', link: 'en/rockets' },
			{ text: 'Make simulations', link: 'en/simulations' },
			{ text: 'Make a quest', link: 'https://unlockable.quest/make' },
		],
		'Game systems': [
			{ text: 'Everything is real-time', link: 'en/realtime' },
			{ text: 'Space progression', link: 'en/space-progression' },
			{ text: 'Web3', link: 'en/web3' },
			{ text: 'Inventory', link: 'en/inventory' },
			{ text: 'Quests', link: 'en/quests' },
			{ text: 'Skills', link: 'en/skills' },
			{ text: 'Badges', link: 'en/badges' },
			{ text: 'Perks', link: 'en/perks' },
		],
		'Moderation': [
			{ text: 'Reviews', link: 'en/reviews' },
			{ text: 'Validators', link: 'en/validators' },
			{ text: 'Slashing', link: 'en/slashing' },
			{ text: 'Blocklist', link: 'en/blocklist' },
		],
	},
};
