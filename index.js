const AWS = require('aws-sdk');
const fs = require('fs')
const { exec } = require('child_process');


let TO_BUCKET, tmp;

if( process.env.MODE === 'LOCAL' ){
  const credentials = new AWS.SharedIniFileCredentials({
    profile: 'default'
  });
  AWS.config.credentials = credentials;
  AWS.config.region = 'us-west-2';
  
  const localConfig = require('./config-local.json');
  tmp = localConfig.tmp;
  TO_BUCKET = localConfig.TO_BUCKET;

} else {
  const lambdaConfig = require('./config-lambda.json');
  tmp = lambdaConfig.tmp;
  TO_BUCKET = lambdaConfig.TO_BUCKET;
}

const s3 = new AWS.S3();

exports.handler = (event, context) => {
  const FROM_BUCKET = event.Records[0].s3.bucket.name;
  const Key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

  const downloadParams = { Bucket: FROM_BUCKET, Key };

  
  // download file from s3
  (new Promise((resolve, reject)=>
    s3.getObject(downloadParams, (err, response)=>{
      if( err ) return reject(err);
      
      fs.writeFile(tmp+'/input.mp4', response.Body, err=>
        err ? console.log('err',err)||reject(err) : resolve()
      )
    })
  )).then(()=>
    (new Promise((resolve, reject)=>
      exec('sed -i \'1,4d;$d\' '+tmp+'/input.mp4')
        .on('close', code=> (code ? reject(code) : resolve()))
    ))
  ).then(()=>
    (new Promise((resolve, reject)=>
      fs.readFile(tmp+'/input.mp4', (err, filedata)=> {
        if( err ) return reject(err); 

        s3.putObject({
          Bucket: TO_BUCKET,
          Key: Key,
          Body: filedata,
          
        }, (err, response) => {
          console.log(err);
          if( err ) return reject(err);

          resolve();
        });
      })
    ))
  )
  .then(()=> context.succeed())
  .catch(err=> context.fail(err))
}
