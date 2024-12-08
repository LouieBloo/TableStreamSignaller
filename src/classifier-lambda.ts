import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ECSClient, ListTasksCommand, DescribeTasksCommand } from "@aws-sdk/client-ecs";
import { EC2Client, DescribeNetworkInterfacesCommand } from "@aws-sdk/client-ec2";
import MongoTrainingImage, { IMongoTrainingImage } from './mongo/models/training-image-model';
import axios from 'axios';
import FormData from 'form-data';

const ecsClient = new ECSClient({ region: 'us-west-2' });
const ec2Client = new EC2Client({ region: 'us-west-2' });
const s3Client = new S3Client({ region: "us-west-1" });

const clusterName = 'table-stream-classifier-mtg';  
const serviceName = 'table-stream-mtg-classifier'; 

export const handler = async (req: any, res: any) => {
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
    return res.status(200).json({ message: 'No running tasks found' });
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
    return res.status(200).json({ message: 'No ENIs found for tasks' });
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

  console.log('Task IP addresses:', ipAddresses);
  const targetIp: string = ipAddresses[0].publicIp;

  console.log(req.body)

  try {
    // Prepare formData to send to the target endpoint
    const formData = new FormData();

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
        if(process.env.SAVE_CLASSIFIED_IMAGES && process.env.SAVE_CLASSIFIED_IMAGES == 'true'){
          sendFileToS3andMongo(files, req.body.roomId);
        }
      }catch(error){
        console.log("Error uploading classifier image to s3: ", error)
      }
      
    }

    // Define the target endpoint URL
    const targetUrl = `http://${targetIp}:8080/classify`;

    // Send the request to the target endpoint
    const response = await axios.post(targetUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    // Log response details
    // console.log('Response Status:', response.status);
    // console.log('Response Headers:', response.headers);
    // console.log('Response Data:', response.data);

    // Send back the response from the target endpoint
    res.status(response.status).send(response.data);
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).send(`Error: ${error.message}`);
  }
};

const sendFileToS3andMongo = async(files:any, roomId:string)=>{
  const bucket = 'card-classifier';
  const uploadPromises = files.map(async (file: any) => {
    const fileName = `${roomId}-${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`// Replace : and . with -
    const fileKey = `stream-images/${fileName}`;

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
      imageType:"BOARD",
      status:"PENDING_SLICE"
    });

    await trainingImage.save();

    return result;
  });

  // Wait for all files to upload
  await Promise.all(uploadPromises);
}
