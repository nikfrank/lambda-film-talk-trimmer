const fileTrimmer = require('./');

fileTrimmer.handler({
  "Records":[
    {
      "s3": {
        "bucket": { "name": "lambda-film-talk-upload" },
        "object": {
          "key": "five.mp4"
        }
      }
    }
  ]

}, {
  fail: err => console.error(err),
  succeed: url=> console.log('success!', url),
});
