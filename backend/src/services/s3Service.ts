import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { createError } from '../middleware/errorHandler';

export class S3Service {
  private static s3: AWS.S3;
  private static cloudfront: AWS.CloudFront;

  static initialize() {
    const config = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
    };

    this.s3 = new AWS.S3(config);
    this.cloudfront = new AWS.CloudFront(config);
  }

  static async generateSignedUploadUrl(fileName: string, fileType: string, fileSize: number): Promise<{ uploadUrl: string; key: string }> {
    if (!this.s3) {
      this.initialize();
    }

    const bucketName = process.env.AWS_S3_BUCKET;
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET not configured');
    }

    // Generate unique key
    const fileExtension = fileName.split('.').pop();
    const key = `uploads/${uuidv4()}.${fileExtension}`;

    // Set content type based on file type
    const contentType = this.getContentType(fileType);

    // Generate presigned URL for upload
    const uploadUrl = this.s3.getSignedUrl('putObject', {
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
      Expires: 3600, // 1 hour
      Conditions: [
        ['content-length-range', 0, 100 * 1024 * 1024], // Max 100MB
      ],
    });

    return { uploadUrl, key };
  }

  static async generateSignedViewUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.s3) {
      this.initialize();
    }

    const bucketName = process.env.AWS_S3_BUCKET;
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET not configured');
    }

    // Generate presigned URL for viewing
    const viewUrl = this.s3.getSignedUrl('getObject', {
      Bucket: bucketName,
      Key: key,
      Expires: expiresIn,
    });

    return viewUrl;
  }

  static async generateCloudFrontSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.cloudfront) {
      this.initialize();
    }

    const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
    if (!cloudfrontDomain) {
      throw new Error('CLOUDFRONT_DOMAIN not configured');
    }

    const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY;
    const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;

    if (!privateKey || !keyPairId) {
      // Fallback to S3 signed URL if CloudFront signing not configured
      return this.generateSignedViewUrl(key, expiresIn);
    }

    const url = `https://${cloudfrontDomain}/${key}`;
    const expireTime = Math.floor(Date.now() / 1000) + expiresIn;

    // Create policy
    const policy = {
      Statement: [
        {
          Resource: url,
          Condition: {
            DateLessThan: {
              'AWS:EpochTime': expireTime,
            },
          },
        },
      ],
    };

    // Sign the policy
    const signer = new AWS.CloudFront.Signer(keyPairId, privateKey);
    const signedUrl = signer.getSignedUrl({
      url,
      expires: expireTime,
    });

    return signedUrl;
  }

  static async deleteFile(key: string): Promise<void> {
    if (!this.s3) {
      this.initialize();
    }

    const bucketName = process.env.AWS_S3_BUCKET;
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET not configured');
    }

    await this.s3.deleteObject({
      Bucket: bucketName,
      Key: key,
    }).promise();
  }

  static async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    if (!this.s3) {
      this.initialize();
    }

    const bucketName = process.env.AWS_S3_BUCKET;
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET not configured');
    }

    await this.s3.copyObject({
      Bucket: bucketName,
      CopySource: `${bucketName}/${sourceKey}`,
      Key: destinationKey,
    }).promise();
  }

  static async getFileMetadata(key: string): Promise<AWS.S3.HeadObjectOutput> {
    if (!this.s3) {
      this.initialize();
    }

    const bucketName = process.env.AWS_S3_BUCKET;
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET not configured');
    }

    return await this.s3.headObject({
      Bucket: bucketName,
      Key: key,
    }).promise();
  }

  private static getContentType(fileType: string): string {
    const contentTypes: Record<string, string> = {
      'video/mp4': 'video/mp4',
      'video/webm': 'video/webm',
      'video/avi': 'video/avi',
      'video/mov': 'video/quicktime',
      'image/jpeg': 'image/jpeg',
      'image/png': 'image/png',
      'image/gif': 'image/gif',
      'image/webp': 'image/webp',
      'application/pdf': 'application/pdf',
      'text/plain': 'text/plain',
    };

    return contentTypes[fileType] || 'application/octet-stream';
  }

  static async generateVideoThumbnail(videoKey: string): Promise<string> {
    // This would typically use AWS Lambda with FFmpeg to generate thumbnails
    // For now, we'll return a placeholder
    // In a real implementation, you'd trigger a Lambda function here
    
    const thumbnailKey = `thumbnails/${videoKey.replace('uploads/', '').replace(/\.[^/.]+$/, '.jpg')}`;
    
    // Placeholder implementation - in reality, you'd:
    // 1. Trigger a Lambda function with the video key
    // 2. Lambda processes the video and uploads thumbnail
    // 3. Return the thumbnail key
    
    return thumbnailKey;
  }
}