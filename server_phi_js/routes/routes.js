import {Router} from 'express';
import ModelTranscriptionController from '../controllers/trascription.controller.js';

const router = Router();
const modelTranscriptionController = new ModelTranscriptionController();


router.post("/ollama", modelTranscriptionController.trancribeAndIdentifiquer);



export default router;