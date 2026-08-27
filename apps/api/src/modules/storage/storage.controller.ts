import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AuthGuard } from '../../common/auth.guard';
import { AuthUser } from '../../common/auth-user';
import { CurrentUser } from '../../common/current-user.decorator';
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from './image-file';
import { StorageService } from './storage.service';

@Controller('uploads')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post()
  @UseGuards(AuthGuard)
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
  upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file)
      throw new BadRequestException(
        'Envie uma imagem JPEG, PNG ou WebP de até 5 MB',
      );
    return this.storage.put(file, user.id);
  }

  @Get(':ownerId/:folder/:file')
  async read(
    @Param('ownerId') ownerId: string,
    @Param('folder') folder: string,
    @Param('file') file: string,
    @Res() response: Response,
  ) {
    return this.send(`${ownerId}/${folder}/${file}`, response);
  }

  @Get(':folder/:file')
  async readLegacy(
    @Param('folder') folder: string,
    @Param('file') file: string,
    @Res() response: Response,
  ) {
    return this.send(`${folder}/${file}`, response);
  }

  @Delete(':ownerId/:folder/:file')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('ownerId') ownerId: string,
    @Param('folder') folder: string,
    @Param('file') file: string,
  ) {
    if (ownerId !== user.id)
      throw new ForbiddenException('Você não pode excluir esta imagem');
    await this.storage.delete(`${ownerId}/${folder}/${file}`);
  }

  private async send(key: string, response: Response) {
    const object = await this.storage.get(key);
    response.setHeader('Content-Type', object.contentType);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.send(object.body);
  }
}
