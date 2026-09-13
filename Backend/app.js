const express = require('express');
const app = express();
const cors = require('cors');
const cookies = require('cookie-parser');
const mongoose = require('mongoose');

const userRouter = require('./routes/user.routes');
const captainRouter = require('./routes/captain.routes');
const mapRouter = require('./routes/map.routes');
const rideRouter = require('./routes/ride.routes');

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(cookies());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  return res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? 'healthy' : 'unhealthy',
    database: databaseConnected ? 'connected' : 'disconnected'
  });
});

app.use('/users', userRouter);
app.use('/captains', captainRouter);
app.use('/maps', mapRouter);
app.use('/rides', rideRouter);

module.exports = app;
