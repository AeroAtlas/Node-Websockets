exports.ifErr = (err, code = 500) => {
  console.log(err)
  const error = new Error(err);
  error.statusCode = code;
  return error;
}

exports.throwErr = (msg, code) => {
  const error = new Error(msg);
  error.statusCode = code;
  throw error;
}