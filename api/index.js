const express = require('express');
const apiRouter = express.Router();
const postsRouter = require('./posts');
const usersRouter = require('./users');
const tagsRouter = require('./tags');

apiRouter.use('/users', usersRouter);
apiRouter.use('/posts', postsRouter);
apiRouter.use('/tags', tagsRouter);

module.exports = apiRouter;