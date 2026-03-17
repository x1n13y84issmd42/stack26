import * as amqp from 'amqplib/callback_api';

export function connect(host: string) {}

export class AMQPClient {
	protected connection!: amqp.Connection;
	protected channel!: amqp.Channel;

	constructor(protected queueName: string) {
		///
	}

	async connect(hostname: string, username: string, password: string) {
		return new Promise<void>((resolve, reject) => {
			amqp.connect({
				hostname,
				username,
				password,
			}, (err: any, conn: amqp.Connection) => {
				if (err) return reject(err);
				
				this.connection = conn;

				conn.createChannel((err: any, chan: amqp.Channel) => {
					if (err) return reject(err);

					this.channel = chan;

					chan.assertQueue(this.queueName, {durable: false});
					resolve();
				});
			});
		});
	}

	async close() {
		await new Promise(resolve => this.channel.close(resolve));
		await new Promise(resolve => this.connection.close(resolve));
	}
}

export class AMQPPublisher extends AMQPClient {
	send(data: any) {
		this.channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(data)));
	}
}

export class AMQPConsumer extends AMQPClient {
	onMessage(handler: (data: any) => void) {
		this.channel.consume(
			this.queueName,
			(msg: amqp.Message) => handler(JSON.parse(msg.content.toString())),
		);
	}
}

