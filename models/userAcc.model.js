const mongoose = require('mongoose');

const Address = {
    block: { type: String },
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: Number },
    country: { type: String }
}
const userAccountSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dob: { type: Date, required: true },
    address: { type: Address, required: true },
    idImage: { type: String, required: true, default: '0000-0000-0000' },
    idVerified: { type: Boolean, default: false },
    phone: { type: String, required: true, default: '0000-0000-0000' },
    email: { type: String, required: true, default: '0000-0000-0000' },
    employment: {
        company: { type: String },
        address: { type: String },
        jobTitle: { type: String },
        salary: { type: Number },
    },
});


const UserAccount = mongoose.model('UserAccount', userAccountSchema);

module.exports = UserAccount;