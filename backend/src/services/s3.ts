import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getSignedUrl as getCloudFrontSignedUrl } from '@aws-sdk/cloudfront-signer';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function getS3SignedUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

export function getCloudFrontSignedUrlForKey(key: string, expiresInSeconds = 3600) {
  const domain = process.env.CLOUDFRONT_DOMAIN;
  const privateKeyBase64 = process.env.CLOUDFRONT_PRIVATE_KEY_BASE64;
  const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;
  if (!domain || !privateKeyBase64 || !keyPairId) throw new Error('Missing CloudFront envs');
  const url = `https://${domain}/${key}`;
  const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
  return getCloudFrontSignedUrl({
    url,
    keyPairId,
    dateLessThan: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    privateKey,
  });
}

