import { QueueMessage, PayloadMessage } from '../lib/types';

export const buildKey = ({ folder, slug }: { folder: string; slug: string }) => {
	const typeImage = '.webp';
	return folder + slug + typeImage;
};

export const buildImagekitProxyUrl = ({
	originUrl,
	imagekitProxyId,
	filter = 'tr:f-webp',
}: {
	originUrl: string;
	imagekitProxyId: string;
	filter?: string;
}) => {
	const ImagekitCDNDomain = 'https://ik.imagekit.io';
	return [ImagekitCDNDomain, imagekitProxyId, filter, originUrl].join('/');
};

export const buildCloudinaryProxyUrl = ({
	originUrl,
	cloudinaryProxyId,
	filter = 'f_webp,q_auto:best',
}: {
	originUrl: string;
	cloudinaryProxyId: string;
	filter?: string;
}) => {
	const CloudinaryCDNDomain = 'https://res.cloudinary.com';
	const type = 'image';
	const action = 'fetch';
	return [CloudinaryCDNDomain, cloudinaryProxyId, type, action, filter, originUrl].join('/');
};

export const processMessage = (
	payload: PayloadMessage,
	endpointImageGenerator: string,
	imagekitProxyId: string,
	cloudinaryProxyId: string,
) => {
	const messages: QueueMessage[] = [];
	let featuredImage = '';
	let thumbnailImage = '';
	let socialPoster = '';
	const siteKey = payload.host.split('.')[0];

	if (payload.saveFeaturedImage) {
		const keyFeaturedImage = buildKey({
			folder: `media/${payload.site.theme}/${siteKey}/`,
			slug: `${payload.slug}-featured-${payload.id}`,
		});
		featuredImage = 'https://' + payload.cdnHost + '/' + keyFeaturedImage;

		const url = buildImagekitProxyUrl({
			originUrl: payload.post.featuredImage,
			imagekitProxyId,
		});
		messages.push({
			method: 'GET',
			url,
			key: keyFeaturedImage,
			cdnHost: payload.cdnHost,
			title: payload.post.title,
		});
	}

	if (payload.saveThumbnailImage) {
		const keyThumbnailImage = buildKey({
			folder: `media/${payload.site.theme}/${siteKey}/`,
			slug: `${payload.slug}-thumbnail-${payload.id}`,
		});
		thumbnailImage = 'https://' + payload.cdnHost + '/' + keyThumbnailImage;

		const filter = 'c_auto,g_auto,w_640,h_640,f_webp,q_auto:best';
		const url = buildCloudinaryProxyUrl({
			originUrl: payload.post.featuredImage,
			cloudinaryProxyId,
			filter,
		});
		messages.push({
			method: 'GET',
			url,
			key: keyThumbnailImage,
			cdnHost: payload.cdnHost,
			title: payload.post.title,
		});
	}

	if (payload.saveSocialPoster) {
		const keySocialPoster = buildKey({
			folder: `media/${payload.site.theme}/${siteKey}`,
			slug: `${payload.slug}-social-${payload.id}`,
		});
		socialPoster = 'https://' + payload.cdnHost + '/' + keySocialPoster;
		messages.push({
			method: 'POST',
			url: endpointImageGenerator,
			key: keySocialPoster,
			cdnHost: payload.cdnHost,
			title: payload.post.title,
			payload: {
				site: payload.site,
				post: payload.post,
			},
		});
	}

	return { messages, featuredImage, thumbnailImage, socialPoster };
};
