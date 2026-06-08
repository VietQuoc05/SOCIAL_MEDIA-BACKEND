import * as multer from 'multer';

// ✅ dùng memory để có file.buffer → upload MinIO
export const multerConfig = {
  storage: multer.memoryStorage(),
};