import "../src/mongo/mongo";
import { TrainingImageService } from "../src/mongo/services/training-image-service";
import MongoTrainingImage, { IMongoTrainingImage } from '../src/mongo/models/training-image-model';
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: "us-west-1" });

async function waitFiveSeconds() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 3000);
    });
  }

  


const run = async()=>{
     //so mongo will load lol
    await waitFiveSeconds();

    let classifiedImages:any[] = await TrainingImageService.searchImages({imageType: "CARD", status: "PENDING_DELETE"})

    for(let x = 0; x < classifiedImages.length; x++){
      console.log(classifiedImages[x]._id)
      classifiedImages[x].status = 'DELETED'
      await TrainingImageService.updateImage(classifiedImages[x]._id, classifiedImages[x]);
    }
}

export async function deleteFileFromS3(bucketName: string, key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
  
      await s3Client.send(command);
      console.log(`File "${key}" successfully deleted from bucket "${bucketName}".`);
    } catch (error) {
      console.error(`Error deleting file "${key}" from bucket "${bucketName}":`, error);
      throw error;
    }
  }

run();