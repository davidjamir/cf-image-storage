import { QueueMessage, PayloadMessage } from '../lib/types';

export const buildKey = ({ folder, slug }: { folder: string; slug: string }) => {
	const typeImage = '.webp';
	return folder + slug + typeImage;
};

export const processMessage = (payload: PayloadMessage, endpoint: string) => {
	const messages: QueueMessage[] = [];
	let featuredImage = '';
	let socialPoster = '';
	const siteKey = payload.host.split('.')[0];

	if (payload.saveFeaturedImage) {
		const keyFeaturedImage = buildKey({
			folder: `media/${payload.site.theme}/${siteKey}/featured/`,
			slug: `${payload.slug}-${payload.id}`,
		});
		featuredImage = 'https://' + payload.cdnHost + '/' + keyFeaturedImage;
		messages.push({
			method: 'GET',
			url: payload.post.featuredImage,
			key: keyFeaturedImage,
			cdnHost: payload.cdnHost,
			title: payload.post.title,
			description: payload.post.snippet,
		});
	}
	if (payload.saveSocialPoster) {
		const keySocialPoster = buildKey({
			folder: `media/${payload.site.theme}/${siteKey}/social/`,
			slug: `${payload.slug}-${payload.id}`,
		});
		socialPoster = 'https://' + payload.cdnHost + '/' + keySocialPoster;
		messages.push({
			method: 'POST',
			url: endpoint,
			key: keySocialPoster,
			cdnHost: payload.cdnHost,
			title: payload.post.title,
			description: payload.post.snippet,
			payload: {
				site: payload.site,
				post: payload.post,
			},
		});
	}

	return { messages, featuredImage, socialPoster };
};
