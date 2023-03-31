const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { Kafka } = require('kafkajs');
const { createWorker } = require('tesseract.js');
const mongoose = require('mongoose');
const startkafka = require('./consumer');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT;
const uri = process.env.MONGO_URI

mongoose.connect(uri, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    useCreateIndex: true
});

mongoose.connection.once('open', () => {
    console.log("mongodb connected");
})
const user = require('./routes/user');
app.use('/onboarding', user)


startkafka().catch((err) => {
    console.error("error in consumer: ", err)
})



app.listen(port, () => {
    console.log("server running on port :-" + port);
});
