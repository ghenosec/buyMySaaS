import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../../common/auth.guard';
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from './image-file';
import { StorageService } from './storage.service';

@Controller('uploads')
@UseGuards(AuthGuard)
export class StorageController {
  constructor(private readonly storage: StorageService) {}
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: 1 },
      fileFilter: (_req, file, callback) =>
        callback(
          null,
          ALLOWED_IMAGE_MIME_TYPES.includes(
            file.mimetype as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
          ),
        ),
    }),
  )
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file)
      throw new BadRequestException(
        'Envie uma imagem JPEG, PNG ou WebP de até 5 MB',
      );
    return this.storage.put(file);
  }
}
