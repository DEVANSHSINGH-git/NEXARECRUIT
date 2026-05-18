import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';

export const uploadRouter = Router();

uploadRouter.use(authenticate);

// Multer configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError('Only PDF and DOCX files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '10')) * 1024 * 1024,
  },
});

// POST /api/upload/resume
uploadRouter.post('/resume', upload.single('resume'), async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const userId = req.user!.userId;
  const file = req.file;

  logger.info(`Resume uploaded: ${file.filename} by user ${userId}`);

  // Call AI service to parse the resume
  let parsedContent = '';
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const formData = new FormData();
    const fs = await import('fs');
    const fileBuffer = fs.readFileSync(file.path);
    const blob = new Blob([fileBuffer], { type: file.mimetype });
    formData.append('file', blob, file.originalname);

    const parseResponse = await axios.post(`${aiServiceUrl}/api/parse-resume`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });

    parsedContent = parseResponse.data.parsed_text || '';
  } catch (error: any) {
    logger.warn('AI resume parsing failed, storing raw file reference:', error.message);
  }

  // Store resume record
  const resume = await prisma.resume.create({
    data: {
      userId,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      parsedContent,
    },
  });

  res.status(201).json({
    success: true,
    data: {
      id: resume.id,
      fileName: resume.fileName,
      fileSize: resume.fileSize,
      parsed: !!parsedContent,
      createdAt: resume.createdAt,
    },
  });
});

// GET /api/upload/resumes
uploadRouter.get('/resumes', async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const resumes = await prisma.resume.findMany({
    where: { userId },
    select: {
      id: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: resumes });
});

// DELETE /api/upload/resumes/:id
uploadRouter.delete('/resumes/:id', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const resume = await prisma.resume.findFirst({
    where: { id, userId },
  });

  if (!resume) {
    res.status(404).json({ success: false, error: { message: 'Resume not found' } });
    return;
  }

  // Delete file from disk
  try {
    const fs = await import('fs');
    if (fs.existsSync(resume.filePath)) {
      fs.unlinkSync(resume.filePath);
    }
  } catch (error) {
    logger.warn('Failed to delete file from disk:', error);
  }

  await prisma.resume.delete({ where: { id } });

  res.json({ success: true, message: 'Resume deleted' });
});
