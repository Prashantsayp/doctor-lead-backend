import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PolicyUploadService } from './policy-upload.service';

@Controller('policy-upload')
export class PolicyUploadController {
  constructor(private readonly service: PolicyUploadService) {}

  // @Post('upload-policy')
  // @UseInterceptors(FileInterceptor('file'))
  // async upload(@UploadedFile() file: Express.Multer.File) {
  //   if (!file) {
  //     return { error: 'No file uploaded' };
  //   }
  // }

   @Post('upload-policy')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.service.uploadPolicy(file);
    return result;
  }
}