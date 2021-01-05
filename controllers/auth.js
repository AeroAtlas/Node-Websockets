const {validationResult} = require("express-validator");
const {ifErr, throwErr} = require("../middleware/error-handle");
const bcrypt = require("bcryptjs");
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