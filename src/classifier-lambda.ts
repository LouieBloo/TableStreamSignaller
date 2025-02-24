import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ECSClient, ListTasksCommand, DescribeTasksCommand } from "@aws-sdk/client-ecs";
import { EC2Client, DescribeNetworkInterfacesCommand } from "@aws-sdk/client-ec2";
import MongoTrainingImage, { IMongoTrainingImage } from './infrastructure/mongo/models/training-image-model';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import { RoomState } from "./domain/rooms/roomState";
import { Room } from "./domain/rooms/room";
import { Player } from "./domain/users/player";

const ecsClient = new ECSClient({ region: 'us-west-2' });
const ec2Client = new EC2Client({ region: 'us-west-2' });
const s3Client = new S3Client({ region: "us-west-1" });

const clusterName = 'table-stream-classifier-mtg';  
const serviceName = 'table-stream-mtg-classifier';

let currentIp:string = null;
let lastIpFetchTime:Date = new Date();
const ipExpirationTime:number = 5 * 60 * 1000;//5 mins

export const handler = async (req: any, res: any) => {
  if (!currentIp || (Date.now() - lastIpFetchTime.getTime() > ipExpirationTime)) {
    await setClassifierIp();
  }

  try {
    // Prepare formData to send to the target endpoint
    const formData = new FormData();

    //make sure this user hasnt denied image saving
    const canSavePlayerImage:boolean = await canSavePlayerImages(req.body.playerId, req.body.roomId);

    // Append text fields from req.body
    for (const key in req.body) {
      formData.append(key, req.body[key]);
    }

    // Append files from req.files
    if (req.files) {
      // Assuming req.files is an array (e.g., when using multer)
      const files = Array.isArray(req.files) ? req.files : [req.files];
      files.forEach((file: any) => {
        formData.append(file.fieldname, file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      });

      //send file to s3
      try{
        if(canSavePlayerImage && process.env.SAVE_BOARD_IMAGES && process.env.SAVE_BOARD_IMAGES == 'true'){
          sendFileToS3andMongo(files, req.body.roomId, false);
        }
      }catch(error){
        console.log("Error uploading classifier image to s3: ", error)
      }
      
    }

    // Define the target endpoint URL
    const targetUrl = `http://${currentIp}:8080/classify`;

    // Send the request to the target endpoint
    const response = await axios.post(targetUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    if(canSavePlayerImage && process.env.SAVE_CLASSIFIED_IMAGES && process.env.SAVE_CLASSIFIED_IMAGES == 'true' && response && response.data && response.data.card_image_base64){
      const fileName = `tempsave`;
      const filePath = `${fileName}.jpg`;
      try{
        const file = base64ToJpg(response.data.card_image_base64, fileName);
        await sendFileToS3andMongo([file], req.body.roomId, true, "scryfall_" + response.data.detected_card + "_");
      }catch(error){
        console.log("Error uploading classifier image to s3: ", error)
      } finally {
        deleteLocalFile(filePath);
      }
    }

    // Log response details
    // console.log('Response Status:', response.status);
    // console.log('Response Headers:', response.headers);
    // console.log('Response Data:', response.data);

    // Send back the response from the target endpoint
    res.status(response.status).send({
      classification_confidence: response.data.classification_confidence,
      detected_card: response.data.detected_card,
      scryfall_data: response.data.scryfall_data,
      bounding_box: response.data.bounding_box,
      top_guesses: response.data.top_guesses
    });
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
};

/**
 * given a player id check if they have allowed us to save their images for ml training
 * @param playerId 
 * @param roomId 
 * @returns 
 */
const canSavePlayerImages = async(playerId:string, roomId:string):Promise<boolean>=>{
  let roomState:RoomState = new RoomState();
  let room:Room = await roomState.getRoomUnsafe(roomId);

  if(room && room.players){
    let targetPlayer:Player = room.players.find(p => p.id === playerId);
    return targetPlayer.isSharingImages;
  }

  return false;
}

const sendFileToS3andMongo = async(files:any, roomId:string, isSingleCard:boolean, postString:string=null)=>{
  const bucket = 'card-classifier';
  const uploadPromises = files.map(async (file: any) => {
    const fileName = `${roomId}-${isSingleCard ? "CARD" : "BOARD"}-${postString ? postString + "-" : ""}${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`// Replace : and . with -
    const fileKey = `${isSingleCard ? "sliced-images" : "stream-images"}/${fileName}`;

    // Prepare the upload command
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    // Upload the file to S3
    const result = await s3Client.send(command);
    // console.log(`Uploaded ${file.originalname} to ${fileKey}:`, result);

    const trainingImage = new MongoTrainingImage({
      imageName: fileName,
      imageLocation: `${bucket}/${fileKey}`,
      imageType: isSingleCard ? "CARD" : "BOARD",
      status: isSingleCard ? "PENDING_CLASSIFICATION" : "PENDING_SLICE"
    });

    await trainingImage.save();

    return result;
  });

  // Wait for all files to upload
  await Promise.all(uploadPromises);
}

const setClassifierIp = async()=>{

  // Step 1: List the running tasks in the ECS service
  const listTasksResponse = await ecsClient.send(
    new ListTasksCommand({
      cluster: clusterName,
      serviceName: serviceName,
    })
  );

  const taskArns = listTasksResponse.taskArns;

  if (!taskArns.length) {
    console.log('No running tasks found.');
    return;
  }

  // Step 2: Describe the tasks to get network details (ENI IDs)
  const describeTasksResponse = await ecsClient.send(
    new DescribeTasksCommand({
      cluster: clusterName,
      tasks: taskArns,
    })
  );

  const eniIds = describeTasksResponse.tasks.flatMap((task) =>
    task.attachments.flatMap((attachment) =>
      attachment.details
        .filter((detail) => detail.name === 'networkInterfaceId')
        .map((detail) => detail.value)
    )
  );

  if (!eniIds.length) {
    console.log('No ENIs found for tasks.');
    return;
  }

  // Step 3: Describe the ENIs to get private and public IPs
  const describeNetworkInterfacesResponse = await ec2Client.send(
    new DescribeNetworkInterfacesCommand({
      NetworkInterfaceIds: eniIds,
    })
  );

  const ipAddresses: any = describeNetworkInterfacesResponse.NetworkInterfaces.map((eni: any) => ({
    privateIp: eni.PrivateIpAddress,
    publicIp: eni.Association?.PublicIp || 'No Public IP',
  }));

  // console.log('Task IP addresses:', ipAddresses);
  const targetIp: string = ipAddresses[0].publicIp;

  currentIp = targetIp;
  lastIpFetchTime = new Date();

  return currentIp;
}

/**
 * Converts a base64 string to a JPG file and returns the file object.
 * @param base64String - The base64-encoded string representing the image.
 * @param fileName - The desired name for the resulting JPG file (without extension).
 * @returns An object representing the file with buffer and metadata.
 */
const base64ToJpg = (base64String: string, fileName: string) => {
  // Decode the base64 string
  const buffer = Buffer.from(base64String, 'base64');

  // Define the file path
  const filePath = `${fileName}.jpg`;

  // Write the buffer to a file
  fs.writeFileSync(filePath, buffer);

  // Return the file as an object compatible with `sendFileToS3andMongo`
  return {
    buffer,                     // The file's buffer
    originalname: `${fileName}.jpg`, // Original file name (metadata)
    mimetype: 'image/jpeg'      // MIME type
  };
};

/**
 * Deletes a local file from the filesystem.
 * @param filePath - The path to the file to be deleted.
 */
const deleteLocalFile = (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Deletes the file
      // console.log(`Successfully deleted local file: ${filePath}`);
    } else {
      console.warn(`File not found, skipping delete: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
  }
};