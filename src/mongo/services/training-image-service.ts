import { S3Client, GetObjectCommand, GetObjectCommandInput, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import MongoTrainingImage, { IMongoTrainingImage } from '../models/training-image-model';

// AWS S3 configuration
const s3Client = new S3Client({ region: 'us-west-1' });
const BUCKET_NAME = 'card-classifier';

export class TrainingImageService {
  /**
   * Search for training images based on imageType and status, and generate presigned URLs for each image.
   * @param imageType - The type of the image (e.g., 'BOARD', 'CARD').
   * @param status - The status of the image (e.g., 'PENDING_SLICE', 'CLASSIFIED').
   * @returns A list of images with presigned URLs.
   */
  static async searchImages(imageType: string, status: string): Promise<any[]> {
    try {
      // Validate inputs
      if (!['BOARD', 'CARD'].includes(imageType)) {
        throw new Error('Invalid imageType');
      }

      // Query the database for matching images
      let images: any[] = await MongoTrainingImage.find({ imageType, status });

      // Generate presigned URLs for the images
      const results = await Promise.all(
        images.map(async (image) => {
          const url = await this.generatePresignedUrl(image.imageLocation);
          // Convert Mongoose document to a plain JavaScript object
          const imageObject = image.toObject();
          imageObject.presignedUrl = url;
          return imageObject;
        })
      );

      return results;
    } catch (error) {
      console.error('Error in searchImages:', error);
      throw new Error('Failed to search and generate presigned URLs');
    }
  }

  static async updateImage(
    id: string,
    updates: Partial<IMongoTrainingImage>
  ): Promise<IMongoTrainingImage | null> {
    try {
      //rules for training
      this.applyTrainingRules(updates);

      // Find and update the image
      const updatedImage = await MongoTrainingImage.findByIdAndUpdate(id, updates, {
        new: true, // Return the updated document
        runValidators: true, // Ensure updates respect the schema
      });

      if (!updatedImage) {
        throw new Error('Image not found');
      }

      return updatedImage;
    } catch (error) {
      console.error('Error updating image:', error);
      throw new Error('Failed to update image');
    }
  }

  static async deleteImage(
    id: string
  ): Promise<any> {
    try {
      // Find and update the image
      const mongoImage: IMongoTrainingImage = await MongoTrainingImage.findById(id);
      const s3filename: string = mongoImage.imageLocation;
      const updatedImage = await MongoTrainingImage.deleteOne({ _id: id });
      await this.deleteFileFromS3(BUCKET_NAME, s3filename);

      return null;
    } catch (error) {
      console.error('Error updating image:', error);
      throw new Error('Failed to update image');
    }
  }

  /**
   * Generate a presigned URL for an S3 object.
   * @param imageLocation - The key (path) of the image in the S3 bucket.
   * @returns The presigned URL.
   */
  private static async generatePresignedUrl(imageLocation: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: imageLocation.replace(BUCKET_NAME + "/", ""),
      });

      // Generate a presigned URL with an expiration time (e.g., 1 hour)
      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      return presignedUrl;
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  private static async deleteFileFromS3(bucketName: string, filename: string): Promise<void> {
    try {
      // Prepare the S3 delete command
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: filename.replace(bucketName + "/", ""),
      });

      // Send the delete command
      await s3Client.send(command);

      console.log(`File deleted successfully: ${filename}`);
    } catch (error) {
      console.error(`Error deleting file ${filename} from S3:`, error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  private static applyTrainingRules = (updates:Partial<IMongoTrainingImage>) => {
    //custom rule for CARDS
    if (updates.imageType == 'CARD' && updates.status == 'PENDING_CLASSIFICATION') {
      //3 guesses, change status to what it should be
      if (updates.possibleOracleIds && updates.possibleOracleIds.length >= 3) {
        //verify all the oracle ids are the same
        let matchedCardId: string = updates.possibleOracleIds[0];
        if (updates.possibleOracleIds[1] == matchedCardId && updates.possibleOracleIds[2] == matchedCardId) {
          updates.status = 'PENDING_TRAINING';
        } else {
          updates.status = 'PENDING_VERIFICATION';
        }
      }
      //people dont know
      else if (updates.votesNotSure >= 3) {
        updates.status = 'PENDING_IDK';
      }
      //people want to delete
      else if (updates.votesToDelete >= 3) {
        updates.status = 'PENDING_DELETE';
      }
    }
  }
}
