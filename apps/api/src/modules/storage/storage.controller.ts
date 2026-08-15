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
import { StorageService } from './storage.service';

@Controller('uploads')
@UseGuards(AuthGuard)
export class StorageController {
  constructor(private readonly storage: StorageService) {}
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) =>
        callback(
          null,
          ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype),
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
