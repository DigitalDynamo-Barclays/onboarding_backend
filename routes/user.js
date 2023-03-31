const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const { Kafka } = require('kafkajs');
const { createWorker } = require('tesseract.js');
const producerfunc = require('../producer');
const startkafka = require('../consumer');
const UserAccount = require('../models/userAcc.model.js');


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
producer.connect()
    .then(() => console.log('Connected to Confluent Cloud'))
    .catch(err => console.log(`Error connecting to Confluent Cloud: ${err}`));

router.post('/personal-info', async (req, res) => {
    const { name, dob, address } = req.body;

    const payload = {
        name,
        dob,
        address
    };

    const topic = 'onboarding-personal-info'
    const messages = JSON.stringify({ step: 'personal-info', payload })
    producerfunc(topic, msg = messages).then(() => {
        res.status(200).json({ message: 'Personal info saved' })
    })
        .catch((err) => {
            console.log("error in producer: ", err)
        })
});
router.post(`/contact-info/:id`, async (req, res) => {
    const userId = req.params.id;
    const { email, phone } = req.body;
    const payload = {
        email,
        phone,
        userId
    };
    const topic = 'onboarding-personal-info'
    const messages = JSON.stringify({ step: 'contact-info', payload })
    producerfunc(topic, msg = messages).then(() => {
        res.status(200).json({ message: 'Contact info saved' })
    })
        .catch((err) => {
            console.log("error in producer: ", err)
        })
});


module.exports = router;