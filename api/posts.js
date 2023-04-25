const express = require('express');
const { getAllPosts } = require('../db');
const postsRouter = express.Router();

postsRouter.use((req, res, next) => {
    console.log('Get request for posts');

    next();
})

postsRouter.get('/', async (req, res) => {
    const posts = await getAllPosts();

    res.send({
        posts
    });
})

module.exports = postsRouter;