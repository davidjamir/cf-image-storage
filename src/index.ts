export default {
	// Our fetch handler is invoked on a HTTP request: we can send a message to a queue
	// during (or after) a request.
	// https://developers.cloudflare.com/queues/platform/javascript-apis/#producer
	async fetch(req, env, ctx): Promise<Response> {
		console.log(req)
		// To send a message on a queue, we need to create the queue first
		// https://developers.cloudflare.com/queues/get-started/#3-create-a-queue
		await env.IMAGE_QUEUE.send({
			url: req.url,
			method: req.method,
			headers: Object.fromEntries(req.headers),
		});
		return new Response('Sent message to the queue');
	},
	// The queue handler is invoked when a batch of messages is ready to be delivered
	// https://developers.cloudflare.com/queues/platform/javascript-apis/#messagebatch
	async queue(batch, env): Promise<void> {
		// A queue consumer can make requests to other endpoints on the Internet,
		// write to R2 object storage, query a D1 Database, and much more.
		for (let message of batch.messages) {
			// Process each message (we'll just log these)
			console.log(`message ${message.id} processed: ${JSON.stringify(message.body)}`);
		}
	},
} satisfies ExportedHandler<Env, Error>;
