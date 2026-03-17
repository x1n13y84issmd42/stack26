import { AMQPConsumer } from '../../shared/q';

const consumer = new AMQPConsumer(`yolo_q`);

async function start() {
	await consumer.connect(process.env.AMQP_HOST, process.env.AMQP_USER, process.env.AMQP_PASS);
	consumer.onMessage((data: any) => {
		console.dir(data);
	});
}

start().then().catch();
