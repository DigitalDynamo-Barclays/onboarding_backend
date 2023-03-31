const { Kafka } = require('kafkajs');
const UserAccount = require('./models/userAcc.model.js');
const userFinacc = require('./models/userfin.modal.js')
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
            // console.log(payload)

            if (payload.step === 'personal-info') {

                console.log(payload)
                const { name, dob, address, uid, accountType } = payload.payload;
                const userAccount = new UserAccount({ name, dob, address, uid, accountType });
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
                        accountType,
                        userId: userAccount._id
                    }
                };
                await producer.send({
                    topic: 'admin-update',
                    messages: [
                        { value: JSON.stringify(adminPayload) }
                    ]
                });
            }
            else if (payload.step === 'id-image') {
                const { idImage, userId } = payload.payload;
                const userAccount = await UserAccount.findOne(
                    { uid: userId }
                );
                userAccount.idImage = idImage;
                await userAccount.save().then((res) => {
                    console.log("id image saved")
                })
                    .catch((err) => {
                        console.log(err)
                    })


            }
            else if (payload.step === 'contact-info') {
                let user = ""
                const { phone, email, userId } = payload.payload;
                const userAccount = await UserAccount.findOne(
                    { uid: userId }
                );
                userAccount.phone = phone;
                userAccount.email = email;
                await userAccount.save().then((res) => {
                    console.log("res----", res)
                    user = res
                })
                const data = {
                    name: user.name,
                    dob: user.dob,
                    address: user.address,
                    idImage: user.idImage,
                    phone: user.phone,
                    uid: user.uid,
                    email: user.email,
                    accountType: user.accountType,
                    isVerified: user.isVerified

                }
                const finalAcc = new userFinacc(data)
                finalAcc.save()

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