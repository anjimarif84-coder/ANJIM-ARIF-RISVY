import AWS from 'aws-sdk';
import { SignedUrlResponse } from '@/types';
import { logger } from '@/utils/logger';

class S3Service {
  private s3: AWS.S3;
  private bucket: string;
  private cloudfrontDomain: string;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
    });

    this.bucket = process.env.AWS_S3_BUCKET || 'elearning-videos';
    this.cloudfrontDomain = process.env.AWS_CLOUDFRONT_DOMAIN || '';
  }

  async generateSignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<SignedUrlResponse> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        Expires: expiresIn,
      };

      const signedUrl = await this.s3.getSignedUrlPromise('putObject', params);

      return {
        signedUrl,
        key,
        expiresIn,
      };
    } catch (error) {
      logger.error('Error generating signed upload URL:', error);
      throw error;
    }
  }

  async generateSignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      // If CloudFront is configured, use CloudFront signed URLs for better performance
      if (this.cloudfrontDomain) {
        return this.generateCloudFrontSignedUrl(key, expiresIn);
      }

      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn,
      };

      return await this.s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      logger.error('Error generating signed download URL:', error);
      throw error;
    }
  }

  private generateCloudFrontSignedUrl(key: string, expiresIn: number): string {
    // For production, implement CloudFront signed URLs
    // This requires CloudFront private key and key pair ID
    // For now, return a placeholder implementation
    const expiration = Math.floor(Date.now() / 1000) + expiresIn;
    return `https://${this.cloudfrontDomain}/${key}?expires=${expiration}`;
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3.deleteObject({
        Bucket: this.bucket,
        Key: key,
      }).promise();

      logger.info(`File deleted successfully: ${key}`);
    } catch (error) {
      logger.error('Error deleting file:', error);
      throw error;
    }
  }

  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      await this.s3.copyObject({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey,
      }).promise();

      logger.info(`File copied from ${sourceKey} to ${destinationKey}`);
    } catch (error) {
      logger.error('Error copying file:', error);
      throw error;
    }
  }

  async getFileMetadata(key: string): Promise<AWS.S3.HeadObjectOutput> {
    try {
      return await this.s3.headObject({
        Bucket: this.bucket,
        Key: key,
      }).promise();
    } catch (error) {
      logger.error('Error getting file metadata:', error);
      throw error;
    }
  }

  generateVideoKey(courseId: string, lessonId: string, filename: string): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `courses/${courseId}/lessons/${lessonId}/videos/${timestamp}_${sanitizedFilename}`;
  }

  generateThumbnailKey(courseId: string, filename: string): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `courses/${courseId}/thumbnails/${timestamp}_${sanitizedFilename}`;
  }

  generateProfileImageKey(userId: string, filename: string): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `users/${userId}/profile/${timestamp}_${sanitizedFilename}`;
  }
}

export const s3Service = new S3Service();