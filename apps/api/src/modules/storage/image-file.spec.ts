import { BadRequestException } from '@nestjs/common';
import { resolve } from 'node:path';
import { resolveUploadPath, validateUploadedImage } from './image-file';

describe('image-file security helpers', () => {
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
  ]);
  const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00]);

  it('detects the real image type and ignores unsafe original names', () => {
    expect(
      validateUploadedImage({
        buffer: pngBuffer,
        size: pngBuffer.length,
        mimetype: 'image/png',
      }),
    ).toEqual({ contentType: 'image/png', extension: '.png' });
  });

  it('rejects forged image uploads with valid MIME but invalid bytes', () => {
    const forged = Buffer.from('<script>alert(1)</script>');

    expect(() =>
      validateUploadedImage({
        buffer: forged,
        size: forged.length,
        mimetype: 'image/png',
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects mismatched MIME and magic bytes', () => {
    expect(() =>
      validateUploadedImage({
        buffer: jpegBuffer,
        size: jpegBuffer.length,
        mimetype: 'image/png',
      }),
    ).toThrow(BadRequestException);
  });

  it('blocks upload path traversal', () => {
    expect(() =>
      resolveUploadPath(resolve('uploads'), '../outside.png'),
    ).toThrow(BadRequestException);
  });
});
