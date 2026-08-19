import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { BadRequestException, Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import {
  getUploadRoot,
  resolveUploadPath,
  validateUploadedImage,
} from './image-file';

@Injectable()
export class StorageService {
  async put(file: Express.Multer.File) {
    const image = validateUploadedImage(file);
    const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}${image.extension}`;
    if (process.env.STORAGE_PROVIDER === 's3')
      return this.putS3(key, file, image.contentType);
    const root = getUploadRoot();
    await mkdir(resolveUploadPath(root, key.split('/')[0] ?? ''), {
      recursive: true,
    });
    await writeFile(resolveUploadPath(root, key), file.buffer, { flag: 'wx' });
    return {
      key,
      url: `${process.env.API_URL ?? 'http://localhost:3001'}/uploads/${key.replaceAll('\\', '/')}`,
    };
  }
  private async putS3(
    key: string,
    file: Express.Multer.File,
    contentType: string,
  ) {
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
        ContentDisposition: 'inline',
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    const base =
      process.env.S3_PUBLIC_URL ?? `${process.env.S3_ENDPOINT}/${bucket}`;
    return { key, url: `${base?.replace(/\/$/, '')}/${key}` };
  }
}
