import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ECSClient, ListTasksCommand, DescribeTasksCommand } from "@aws-sdk/client-ecs";
import { EC2Client, DescribeNetworkInterfacesCommand } from "@aws-sdk/client-ec2";
import MongoTrainingImage, { IMongoTrainingImage } from '../src/mongo/models/training-image-model';
import fs from 'fs';
import path from 'path';
import "../src/mongo/mongo";

const ecsClient = new ECSClient({ region: 'us-west-2' });
const ec2Client = new EC2Client({ region: 'us-west-2' });
const s3Client = new S3Client({ region: "us-west-1" });

async function waitFiveSeconds() {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 5000);
  });
}

const sendSlicedImagesToCloud = async () => {
  //so mongo will load lol
  await waitFiveSeconds();

  const imagesFolder = "/mnt/e/Photos/TableStream/cardsNeedingClassificationToMongo"; // Adjust this path as needed

  // Read all files from the directory
  const imageFiles = fs.readdirSync(imagesFolder);

  // Filter only image files. Adjust the extensions as needed.
  const allowedExtensions = ['.jpg'];
  const filteredFiles = imageFiles.filter((file) =>
    allowedExtensions.includes(path.extname(file).toLowerCase())
  );

  // Create an array of file-like objects expected by sendFileToS3andMongo
  const filesToUpload = filteredFiles.map((fileName) => {
    const filePath = path.join(imagesFolder, fileName);
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(fileName).toLowerCase();

    let mimetype = 'image/jpeg';
    if (ext === '.png') {
      mimetype = 'image/png';
    }

    return {
      originalname: fileName,
      buffer: fileBuffer,
      mimetype: mimetype,
    };
  });

  await sendFileToS3andMongo(filesToUpload)
}

const sendFileToS3andMongo = async (files: any) => {
  const bucket = 'card-classifier';
  const uploadPromises = files.map(async (file: any) => {
    const fileName = `${file.originalname}-${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`// Replace : and . with -
    const fileKey = `sliced-images/${fileName}`;

    // Prepare the upload command
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    // Upload the file to S3
    const result = await s3Client.send(command);
    console.log(`Uploaded ${file.originalname} to ${fileKey}:`, result);

    const trainingImage = new MongoTrainingImage({
      imageName: fileName,
      imageLocation: `${bucket}/${fileKey}`,
      imageType: "CARD",
      status: "PENDING_CLASSIFICATION"
    });

    await trainingImage.save();

    return result;
  });

  // Wait for all files to upload
  await Promise.all(uploadPromises);
}

sendSlicedImagesToCloud();