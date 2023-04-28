require('dotenv').config()
const jwt = require('jsonwebtoken');
const express = require('express');
const {getAllUsers, createUser} = require('../db')
const usersRouter = express.Router();
const { getUserByUsername } = require('../db');
const { requireUser } = require('./utils');



usersRouter.use((req, res, next) => {
    console.log('A request is being made to /users');

    next()
});


usersRouter.get('/', async (req, res) => {
    const users = await getAllUsers();
    
    res.send({
        users
    });
});


usersRouter.post('/login', async (req,res,next) => {
    const { username, password } = req.body;

  if (!username || !password) {
    next({
      name: "MissingCredentialsError",
      message: "Please supply both a username and password"
    });
  }

  try {
    const user = await getUserByUsername(username);
    const token = jwt.sign({id: user.id, username: user.username, password: user.password}, process.env.JWT_SECRET);

    if (user && user.password == password) {
      res.send({ 
        message: "you're logged in!", "token": token
     });
    } else {
      next({ 
        name: 'IncorrectCredentialsError', 
        message: 'Username or password is incorrect'
      });
    }
  } catch(error) {
    console.log(error);
    next(error);
  }
})

usersRouter.post('/register', async (req, res, next) => {
    const { username, password, name, location } = req.body;
    console.log(req.body);
    console.log(req.user);
    try {
        const _user = await getUserByUsername(username);

        if (_user) {
            next({
                name: 'Username already exists',
                message: 'A user by that username already exists'
            });
        }
        const user = await createUser({username, password, name, location});
        const token = jwt.sign({id: user.id, username: user.username}, process.env.JWT_SECRET, {expiresIn: '1w'});
        res.send({
            message: "Congratulations, you've signed up", token
    })
    } catch (error) {
        next(error)
    }
})

module.exports = usersRouter;