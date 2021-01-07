const {Schema, model} = require("mongoose");

const postSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String
  },
  content: {
    type: String,
    required: true
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, {timestamps: true}) //automatic createdAt and updatedAt

module.exports = model("Post", postSchema)