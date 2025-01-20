import "../src/mongo/mongo";
import { TrainingImageService } from "../src/mongo/services/training-image-service";
import MongoTrainingImage, { IMongoTrainingImage } from '../src/mongo/models/training-image-model';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const augmentedImageFolder = "/mnt/e/Photos/TableStream/augmented_images_tmp";

async function waitFiveSeconds() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 3000);
    });
  }

  

// Downloads the sliced cards that have been human classified. Will move it into the augmented images folder and
// mark the record as classified in mongo
const run = async()=>{
     //so mongo will load lol
    await waitFiveSeconds();

    let classifiedImages:any[] = await TrainingImageService.searchImages({imageType: "CARD", status: "PENDING_TRAINING"})

    for(let x = 0; x < classifiedImages.length; x++){
      console.log(classifiedImages[x]._id)

      //code to save locally goes here
      const newFileName:string = `${classifiedImages[x].possibleOracleIds[0]}_aug_${classifiedImages[x]._id}.jpg`;
      await downloadImage(classifiedImages[x].presignedUrl,path.join(augmentedImageFolder, newFileName))

      //change status to CLASSIFIED
      classifiedImages[x].status = 'CLASSIFIED'
      await TrainingImageService.updateImage(classifiedImages[x]._id, classifiedImages[x]);
    }

    
}

// Downloads the image from presignedUrl and saves it to disk
async function downloadImage(url: string, filepath: string) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(filepath, response.data);
  console.log(`Saved image to ${filepath}`);
}

run();