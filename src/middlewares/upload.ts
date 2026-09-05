import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { BadRequestError } from '../utils/AppError';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads', 'support');
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_ROOT),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});

export const uploadSupportAttachment = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.has(file.mimetype)) {
            cb(new BadRequestError('Only image or PDF attachments are allowed'));
            return;
        }
        cb(null, true);
    },
}).single('file');
