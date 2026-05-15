import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OcrService } from './ocr.service';

@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('bank-statement')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadBankStatement(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: 'bankStatement' | 'cibil',
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!type || !['bankStatement', 'cibil'].includes(type)) {
      throw new BadRequestException(
        'type must be "bankStatement" or "cibil"',
      );
    }

    const result = await this.ocrService.extractAndParse(file, type);

    return {
      success: true,
      type: result.type,
      data: result.data,
     
    };
  }
}