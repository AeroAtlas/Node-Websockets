exports.ifErr = (err, code = 500) => {
  console.log(err)
  const error = new Error(err);
  error.statusCode = code;
  return error;
}

exports.throwErr = (msg, code = 500, data) => {
  const error = new Error(msg);
  error.statusCode = code;
  if(data){
    error.data = data
  }
  throw error;
}