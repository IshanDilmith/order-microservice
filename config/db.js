const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const DB_URI = process.env.DB_URI;

if(!DB_URI) {
    throw new Error('Mongo URI is missing');
}

const connectDB = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connected to MongoDB');
        return mongoose;
    } catch (err) {
        console.error('error connecting to MongoDB:', err.message);
        throw err;
    }
};

module.exports = connectDB;