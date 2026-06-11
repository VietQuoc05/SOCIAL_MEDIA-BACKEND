import { Client } from 'minio';

const endpoint = process.env.MINIO_ENDPOINT;
const port = parseInt(process.env.MINIO_PORT || '443', 10);
const useSSL = process.env.MINIO_USE_SSL === 'true';

console.log(`🔧 MinIO config: endpoint=${endpoint}, port=${port}, SSL=${useSSL}`);
console.log(`🔧 MINIO_ACCESS_KEY begins with: ${process.env.MINIO_ACCESS_KEY?.slice(0, 4)}...`);
console.log(`🔧 MINIO_BUCKET: ${process.env.MINIO_BUCKET}`);

export const MinioClient = new Client({
  endPoint: endpoint,
  port: port,
  useSSL: useSSL,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});
``