require("dotenv").config();
const jwt = require("jsonwebtoken");
const {throwErr} = require("../middleware/error-handle");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");
  if(!authHeader){
    throwErr("Not authenticated", 401);
  }
  const token = authHeader.split(" ")[1];
  let decodedToken
  try {
    decodedToken = jwt.verify(token, process.env.SECRET);
  } catch(err){
    err.statusCode = 500;
    throw err;
  }
  if(!decodedToken){ //if decoded, but unverified
    throwErr("Not authenticated", 401);
  }
  req.userId = decodedToken.userId;
  // console.log(req.userId) //* Remove later
  next();
}


// require("dotenv").config();
// const jwt = require('jsonwebtoken');

// module.exports = (req, res, next) => {
//   const authHeader = req.get('Authorization');
//   if (!authHeader) {
//     const error = new Error('Not authenticated.');
//     error.statusCode = 401;
//     throw error;
//   }
//   const token = authHeader.split(' ')[1];
//   let decodedToken;
//   try {
//     decodedToken = jwt.verify(token, process.env.SECRET);
//   } catch (err) {
//     err.statusCode = 500;
//     throw err;
//   }
//   if (!decodedToken) {
//     const error = new Error('Not authenticated.');
//     error.statusCode = 401;
//     throw error;
//   }
//   req.userId = decodedToken.userId;
//   next();
// };
