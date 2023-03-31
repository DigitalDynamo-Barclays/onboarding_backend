const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const { Kafka } = require('kafkajs');
const { createWorker } = require('tesseract.js');
const producerfunc = require('../producer');
const { consumPerInfo, consumContInfo } = require('../consumer');
const UserAccount = require('../models/userAcc.model.js');
const { v4: uuidv4 } = require('uuid')
require('dotenv').config();

const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID,
    brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS],
    ssl: true,
    sasl: {
        mechanism: 'plain',
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD
    }
});


const consumer = kafka.consumer({ groupId: 'onboarding-app-info' });
const producer = kafka.producer();
producer.connect()
    .then(() => console.log('Connected to Confluent Cloud'))
    .catch(err => console.log(`Error connecting to Confluent Cloud: ${err}`));

router.post('/personal-info', async (req, res) => {
    const { name, dob, address } = req.body;

    const payload = {
        name,
        dob,
        address,
        uid: uuidv4()
    };

    const topic = 'onboarding-personal-info'
    const messages = JSON.stringify({ step: 'personal-info', payload })
    producerfunc(topic, msg = messages).then(async () => {
        res.status(200).json({ message: 'Personal info saved', uid: payload.uid })

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
    producerfunc(topic, msg = messages).then(async () => {
        res.status(200).json({ message: 'Contact info saved' })

    })
        .catch((err) => {
            console.log("error in producer: ", err)
        })
});

router.get('/message', async (res) => {
    await consumer.connect()
    await consumer.subscribe({ topic: 'onboarding-update' })
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const payload = JSON.parse(message.value);
            console.log("message called", payload)
            res.json({ payload: payload })
        }
    })
})


module.exports = router;