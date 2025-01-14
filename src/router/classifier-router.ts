import { TrainingImageService } from "../mongo/services/training-image-service";

const express = require('express');
const router = express.Router();
const multer = require('multer')


router.get('/images',async (req: any, res: any) => {
  let result = await TrainingImageService.searchImages({imageType: req.query.imageType, status: req.query.status});

  res.status(200).json(result)
});


router.patch('/images/:id',async (req: any, res: any) => {
  let result = await TrainingImageService.updateImage(req.params.id, req.body)

  res.status(200).json(result)
});

router.delete('/images/:id', async (req: any, res: any) => {
  try {
    const id = req.params.id; // Extract the ID from the route parameters
    const result = await TrainingImageService.deleteImage(id);

    res.status(200).json({ result: "ok" });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

export default router;