import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NotFoundException } from '@nestjs/common';
import { StorageService } from './storage.service';

describe('StorageService local provider', () => {
  const originalEnvironment = { ...process.env };
  let uploadDirectory: string;

  beforeEach(async () => {
    uploadDirectory = await mkdtemp(join(tmpdir(), 'bms-storage-'));
    process.env.STORAGE_PROVIDER = 'local';
    process.env.UPLOAD_DIR = uploadDirectory;
    process.env.API_URL = 'http://localhost:3001';
  });

  afterEach(async () => {
    process.env = { ...originalEnvironment };
    await rm(uploadDirectory, { recursive: true, force: true });
  });

  it('uploads, reads and deletes an image using an owner-scoped key', async () => {
    const service = new StorageService();
    const buffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]);
    const result = await service.put(
      {
        buffer,
        size: buffer.length,
        mimetype: 'image/png',
      } as Express.Multer.File,
      '00000000-0000-4000-8000-000000000001',
    );

    expect(result.key).toMatch(
      /^00000000-0000-4000-8000-000000000001\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]+\.png$/,
    );
    expect(result.url).toBe(
      `http://localhost:3001/api/v1/uploads/${result.key}`,
    );
    await expect(service.get(result.key)).resolves.toMatchObject({
      body: buffer,
      contentType: 'image/png',
    });

    await service.delete(result.key);
    await expect(service.get(result.key)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
