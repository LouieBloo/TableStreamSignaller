import express, { Request, Response } from 'express';
import multer from 'multer';
import { SpeechClient } from '@google-cloud/speech';
import * as fs from 'fs';
import * as path from 'path';

const router = express.Router();

if (!process.env.GOOGLE_CLOUD_KEY) {
    console.log("No google cloud key, skipping translations...")
} else {
    // Write the JSON string to a file
    fs.writeFileSync("google-cloud-key.json", process.env.GOOGLE_CLOUD_KEY, { encoding: 'utf8' });
    let fileContent = fs.readFileSync("google-cloud-key.json", { encoding: 'utf8' });
    fileContent = fileContent.replace(/\\\\n/g, '\\n');
    fs.writeFileSync("google-cloud-key.json", fileContent, { encoding: 'utf8' });

    // Set up Google Cloud Speech-to-Text client
    const speechClient = new SpeechClient({
        keyFilename: 'google-cloud-key.json',
        //keyFilename: 'gcloudkey.json',
    });

    // Configure Multer for memory storage (to handle file uploads)
    const upload = multer({ storage: multer.memoryStorage() });

    // Endpoint to process audio and transcribe
    router.post('/', upload.single('audio'), async (req: any, res: any) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No audio file uploaded' });
            }

            // Convert the uploaded audio file to Base64
            const audioBytes = req.file.buffer.toString('base64');

            // Google Speech-to-Text request configuration
            const request: any = {
                audio: { content: audioBytes },
                config: {
                    encoding: 'WEBM_OPUS', // Update to match the audio format from your client
                    // sampleRateHertz: 16000,
                    languageCode: 'en-US',
                    audioChannelCount: 2
                },
            };

            // Perform speech-to-text recognition
            const [response] = await speechClient.recognize(request);

            console.log(JSON.stringify(response))

            // Extract transcription from response
            const transcription = response.results
                ?.map((result) => result.alternatives[0]?.transcript)
                .join(' ');

            // Send back the transcription
            res.json({ transcript: transcription || null });
        } catch (error) {
            console.error('Error during transcription:', error);
            res.status(500).json({ error: 'Failed to process transcription' });
        }
    });
}




export default router;
