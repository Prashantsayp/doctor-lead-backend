import { Injectable, Logger } from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import pdfParse from 'pdf-parse';
import {
  DocumentParserService,
  ParsedDocumentResult,
} from './document-parser.service';

@Injectable()
export class OcrService {
  private client: ImageAnnotatorClient;
  private readonly logger = new Logger(OcrService.name);

  constructor(
    private readonly documentParserService: DocumentParserService,
  ) {
    this.client = new ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }


  async extractText(
    file: Express.Multer.File,
    type?: 'bankStatement' | 'cibil',
  ): Promise<string> {
    try {
      this.logger.log(
        `extractText => type=${type}, mime=${file.mimetype}`,
      );

      if (!file?.buffer) {
        throw new Error('Invalid file');
      }

      if (file.mimetype === 'application/pdf') {
        return await this.extractFromPdf(file);
      }
      return await this.extractFromImage(file.buffer);

    } catch (err: any) {
      this.logger.error('extractText failed', err);

      return '';
    }
  }


  async extractAndParse(
    file: Express.Multer.File,
    type: 'bankStatement' | 'cibil',
  ): Promise<ParsedDocumentResult> {

    const rawText = await this.extractText(file, type);

    console.log('================ RAW OCR TEXT ================');
    console.log(rawText);
    console.log('================ TEXT LENGTH =================');
    console.log(rawText.length);

    // EMPTY OCR
    if (!rawText || rawText.trim().length === 0) {

      this.logger.warn('No text extracted');

      return {
        type,
        data:
          type === 'bankStatement'
            ? {
                salary: null,
                totalIncome: null,
                averageMonthlyCredit: null,
                averageMonthlyDebit: null,
                transactions: {
                  debits: 0,
                  credits: 0,
                },
              }
            : {
                cibilScore: null,
                activeLoans: 0,
                totalObligations: null,
                bounceCount: 0,
                loanDetails: [],
              },
        raw: '',
      };
    }

    // PARSE DOCUMENT
    return await this.documentParserService.parse(
      rawText,
      type,
    );
  }


  private async extractFromPdf(
    file: Express.Multer.File,
  ): Promise<string> {

    try {

      this.logger.log('PDF DETECTED');

      const data = await pdfParse(file.buffer);

      const text = data.text || '';

      this.logger.log(
        `PDF TEXT EXTRACTED => ${text.length} chars`,
      );

      return text;

    } catch (err: any) {

      this.logger.error('PDF PARSE FAILED', err);

      return '';
    }
  }


  private async extractFromImage(
    buffer: Buffer,
  ): Promise<string> {

    try {

      this.logger.log('IMAGE OCR START');

      const [result] = await this.client.textDetection({
        image: {
          content: buffer,
        },
      });

      const text =
        result.fullTextAnnotation?.text || '';

      this.logger.log(
        `IMAGE OCR SUCCESS => ${text.length} chars`,
      );

      return text;

    } catch (err: any) {

      this.logger.error('IMAGE OCR FAILED', err);

      return '';
    }
  }
}