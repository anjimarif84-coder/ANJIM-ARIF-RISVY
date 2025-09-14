import AWS from 'aws-sdk';
import { config } from '../config';

// Configure AWS
AWS.config.update({
  accessKeyId: config.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  region: config.AWS_REGION,
});

const s3 = new AWS.S3();

export const generateSignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  const params = {
    Bucket: config.S3_BUCKET_NAME,
    Key: key,
    Expires: expiresIn,
  };

  return s3.getSignedUrl('getObject', params);
};

export const generateUploadUrl = async (key: string, contentType: string, expiresIn: number = 3600): Promise<string> => {
  const params = {
    Bucket: config.S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    Expires: expiresIn,
  };

  return s3.getSignedUrl('putObject', params);
};

export const deleteObject = async (key: string): Promise<void> => {
  const params = {
    Bucket: config.S3_BUCKET_NAME,
    Key: key,
  };

  await s3.deleteObject(params).promise();
};