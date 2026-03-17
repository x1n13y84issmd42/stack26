import { fastify, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { fastifyWebsocket, WebSocket } from '@fastify/websocket';
import { AMQPPublisher } from '../../shared/q';

import prom from 'prom-client';

const promRegistry = new prom.Registry();
const countRequests = new prom.Counter({
	name: 'http_requests',
	help: 'Total number of requests to API endpoints.',
	labelNames: ['method', 'endoint', 'status'],
});

promRegistry.registerMetric(countRequests);

const pub = new AMQPPublisher('yolo_q');

const PORT = ~~process.env.PORT;
const f = fastify({logger: true});

f.register(fastifyWebsocket);

//#region BOILERPLATE
async function start() {
	try {
		// prom.collectDefaultMetrics({register: promRegistry});

		await pub.connect(process.env.AMQP_HOST, process.env.AMQP_USER, process.env.AMQP_PASS);
		f.listen({port: PORT});
	} catch(err) {
		console.log(err);
		process.exit(1);
	}
}

process.on('SIGINT', () => {
	console.log(`Got SIGINT`);
	shutdown();
});

process.on('unhandledRejection', () => {
	console.log(`Unhandled rejection :(`);
});

process.on('uncaughtException', (e) => {
	console.log(`Uncaught exception :(`, e);
});

async function shutdown() {
	console.log(`Performing graceful shutdown...`);
	await f.close()
	console.log(`Stopped HTTP server.`);
	process.exit(0);
}
//#endregion BOILERPLATE

f.addHook('onSend', async (req: FastifyRequest, resp: FastifyReply, payload: unknown) => {
	resp.header('Access-Control-Allow-Origin', '*');
	return payload;
});

f.addHook('onResponse', async (req: FastifyRequest, resp: FastifyReply) => {
	console.dir({
		method: req.method,
		url: req.url,
		statusCode: resp.statusCode.toString()
	});

	countRequests.labels(req.method, req.url, resp.statusCode.toString()).inc();
});

f.get('/metrics', async (req: FastifyRequest, resp: FastifyReply) => {
	// console.dir({metrics: await promRegistry.metrics()});
	
	resp
		.header('Content-type', promRegistry.contentType)
		.send(await promRegistry.metrics())
	;
});

//TODO: find a way to set ACAO header for all endpoints.
f.get('/test', async (req: FastifyRequest, resp: FastifyReply) => {
	pub.send({x: 'XXX', year: 2026});
	resp
		// .header('Access-Control-Allow-Origin', '*')
		.send({testMsg: 'yolo'})
	;
});

f.get('/unstable/breaks/dontuse', async (req: FastifyRequest, resp: FastifyReply) => {
	if (Math.random() < 0.3) {
		resp
			// .header('Access-Control-Allow-Origin', '*')
			.status(500)
			.send({testMsg: 'yolo'})
		;
	} else {
		resp
			// .header('Access-Control-Allow-Origin', '*')
			.send({testMsg: 'yolo'})
		;
	}
});

f.register(async (f: FastifyInstance) => {
	f.get('/ws', {websocket: true}, async (ws: WebSocket, req: FastifyRequest) => {
		wsHandler(ws);
	});
});

function wsHandler(ws: WebSocket) {
	ws.on('open', () => {console.log(`/ws on open`);});
	ws.on('close', () => {console.log(`/ws on close`);});
	ws.on('error', (err) => {console.dir({msg: `/ws on error`, err});});
	ws.on('message', async (msg: any) => {
		console.log(`/ws on message`);
		console.log(msg.toString());
	});

	let counter = 1;

	setInterval(() => {
		ws.send(JSON.stringify({msg: 'Back end says hi!', counter}));
		counter++;
	}, 1000);
}

start();
