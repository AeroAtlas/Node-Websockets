const fs = require("fs");
const path = require("path");
const {validationResult} = require("express-validator");
const Post = require("../models/Post");
const {ifErr, throwErr} = require("../middleware/error-handle");


exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;
  Post.find().countDocuments()
    .then(count => {
      totalItems = count
      return Post.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage)
    })
    .then(posts => {
      res.status(200).json({message: "Fetched posts", posts, totalItems})
    })
    .catch(err => next(ifErr(err, err.statusCode)));

}

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    throwErr("Validation failed, entered data is incorrect", 422);
  }
  // if(!req.file){ //* remove later
  //   throwErr("No image provided", 422);
  // }
  const imageUrl = req.file.path;
  const {title, content} = req.body;
  const post = new Post({title, content, imageUrl, creator: {name: "Jeff"}})
  post.save()
    .then(result => {
      console.log(result);
      res.status(201).json({message: "Post created successfully!", post: result});
    })
    .catch(err => next(ifErr(err, err.statusCode)));
}

exports.getPost = (req, res, next) => {
  const {postId} = req.params;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        throwErr("Could not find post", 404)
      }
      res.status(200).json({message: "Post fetched.", post});
    })
    .catch(err => next(ifErr(err, err.statusCode)));
}

exports.updatePost = (req, res, next) => {
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
  Post.findById(postId)
    .then(post => {
      if(!post){
        throwErr("Could not find post", 404)
      }
      //* If image has been changed delete stored image
      if(imageUrl !== post.imageUrl){
        clearImage(post.imageUrl);
      }
      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      return post.save()
    })
    .then(result => {
      res.status(200).json({message: "Post updated", post: result})
    })
    .catch(err => next(ifErr(err, err.statusCode)));
}

exports.deletePost = (req,res,next) => {
  const {postId} = req.params;
  Post.findById(postId)
    .then(post => {
      if(!post){ throwErr("Could not find post", 404) }
      //Check loggin in user
      clearImage(post.imageUrl);
      return Post.findByIdAndRemove(postId);
    })
    .then(result => {
      console.log(result);
      res.status(200).json({message: "Deleted post."});
    })
    .catch(err => next(ifErr(err, err.statusCode)));
}


//Helper Functions
const clearImage = filePath => {
  if(filePath){
    filePath = path.join(__dirname, "..", filePath);
    fs.unlink(filePath, err => console.log(err));
  }
}