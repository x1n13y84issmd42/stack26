import {fastify, FastifyReply, FastifyRequest} from 'fastify';
import {fastifyView} from '@fastify/view';
import * as path from 'path';
import * as ejs from 'ejs';

const server = fastify({logger: true});
server.register(fastifyView, {
	engine: {
		ejs
	},
	root: path.join(__dirname, '..', 'tpl'),
});

console.dir(process.env);

server.get('/', (req: FastifyRequest, resp: FastifyReply) => {
	resp.view('index.ejs', {
		API_URL: `${process.env.API_HOST}:${process.env.API_PORT}`,
	});
});

server.listen({port: 80});
