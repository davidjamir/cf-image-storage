export type QueueMessage = {
	method: 'GET' | 'POST';
	url: string;
	key: string;
	payload?: unknown;
};

export type PayloadMessage = {
	id: string;
	origin: string;
	host: string;
	cdnHost: string;
	slug: string;
	segment: string;
	saveFeaturedImage: boolean;
	saveSocialPoster: boolean;
	site: {
		host: string;
		name: string;
		entity?: string;
		config: {
			customOpengraphImage: boolean;
			symbolOg: string;
			primaryColor: string;
			accentColor: string;
		};
	};
	post: {
		title: string;
		snippet: string;
		featuredImage: string;
		author: string;
	};
};
