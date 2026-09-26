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
			console.log(payload);

			// Keep Gen Image Not Active
			payload.saveSocialPoster = false;
			const { messages, featuredImage, socialPoster } = processMessage(payload, env);

			await Promise.all(messages.map((message) => env.IMAGE_QUEUE.send(message)));

			return Response.json({
				success: true,
				message: 'Sent message to the queue',
				featuredImage,
				socialPoster,
			});
		} catch (error) {
			return new Response('Failer', { status: 500 });
		}
	},

	async queue(batch, env): Promise<void> {
		for (let msg of batch.messages) {
			try {
				const message: QueueMessage = msg.body as unknown as QueueMessage;

				console.log(message);

				const options: RequestInit = {
					method: message.method,
				};

				if (message.method === 'POST') {
					options.headers = {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${env.INTERNAL_SECRET}`,
					};
					options.body = JSON.stringify(message.payload);
				}

				const response = await fetch(message.url, options);

				if (!response.ok || !response.body) {
					throw new Error(`Failed to fetch image: ${response.status}`);
				}

				await env.IMAGE_BUCKET.put(message.key, response.body);

				msg.ack();
			} catch (error) {
				msg.retry();
			}
		}
	},
} satisfies ExportedHandler<Env, Error>;
