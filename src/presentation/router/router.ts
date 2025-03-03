import express, { Router, Request, Response, NextFunction } from 'express';
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const router = express.Router();
const multer  = require('multer')
const upload = multer();

import axios from 'axios';
import { handler } from "../../classifier-lambda";
import discord from '../discord/discord-integration';
import {verifyKeyMiddleware} from 'discord-interactions';
import { Room } from "../../domain/rooms/room";
import { PlayingCard } from "../../domain/interfaces/cards";
import {redisClient} from '../../infrastructure/redis/redis';
import { logMessage } from "../../infrastructure/mongo/services/log-service";
import { IMongoLog } from "../../infrastructure/mongo/models/log-model";
import { search } from "../../domain/pokemon/pokemon-search";
import {RedisService} from "../../services/redis.service";
import { Analytic } from "../../domain/interfaces/analytic";
import { MongoRepository } from "../../infrastructure/mongo/mongo-repository";
import { MongoService } from "../../services/mongo-service";
import { checkBearerToken } from './bearer-token-check';
import { RedisRepository } from '../../infrastructure/redis/redis-repository';
import { ICreateRoomParams } from '../../domain/interfaces/create-room-params';

const mongoRepository = new MongoRepository();
const mongoService = new MongoService(mongoRepository);
const redisRepository = new RedisRepository();
const redisService = new RedisService(redisRepository);

router.get('/', (req: any, res: any) => {
  res.status(200).send('Beating...');
});

router.post('/log', async(req: any, res: any) => {
  try{
    let newLog:IMongoLog | {} = await logMessage(req.body);
    res.status(201).json(newLog);
  }catch(error){
    console.log("Error logging: ", error)
    res.status(500).json({ message: 'Failed to log'});
  }
});

/**
 * @swagger
 * /analytics:
 *   get:
 *     summary: Get dashboard analytics
 *     responses:
 *       200:
 *         description: Successful response with a list of users.
 */
router.get('/analytics', checkBearerToken, async (req: any, res: any) => {
  try {
    const mongoAnalytics = await mongoService.getTwoMonthsAnalytics();
    const redisAnalytic = await redisService.getRedisAnalytic();
    const analytic: Analytic = {
      mongoAnalytics: mongoAnalytics,
      redisAnalytic: redisAnalytic
    }
    res.json(analytic);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/news', async(req: any, res: any) => {
  try{
    let news = await redisClient.get("globalNews");
    res.status(200).json(JSON.parse(news));
  }catch(error){
    console.log("Error fetching news: ", error)
    res.status(500).json({ message: 'Failed to get news'});
  }
});

router.post('/report-issue', async (req: any, res: any) => {
  const { title, body, email } = req.body;
  try {
    const response = await axios.post(
      'https://api.github.com/repos/louiebloo/TableStreamUI/issues',
      {
        title: title,
        body: "User Email: " + email + "\n" + body,
        labels: ['user_submitted_issues']
      },
      {
        headers: {
          Authorization: `token ${process.env.REPORT_GITHUB_CODE}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).json({ message: 'Issue created successfully!', data: response.data });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ message: 'Failed to create issue', error: error.response.data });
  }
});

router.post('/password-check', async (req: any, res: any) => {
  const { roomId } = req.body;

  try {
    const isPasswordPro = await redisService.isRoomPasswordProtected(roomId);
    res.status(200).json({ result: isPasswordPro })
  }catch(error){
    console.error("Error checking password: ", error)
    res.status(500).json({ message: 'Failed to check password'});
  }
  
})

router.post('/classify', upload.any(), async (req: any, res: any) => {
  try {
    return await handler(req, res);
  }catch(error){
    console.error("Classifier error: ", error)
    res.status(500).json({ message: 'Failed to classify'});
  }
})

router.post('/create-room', async (req: any, res: any) => {
  try{
    const roomParams: ICreateRoomParams = {
      roomName: req.body.roomName,
      gameType: Room.gameTypeMapping(req.body.gameType),
      maxPlayers: req.body.maxPlayers,
      password: req.body.password,
      private: req.body.private,
      initialScheduleTTLInSeconds: req.body.initialScheduleTTLInSeconds,
      reactionsEnabled: req.body.reactionsEnabled,
      allowPlayerKicking:  req.body.allowPlayerKicking,
      scheduledRoom: true
    }
    const newRoom = new Room(roomParams);
    //do i need to save or something here?? TODO

    res.status(201).json({ room: newRoom })
  }catch(error){
    console.error("Error creating game controller: ", error)
    res.status(422).send(error)
  }
})
if(process.env.DISCORD_PUBLIC_KEY){
  router.post('/discord-interaction', verifyKeyMiddleware(process.env.DISCORD_PUBLIC_KEY), async(req: Request, res: Response) => {
    return await discord(req,res);
  })
}

router.get('/pokemon-cards', async(req: any, res: any) => {
  let response:PlayingCard[] = await search(req.query.query);

  res.status(200).json({data: response});
})


//local developing only
if (false) {
  const INPUT_DIR = '/mnt/d/Photos/TableStream/cardsNeedingClassification';
  const OUTPUT_DIR = '/mnt/d/Photos/TableStream/augmented_images';
  /** Endpoint to get list of images in the input directory */
  router.get('/images', (req: any, res: any) => {
    fs.readdir(INPUT_DIR, (err: any, files: any) => {
      if (err) {
        return res.status(500).send('Unable to scan directory');
      }
      // Filter to include only image files
      const imageFiles = files.filter((file: any) => /\.(jpg|jpeg|png|gif)$/i.test(file));
      res.json(imageFiles);
    });
  });

  /** Endpoint to serve individual images */
  router.get('/image/:filename', (req: any, res: any) => {
    const filename = req.params.filename;
    const imagePath = path.join(INPUT_DIR, filename);
    res.sendFile(imagePath);
  });

  /** Endpoint to get the next augmentation number for a scryfall ID */
  router.get('/next-augmentation-number/:scryfallId', (req: any, res: any) => {
    const scryfallId = req.params.scryfallId;
    fs.readdir(OUTPUT_DIR, (err: any, files: any) => {
      if (err) {
        return res.status(500).send('Unable to scan output directory');
      }
      const regex = new RegExp(`^${scryfallId}_aug_(\\d+)\\.jpg$`);
      let maxNumber = -1;
      files.forEach((file: any) => {
        const match = file.match(regex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num != 99 && num > maxNumber) {
            maxNumber = num;
          }
        }
      });
      res.json({ nextAugmentationNumber: maxNumber + 1 });
    });
  });

  /** Endpoint to save the classified image */
  router.post('/save-image', (req: any, res: any) => {
    const { imageFilename, scryfallId, augmentationNumber } = req.body;

    const sourcePath = path.join(INPUT_DIR, imageFilename);
    const targetFilename = `${scryfallId}_aug_${augmentationNumber}.jpg`;
    const targetPath = path.join(OUTPUT_DIR, targetFilename);
    fsExtra.move(sourcePath, targetPath)
      .then(() => {
        res.json({ success: true });
      })
      .catch((err: any) => {
        console.error(err);
        res.status(500).send('Error saving image');
      });
  });
}


export default router;