const {validationResult} = require("express-validator");
const Post = require("../models/Post");

exports.getPosts = (req, res, next) => {
  res.status(200).json({ posts: [{
    _id: "1",
    title: "first post",
    content: "This is a post",
    imageUrl: "images/duck.jpg",
    creator: { name: "Bob" },
    createdAt: new Date()
  }] });
}

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(422).json({message: "Validation failed, entered data is incorrect", errors: errors.array()})
  }
  const {title, content} = req.body;
  const post = new Post({title, content, creator: {name: "Jeff"}})
  post.save()
    .then(result => {
      console.log(result);
      res.status(201).json({message: "Post created successfully!", post: result});
    })
    .catch(err => console.log(err));

}