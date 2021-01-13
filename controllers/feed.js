const fs = require("fs");
const path = require("path");
const {validationResult} = require("express-validator");
const Post = require("../models/Post");
const User = require("../models/User");
const {ifErr, throwErr} = require("../middleware/error-handle");
const io = require("../socket");

//* Can add exec() to the end of all mongoose operations to return a real promise

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find().skip((currentPage - 1) * perPage).limit(perPage);
    res.status(200).json({message: "Fetched posts", posts, totalItems});
  } catch (err){
    next(ifErr(err, err.statusCode));
  }
}

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    throwErr("Validation failed, entered data is incorrect", 422);
  }
  // if(!req.file){ //* remove later
  //   throwErr("No image provided", 422);
  // }

  const imageUrl = req.file.path;
  const {title, content} = req.body;
  const post = new Post({title, content, imageUrl, creator: req.userId})
  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    io.getIO().emit("posts", {action: "create", post}); //broadcast is all users except sender/ emit is all users
    const {_id, name} = user;
    res.status(201).json({message: "Post created successfully!", post, creator: {_id, name}});
  } catch(err) {
    next(ifErr(err, err.statusCode))
  };
}

exports.getPost = async (req, res, next) => {
  const {postId} = req.params;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      throwErr("Could not find post", 404);
    }
    res.status(200).json({message: "Post fetched.", post});
  } catch(err) {
    next(ifErr(err, err.statusCode));
  }
}

exports.updatePost = async (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    throwErr("Validation failed, entered data is incorrect", 422);
  }
  const {postId} = req.params;
  const {title, content} = req.body;
  let imageUrl = req.body.image;
  if(req.file) {
    imageUrl = req.file.path;
  }
  // if(!imageUrl){
  //   throwErr("No file picked", 422);
  // }
  try {
    const post = await Post.findById(postId);
    if(!post){
      throwErr("Could not find post", 404)
    }
    //? Issue where if you change image while not authorized you add new image to images folder. Doesn't affect post
    if (post.creator.toString() !== req.userId){
      throwErr("Not authorized", 403);
    }
    //* If image has been changed delete stored image
    if(imageUrl !== post.imageUrl){
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;
    const result = await post.save();
    res.status(200).json({message: "Post updated", post: result});
  } catch (err) {
    next(ifErr(err, err.statusCode));
  }
}

exports.deletePost = async (req,res,next) => {
  const {postId} = req.params;
  try {
    const post = await Post.findById(postId);
    if(!post){ throwErr("Could not find post", 404) }
    //Check loggin in user
    if (post.creator.toString() !== req.userId){
      throwErr("Not authorized", 403);
    }
    //Clear the image associated with the post
    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId);
    const user = await User.findById(req.userId)
    user.posts.pull(postId);
    await user.save()
    res.status(200).json({message: "Deleted post."});
  } catch (err) {
    next(ifErr(err, err.statusCode))
  }
}


//Helper Functions (move to own file soon)
const clearImage = filePath => {
  if(filePath){
    filePath = path.join(__dirname, "..", filePath);
    fs.unlink(filePath, err => console.log(err));
  }
}