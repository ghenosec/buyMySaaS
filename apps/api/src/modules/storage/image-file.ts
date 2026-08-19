import { BadRequestException } from '@nestjs/common';
import { resolve, sep } from 'node:path';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export type ValidatedImageFile = {
  contentType: AllowedImageMimeType;
  extension: '.jpg' | '.png' | '.webp';
};

export function getUploadRoot() {
  return resolve(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads');
}

export function resolveUploadPath(root: string, key: string) {
  const target = resolve(root, key);
  const normalizedRoot = root.endsWith(sep) ? root : `${root}${sep}`;
  if (target !== root && !target.startsWith(normalizedRoot))
    throw new BadRequestException('Caminho de upload inválido');
  return target;
}

export function validateUploadedImage(
  file: Pick<Express.Multer.File, 'buffer' | 'size' | 'mimetype'>,
): ValidatedImageFile {
  if (!file.buffer?.length || file.size <= 0)
    throw new BadRequestException('Envie uma imagem válida');
  if (file.size > MAX_IMAGE_SIZE_BYTES)
    throw new BadRequestException('Imagem maior que 5 MB');
  const detected = detectImageFile(file.buffer);
  if (!detected)
    throw new BadRequestException('Envie uma imagem JPEG, PNG ou WebP válida');
  if (file.mimetype !== detected.contentType)
    throw new BadRequestException('Tipo de imagem incompatível com o arquivo');
  return detected;
}

function detectImageFile(buffer: Buffer): ValidatedImageFile | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  )
    return { contentType: 'image/jpeg', extension: '.jpg' };
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  )
    return { contentType: 'image/png', extension: '.png' };
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  )
    return { contentType: 'image/webp', extension: '.webp' };
  return null;
}
