require("dotenv").config();
const {validationResult} = require('express-validator/check');
const {ifErr, throwErr} = require("../middleware/error-handle");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");


exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    throwErr("Validation failed", 422, errors.array())
  }
  try {
    const {email, name, password} = req.body;
    const hashedPw = await bcrypt.hash(password, 12)
    const user = new User({email, password: hashedPw, name});
    const result = await user.save();
    res.status(201).json({message: "User created", userId: result._id});
  } catch (err) {
    next(ifErr(err, err.statusCode))
  }
};

exports.login = async (req, res, next) => {
  const {email, password} = req.body;
  try {
    const user = await User.findOne({email})
    if(!user){
      throwErr("A user with this email could not be found", 401);
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if(!isEqual){
      throwErr("Wrong password", 401);
    }
    const token = jwt.sign(
      { email: user.email, userId: user._id.toString() }, 
      process.env.SECRET, 
      { expiresIn: "1h" }
    );
    res.status(200).json({token, userId: user._id.toString()})
  } catch (err) {
    next(ifErr(err, err.statusCode))
  }
}

exports.getUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
    if(!user){
      throwErr("User not found", 404);
    }
    res.status(200).json({status: user.status});
  } catch (err) {
    next(ifErr(err, err.statusCode))
  }
}

exports.updateUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
    if(!user){
      throwErr("User not found", 404);
    }
    user.status = req.body.status;
    await user.save()
    res.status(200).json({message: "User status updated"});
  } catch (err) {
    next(ifErr(err, err.statusCode))
  }
}