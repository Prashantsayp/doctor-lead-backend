
import { Module } from '@nestjs/common';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { DocumentParserService } from './document-parser.service';
 
@Module({
  controllers: [OcrController],
  providers: [OcrService, DocumentParserService],
  exports: [OcrService, DocumentParserService],
})
export class OcrModule {}
 