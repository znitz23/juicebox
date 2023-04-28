require('dotenv').config()
const jwt = require('jsonwebtoken');
const express = require('express');
const { getAllPosts, createPost, updatePost, getPostById } = require('../db');
const { requireUser } = require('./utils');
const postsRouter = express.Router();

postsRouter.get('/', async (req, res) => {
    
    try {
        
        const allPosts = await getAllPosts();

        const posts = allPosts.filter(post => {
            return post.active || (req.user && post.author.id === req.user.id);
          });
    
        res.send(posts);
    } catch (error) {
        
    }
})


postsRouter.post('/', requireUser, async (req, res, next) => {
    const { title, content, tags = "" } = req.body;

    const tagArr = tags.trim().split(/\s+/);
    const postData = {};
    
    if (tagArr.length) {
        postData.tags = tagArr;
    }

    try {
        postData.title = title;
        postData.content = content;
        postData.authorId = req.user.id;
        const post = await createPost(postData);
        if(post) {
            res.send(post);
        } 
        next()
    } catch (error) {
        next(error)
    }
})

postsRouter.delete('/:postId', requireUser, async (req,res,next) => {
    
    try {
        const post = await getPostById(req.params.postId);
        if (post && post.author.id === req.user.id) {
        const updatedPost = await updatePost(post.id, {active: false});
            res.send({ message: "Post successfully deleted", post: updatedPost});
        } else {
            next(post ? {
                name: 'Unauthorized User Error', 
                message: 'you are not authorized to delete this post'
        } : {
            name: "PostNotFoundError",
            message: "That post does not exist"
        });
    }
    } catch (error) {
        next()
    }
});

postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
    const { postId } = req.params;
    const { title, content, tags } = req.body;

    const updateFields = {};
    
    if(tags.length > 0){
        updateFields.tags = tags.trim().split(/\s+/);
    }
    if(title){
        updateFields.title = title;
    }
    if(content){
        updateFields.content = content;
    }
    
    try {
        const orginalPost = await getPostById(postId);
        if(orginalPost.authorId === req.user.id){
            post = await updatePost(postId, updateFields)
            res.send(post)
        } next({
            name: "Not authorized to update this post",
            message: "Not authorized to update this post"
        })
    } catch (error) {
        next(error)
    }
})

module.exports = postsRouter;