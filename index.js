require('dotenv').config()
const express = require('express');
const PORT = 3000;
const server = express();
const { client } = require('./db');
const apiRouter = require('./api');
client.connect();
const morgan = require('morgan');
server.use(morgan('dev'));
server.use(express.json());



server.use('/api', apiRouter);


server.listen(PORT, () => {
    console.log('The server is running on: ', PORT)
});