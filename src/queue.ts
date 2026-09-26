import { QueueMessage, PayloadMessage } from '../lib/types';

export const buildKey = ({ folder, slug }: { folder: string; slug: string }) => {
	const typeImage = '.webp';
	return folder + slug + typeImage;
};

export const processMessage = (payload: PayloadMessage, env: Env) => {
	const messages: QueueMessage[] = [];
	let featuredImage = '';
	let socialPoster = '';
	const siteKey = payload.host.split('.')[0];

	if (payload.saveFeaturedImage) {
		const keyFeaturedImage = buildKey({ folder: `media/${payload.site.theme}/${siteKey}/featured/${payload.id}-`, slug: payload.slug });
		featuredImage = payload.cdnHost + '/' + keyFeaturedImage;
		messages.push({
			method: 'GET',
			url: payload.post.featuredImage,
			key: keyFeaturedImage,
		});
	}
	if (payload.saveSocialPoster) {
		const keySocialPoster = buildKey({ folder: `media/${payload.site.theme}/${siteKey}/social/${payload.id}-`, slug: payload.slug });
		socialPoster = payload.cdnHost + '/' + keySocialPoster;
		messages.push({
			method: 'POST',
			url: env.ENDPOINT_SERVER_IMAGE_GENERATOR,
			key: keySocialPoster,
			payload: {
				site: payload.site,
				post: payload.post,
			},
		});
	}

	return { messages, featuredImage, socialPoster };
};
