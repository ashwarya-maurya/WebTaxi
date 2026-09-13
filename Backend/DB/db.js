const mongoose = require('mongoose');

async function connectToDB() {
    await mongoose.connect(process.env.DB_CONNECT);
    console.log('Connected to MongoDB');
    return mongoose.connection;
}

module.exports = connectToDB;
