import { processMessage } from './queue';
import { QueueMessage, PayloadMessage } from '../lib/types';

const allowedMethods = ['POST'];

export default {
	async fetch(request, env, ctx): Promise<Response> {
		try {
			// Athorization and Verification Method
			if (!allowedMethods.includes(request.method)) {
				return new Response('Method Not Allowed', {
					status: 405,
					headers: {
						Allow: allowedMethods.join(', '),
					},
				});
			}

			const auth = request.headers.get('Authorization');
			if (!auth?.startsWith('Bearer ')) {
				return new Response('Unauthorized', { status: 401 });
			}

			const token = auth.slice(7);
			if (token !== env.INTERNAL_SECRET) {
				return new Response('Unauthorized', { status: 401 });
			}

			// Processing Message send to Queue

			const payload: PayloadMessage = await request.json();

			// Checking link featured image
			const response = await fetch(payload.post.featuredImage);
			const contentType = response.headers.get('content-type');

			if (!response.ok) {
				throw new Error(`Failed to fetch image: ${response.status}`);
			}

			if (!response.body) {
				throw new Error('Failed to fetch image: response body is empty');
			}

			if (!contentType?.startsWith('image/')) {
				throw new Error(`Invalid content-type: ${contentType}`);
			}

			// Keep Gen Image Not Active
			const { messages, featuredImage, socialPoster } = processMessage(payload, env.ENDPOINT_SERVER_IMAGE_GENERATOR);

			await Promise.all(messages.map((message) => env.IMAGE_QUEUE.send(message)));

			return Response.json({
				success: true,
				message: 'Sent message to the queue',
				featuredImage,
				socialPoster,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.log(message);
			return Response.json({
				success: true,
				message,
				featuredImage: '',
				socialPoster: '',
			});
		}
	},

	async queue(batch, env): Promise<void> {
		for (let msg of batch.messages) {
			try {
				const message: QueueMessage = msg.body as unknown as QueueMessage;
				console.log('Message: ', { url: message.url, key: `https://${message.cdnHost}/${message.key}` });

				const options: RequestInit = {
					method: message.method,
				};

				if (message.method === 'POST') {
					options.headers = {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${env.INTERNAL_SECRET}`,
						'User-Agent': 'Request_Family/1.0',
					};
					options.body = JSON.stringify(message.payload);
				}

				const response = await fetch(message.url, options);
				const contentType = response.headers.get('content-type');

				if (!response.ok) {
					throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
				}
				if (!response.body) {
					throw new Error('Fetch failed: response body is empty');
				}

				if (!contentType?.startsWith('image/')) {
					throw new Error(`Invalid content-type: ${contentType}`);
				}

				const data = await response.arrayBuffer();
				if (data.byteLength === 0) {
					throw new Error('Response body is empty');
				}

				await env.IMAGE_BUCKET.put(message.key, data, {
					httpMetadata: {
						cacheControl: 'public, max-age=86400, s-maxage=31536000, immutable',
					},
					customMetadata: {
						title: message.title ?? '',
						description: message.description ?? '',
					},
				});
				console.log('Saved Success');

				msg.ack();
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				console.log('Retry Message', message);
				msg.retry();
			}
		}
	},
} satisfies ExportedHandler<Env, Error>;
