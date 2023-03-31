const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// const path = require('path');
const { Kafka } = require('kafkajs');
const { createWorker } = require('tesseract.js');
const producerfunc = require('../producer');
const { consumPerInfo, consumContInfo } = require('../consumer');
const UserAccount = require('../models/userAcc.model.js');
const { v4: uuidv4 } = require('uuid')
require('dotenv').config();


const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
            return cb(new Error('Only JPG, JPEG, and PNG images are allowed'));
        }
        cb(null, true);
    }
});


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
    const { name, dob, address, accountType } = req.body;

    const payload = {
        name,
        dob,
        address,
        accountType,
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

router.post('/id-img/:id', upload.single('file'), async (req, res) => {
    try {
        const userId = req.params.id
        const base64 = req.file.buffer.toString('base64');
        // console.log(base64)

        const payload = {
            userId,
            idImage: base64
        };
        const topic = 'onboarding-personal-info'
        const messages = JSON.stringify({ step: 'id-image', payload })
        producerfunc(topic, msg = messages).then(async () => {
            res.status(200).json({ message: 'id card saved' })

        })
            .catch((err) => {
                console.log("error in producer: ", err)
            })
    } catch (err) {
        console.log(err)
    }
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




module.exports = router;