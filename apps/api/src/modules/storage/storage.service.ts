import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import {
  getUploadRoot,
  resolveUploadPath,
  validateUploadedImage,
} from './image-file';

const storageKeyPattern =
  /^(?:[0-9a-f-]{36}\/)?\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/i;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3 =
    process.env.STORAGE_PROVIDER === 's3' ? this.createS3Client() : null;

  async put(file: Express.Multer.File, ownerId: string) {
    const image = validateUploadedImage(file);
    const key = `${ownerId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${image.extension}`;
    if (this.s3) await this.putS3(key, file, image.contentType);
    else await this.putLocal(key, file);
    return { key, url: this.publicUrl(key) };
  }

  async get(key: string) {
    this.assertKey(key);
    if (!this.s3) {
      try {
        return {
          body: await readFile(resolveUploadPath(getUploadRoot(), key)),
          contentType: this.contentType(key),
        };
      } catch (error) {
        if (this.errorCode(error) === 'ENOENT')
          throw new NotFoundException('Imagem não encontrada');
        throw error;
      }
    }

    try {
      const object = await this.s3.send(
        new GetObjectCommand({ Bucket: this.bucket(), Key: key }),
      );
      if (!object.Body) throw new NotFoundException('Imagem não encontrada');
      return {
        body: Buffer.from(await object.Body.transformToByteArray()),
        contentType: object.ContentType ?? this.contentType(key),
      };
    } catch (error) {
      if (
        this.errorCode(error) === 'NoSuchKey' ||
        this.errorCode(error) === 'NotFound'
      )
        throw new NotFoundException('Imagem não encontrada');
      throw error;
    }
  }

  async delete(key: string) {
    this.assertKey(key);
    if (this.s3) {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: this.bucket(), Key: key }),
      );
      return;
    }
    try {
      await unlink(resolveUploadPath(getUploadRoot(), key));
    } catch (error) {
      if (this.errorCode(error) !== 'ENOENT') throw error;
    }
  }

  async deleteManagedUrls(urls: Array<string | null | undefined>) {
    const keys = [
      ...new Set(
        urls
          .map((url) => (url ? this.keyFromManagedUrl(url) : null))
          .filter((key): key is string => Boolean(key)),
      ),
    ];
    const results = await Promise.allSettled(
      keys.map((key) => this.delete(key)),
    );
    results.forEach((result, index) => {
      if (result.status === 'rejected')
        this.logger.error(`Falha ao excluir objeto de storage: ${keys[index]}`);
    });
  }

  private async putLocal(key: string, file: Express.Multer.File) {
    const root = getUploadRoot();
    await mkdir(resolveUploadPath(root, key.slice(0, key.lastIndexOf('/'))), {
      recursive: true,
    });
    await writeFile(resolveUploadPath(root, key), file.buffer, { flag: 'wx' });
  }

  private async putS3(
    key: string,
    file: Express.Multer.File,
    contentType: string,
  ) {
    await this.s3!.send(
      new PutObjectCommand({
        Bucket: this.bucket(),
        Key: key,
        Body: file.buffer,
        ContentDisposition: 'inline',
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
  }

  private createS3Client() {
    const endpoint = process.env.S3_ENDPOINT || undefined;
    return new S3Client({
      endpoint,
      region: process.env.S3_REGION ?? (endpoint ? 'auto' : 'us-east-1'),
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      credentials:
        process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.S3_ACCESS_KEY_ID,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }

  private bucket() {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) throw new BadRequestException('Storage S3 não configurado');
    return bucket;
  }

  private publicUrl(key: string) {
    const directBase = process.env.S3_PUBLIC_URL?.replace(/\/$/, '');
    if (directBase) return `${directBase}/${key}`;
    const apiBase = new URL(
      '/api/v1/uploads/',
      process.env.API_URL ?? 'http://localhost:3001',
    ).toString();
    return `${apiBase}${key}`;
  }

  private keyFromManagedUrl(value: string) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return null;
    }
    const bases = [
      new URL(
        '/api/v1/uploads/',
        process.env.API_URL ?? 'http://localhost:3001',
      ),
      new URL('/uploads/', process.env.API_URL ?? 'http://localhost:3001'),
      ...(process.env.S3_PUBLIC_URL
        ? [new URL(`${process.env.S3_PUBLIC_URL.replace(/\/$/, '')}/`)]
        : []),
    ];
    for (const base of bases) {
      if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname))
        continue;
      const key = decodeURIComponent(url.pathname.slice(base.pathname.length));
      if (storageKeyPattern.test(key)) return key;
    }
    return null;
  }

  private assertKey(key: string) {
    if (!storageKeyPattern.test(key))
      throw new BadRequestException('Chave de imagem inválida');
  }

  private contentType(key: string) {
    if (key.endsWith('.png')) return 'image/png';
    if (key.endsWith('.webp')) return 'image/webp';
    return 'image/jpeg';
  }

  private errorCode(error: unknown) {
    if (!error || typeof error !== 'object') return undefined;
    const value = error as { code?: string; name?: string };
    return value.code ?? value.name;
  }
}
