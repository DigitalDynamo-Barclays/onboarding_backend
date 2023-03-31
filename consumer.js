const { Kafka } = require('kafkajs');
const UserAccount = require('./models/userAcc.model.js');



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
const consumer = kafka.consumer({ groupId: 'onboarding-app-info' });


const startKafka = async () => {




    await consumer.connect().then(() => {
        console.log("consumer connected to kafka")
    });
    await producer.connect().then(() => {
        console.log("producer connected to kafka")
    });
    await consumer.subscribe({ topic: 'onboarding-personal-info' });
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const payload = JSON.parse(message.value);
            console.log(payload)

            if (payload.step === 'personal-info') {

                //code for updating admin and user dashboard with personal info


                // Save personal info to MongoDB Atlas
                console.log(payload)
                const { name, dob, address } = payload.payload;
                const userAccount = new UserAccount({ name, dob, address });
                await userAccount.save().then((res) => {
                    console.log("user account saved", res._id)

                    // res.json({ status: "info saved", uid: res._id })
                }).catch((err) => {
                    console.log("error in saving user account: ", err)
                });
                const adminPayload = {
                    messages: {
                        messageType: 'personal-info',
                        name,
                        dob,
                        address,
                        userId: userAccount._id
                    }
                };
                await producer.send({
                    topic: 'onboarding-update',
                    messages: [
                        { value: JSON.stringify(adminPayload) }
                    ]
                });
            }
            else if (payload.step === 'contact-info') {
                const { phone, email, userId } = payload.payload;
                const userAccount = await UserAccount.findOne(
                    { _id: userId }
                );
                userAccount.phone = phone;
                userAccount.email = email;
                await userAccount.save();
            }

            // else if (payload.step === 'id-image') {

            //     // Update ID verification status in MongoDB Atlas
            //     const { idImage } = payload.data;
            //     const userAccount = await UserAccount.findOneAndUpdate(
            //         {},
            //         { $set: { idImage } },
            //         { new: true }
            //     );
            //     const idVerified = validateIdImage(idImage);
            //     userAccount.idVerified = idVerified;
            //     await userAccount.save();
            // } else if (payload.step === 'contact-info') {
            //     // Update admin and user dashboard with contact info

            //     // Update contact info in MongoDB Atlas
            //     const { phone, email } = payload.data;
            //     const userAccount = await UserAccount.findOneAndUpdate(
            //         {},
            //         { $set: { phone, email } },
            //         { new: true }
            //     );
            //     await userAccount.save();
            // }
        },
    });
}
module.exports = startKafka;