
const { Kafka } = require('kafkajs');
const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'kafka-nodejs-example',
    brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS || 'pkc-6ojv2.us-west4.gcp.confluent.cloud:9092'],
    ssl: true,
    sasl: {
        mechanism: 'plain',
        username: process.env.KAFKA_USERNAME || 'J4NQ7Y7ULVIYMYER',
        password: process.env.KAFKA_PASSWORD || 'SeQhSpBCeo2R0pSK2ggv/yF/+OSYI7LEpnJ8Q9eHY937L9vistDUrIwXmvXO1YL7'
    }
});

const producer = kafka.producer();
const producerfunc = async (topic, msg) => {
    console.log(topic, msg)

    await producer.connect()
        .then(() => console.log('Connected to Confluent Cloud'))
        .catch(err => console.log(`Error connecting to Confluent Cloud: ${err}`));
    producer.send({
        topic, messages: [{
            value: msg
        }]
    })
}
module.exports = producerfunc;