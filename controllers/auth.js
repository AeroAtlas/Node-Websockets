require("dotenv").config();
const {validationResult} = require("express-validator");
const {ifErr, throwErr} = require("../middleware/error-handle");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");


exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    throwErr("Validation failed", 422, errors.array())
  }
  const {email, name, password} = req.body;
  bcrypt.hash(password, 12)
    .then(hashedPw => {
      const user = new User({email, password: hashedPw, name});
      return user.save();
    })
    .then(result => {
      res.status(201).json({message: "User created", userId: result._id});
    })
    .catch(err => next(ifErr(err, err.statusCode)));
};

exports.login = (req, res, next) => {
  const {email, password} = req.body;
  let loadedUser;
  User.findOne({email})
    .then(user => {
      if(!user){
        throwErr("A user with this email could not be found", 401);
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then(isEqual => {
      if(!isEqual){
        throwErr("Wrong password", 401);
      }
      const token = jwt.sign(
        { email: loadedUser.email, userId: loadedUser._id.toString() }, 
        process.env.SECRET, 
        { expiresIn: "1h" }
      );
      res.status(200).json({token, userId: loadedUser._id.toString()})
    })
    .catch(err => next(ifErr(err, err.statusCode)));
}