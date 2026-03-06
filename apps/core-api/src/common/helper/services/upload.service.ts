import * as AWS from 'aws-sdk';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
    private s3
    constructor(

    ){
         this.s3  = new AWS.S3({
            region: process.env.AWS_REGION, // AWS region, e.g., 'us-west-2'
            credentials: {
                accessKeyId: process.env.AWS_S3_ACCESS_KEY,
                secretAccessKey: process.env.AWS_S3_SECRET_KEY,
            },
        });
    }

    private bucketName: string = process.env.AWS_S3_BUCKET_NAME;
 

    async upload(fileName: string, file: string | any, isBase64 = 0) {
     
        var base64data = file;
        if (!isBase64) {
            base64data = file.buffer;
        } else {
            base64data = Buffer.from(file, 'base64');
        }
    
        const uploadParams = {
            Bucket: this.bucketName,
            Key: fileName,
            Body: base64data,
            ContentType: file.mimetype,
            ACL: 'public-read'
        };
        return Promise.resolve()
        .then(()=>{
            return this.s3.upload(uploadParams).promise()
        })
        .then((res)=>{
            return res;
        })
        .catch(()=>{
            return Promise.resolve();
        })
    }

}
