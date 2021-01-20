require("dotenv").config();
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Post = require("../models/Post");
const {throwErr} = require("../middleware/error-handle"); //use this for error handling. possibly modify
const {clearImage} = require("../utils/file");
//* Add try catch throughout the module export functions

module.exports = {
  createUser: async ({userInput}, req) => {
    const {email, name, password} = userInput;
    const errors = [];
    if(!validator.isEmail(email)) {
      errors.push({message: "Email is invalid."});
    }
    if(validator.isEmpty(password) || !validator.isLength(password, {min:5})) {
      errors.push({message: "Password too short"});
    }
    if(errors.length > 0) {
      throwErr("Invalid Input", 422, errors);
    }
    const existingUser = await User.findOne({email})
    if(existingUser){
      throwErr("User already exists");
    }
    const hashedPw = bcrypt.hash(password, 12);
    const user = new User({
      email, name, password: (await hashedPw).toString()
    });
    const createdUser = await user.save();
    return {...createdUser._doc, _id: createdUser._id.toString()}
  }, 
  login: async ({email,password}) => {
    const user = await User.findOne({email});
    if(!user){
      throwErr("User not found", 401);
    }
    const isEqual = await bcrypt.compare(password, user.password)
    if(!isEqual){
      throwErr("Password is incorrect", 401);
    }
    const token = jwt.sign({
      userId: user._id.toString(),
      email: user.email
    }, process.env.SECRET, {expiresIn: "1h"})
    return {token, userId: user._id.toString()}
  },
  createPost: async ({postInput}, req) => {
    if(!req.isAuth){
      throwErr("Not authenticated", 401);
    }
    const errors = [];
    const {title, content, imageUrl} = postInput;
    if (validator.isEmpty(title) || !validator.isLength(title, {min:5})) {
      errors.push({message: "Title is invalid"});
    }
    if (validator.isEmpty(content) || !validator.isLength(content, {min:5})) {
      errors.push({message: "Title is invalid"});
    }
    if(errors.length > 0) {
      throwErr("Invalid Input", 422, errors);
    }
    const user = await User.findById(req.userId);
    if(!user){
      throwErr("Invalid Input", 401);
    }
    const post = new Post({title, content, imageUrl, creator: user});
    const createdPost = await post.save();
    user.posts.push(createdPost);
    await user.save();
    const {_id, createdAt, updatedAt} = createdPost;
    return {...createdPost._doc, _id: _id.toString(), createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString()}
  },
  posts: async ({page}, req) => {
    if(!req.isAuth){
      throwErr("Not authenticated", 401);
    }
    if(!page){ page = 1 }
    const perPage = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find().sort({createdAt: -1}).skip((page -1) * perPage).limit(perPage).populate("creator")
    return {
      posts: posts.map(p => ({...p._doc, _id: p._id.toString(), createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString()})), 
      totalPosts
    }
  },
  post: async ({id}, req) => {
    if(!req.isAuth){
      throwErr("Not authenticated", 401);
    }
    const post = await Post.findById(id).populate("creator");
    if(!post){
      throwErr("No post found", 404);
    }
    return {...post._doc, _id: post._id.toString(), createdAt: post.createdAt.toISOString(), updatedAt: post.updatedAt.toISOString()}
  },
  updatePost: async ({id, postInput}, req) => {
    if(!req.isAuth){
      throwErr("Not authenticated", 401);
    }
    const post = await Post.findById(id).populate("creator");
    if(!post){
      throwErr("No post found", 404);
    }
    if (post.creator._id.toString() !== req.userId.toString()){
      throwErr("Not authorized", 403);
    }
    //General Post Error Handling for PostInput (make into seperate function)
    const errors = [];
    const {title, content, imageUrl} = postInput;
    if (validator.isEmpty(title) || !validator.isLength(title, {min:5})) {
      errors.push({message: "Title is invalid"});
    }
    if (validator.isEmpty(content) || !validator.isLength(content, {min:5})) {
      errors.push({message: "Title is invalid"});
    }
    if(errors.length > 0) {
      throwErr("Invalid Input", 422, errors);
    }
    post.title = title;
    post.content = content;
    if(imageUrl !== "undefined") {
      post.imageUrl = imageUrl;
    }
    const updatedPost = await post.save();
    const {_id, createdAt, updatedAt} = updatedPost;
    return {...updatedPost._doc, _id: _id.toString(), createdAt: createdAt.toString(), updatedAt: updatedAt.toString()}
  },
  deletePost: async ({id}, req) => {
    if(!req.isAuth){
      throwErr("Not authenticated", 401);
    }
    const post = await Post.findById(id);
    if(!post){
      throwErr("No post found", 404);
    }
    if (post.creator.toString() !== req.userId.toString()){
      throwErr("Not authorized", 403);
    }
    clearImage(post.imageUrl);
    try {    
      await Post.findByIdAndRemove(id);
      const user = await User.findById(req.userId);
      user.posts.pull(id);
      await user.save();
      return true;
    } catch (err) {
      return false;
    }
  },
  user: async (args, req) => {
    if(!req.isAuth){
      throwErr("Not authenticated", 401);
    }
    const user = await User.findById(req.userId);
    if(!user) {
      throwErr("No User Found", 404);
    }
    return {...user._doc, _id: user._id.toString()}
  },
  updateStatus: async ({status}, req) => {
    if(!req.isAuth){
      throwErr("Not authenticated", 401);
    }
    const user = await User.findById(req.userId);
    if(!user) {
      throwErr("No User Found", 404);
    }
    user.status = status;
    await user.save();
    return {...user._doc, _id: user._id.toString()}
  }
}