require("dotenv").config();
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");

const routes = require("./routes");
const app = express();
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg"){ //add gif, webm, etc
    cb(null, true);
  } else {
    cb(null, false);
  }
}


app.use(bodyParser.json());
app.use(multer({storage: fileStorage, fileFilter}).single("image")); //single file stored in image 
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req,res,next)=>{
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,POST,PUT,PATCH,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(routes);

app.use((error, req, res, next) => {
  console.log(error);
  const {statusCode = 500, message, data} = error;
  res.status(statusCode).json({message, data});
});

mongoose.connect(process.env.MONGODB_PASS)
  .then(() => {
    app.listen(8080);
  })
  .catch(err => console.log(err))
