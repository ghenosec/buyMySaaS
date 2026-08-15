import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { BadRequestException, Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

@Injectable()
export class StorageService {
  async put(file: Express.Multer.File) {
    const extension =
      extname(file.originalname).toLowerCase() ||
      `.${file.mimetype.split('/')[1]}`;
    const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;
    if (process.env.STORAGE_PROVIDER === 's3') return this.putS3(key, file);
    const root = join(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads');
    await mkdir(join(root, key.split('/')[0]), { recursive: true });
    await writeFile(join(root, key), file.buffer);
    return {
      key,
      url: `${process.env.API_URL ?? 'http://localhost:3001'}/uploads/${key.replaceAll('\\', '/')}`,
    };
  }
  private async putS3(key: string, file: Express.Multer.File) {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) throw new BadRequestException('Storage S3 não configurado');
    const client = new S3Client({
      endpoint: process.env.S3_ENDPOINT || undefined,
      region: process.env.S3_REGION ?? 'us-east-1',
      forcePathStyle: Boolean(process.env.S3_ENDPOINT),
      credentials: process.env.S3_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
          }
        : undefined,
    });
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    const base =
      process.env.S3_PUBLIC_URL ?? `${process.env.S3_ENDPOINT}/${bucket}`;
    return { key, url: `${base?.replace(/\/$/, '')}/${key}` };
  }
}
