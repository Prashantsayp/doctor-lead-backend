import { Injectable, Logger } from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OcrService {
  private client: ImageAnnotatorClient;
  private readonly logger = new Logger(OcrService.name);

  constructor() {
    this.client = new ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }

  async extractText(
    file: Express.Multer.File,
    type?: 'bankStatement' | 'cibil',
  ): Promise<string> {
    try {
      if (!file?.buffer) {
        throw new Error('Invalid file');
      }

      // ================= 🔥 BANK PDF SPECIAL HANDLING =================
      if (file.mimetype === 'application/pdf' && type === 'bankStatement') {
        this.logger.log('📄 BANK PDF → IMAGE CONVERSION');

        const tempPdf = path.join(process.cwd(), `ocr-${Date.now()}.pdf`);
        const outputBase = path.join(process.cwd(), `ocr-${Date.now()}`);

        fs.writeFileSync(tempPdf, file.buffer);

        execSync(
          `pdftoppm -png -f 1 -singlefile "${tempPdf}" "${outputBase}"`
        );

        const imgPath = `${outputBase}.png`;

        if (!fs.existsSync(imgPath)) {
          throw new Error('Image conversion failed');
        }

        const imgBuffer = fs.readFileSync(imgPath);

        const [result] = await this.client.textDetection({
          image: { content: imgBuffer },
        });

        const text = result.fullTextAnnotation?.text || '';

        this.logger.log(`🧠 OCR TEXT LENGTH: ${text.length}`);

        fs.unlinkSync(tempPdf);
        fs.unlinkSync(imgPath);

        return text;
      }

      // ================= 🧠 NORMAL OCR =================
      const [result] = await this.client.documentTextDetection({
        image: { content: file.buffer },
      });

      const text = result.fullTextAnnotation?.text || '';

      this.logger.log(`🧠 OCR TEXT LENGTH: ${text.length}`);

      return text;

    } catch (err: any) {
      this.logger.error(`❌ OCR ERROR: ${err.message}`);
      return '';
    }
  }
}