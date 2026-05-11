import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ✅ FIX: only ONE import
const pdfParse = require('pdf-parse');

import { OcrService } from '../ocr/ocr.service';
import { AiService } from '../ai/ai.service';
import { DoctorLead } from '../doctor-lead/schemas/doctor-lead.schema';
import { extractBankInsights } from '../utils/bank-parser';

@Injectable()
export class PolicyUploadService {
  private readonly logger = new Logger(PolicyUploadService.name);

  constructor(
    private readonly ocrService: OcrService,
    private readonly aiService: AiService,

    @InjectModel(DoctorLead.name)
    private readonly leadModel: Model<DoctorLead>,
  ) {}

  async processFinancialFile(
    leadId: string,
    file: Express.Multer.File,
    type: 'bankStatement' | 'cibil',
    password?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    let buffer = file.buffer;
    let text = '';
    let isUnlocked = false;

    this.logger.log(`📦 FILE SIZE: ${file.size}`);

    // ================= 🔐 UNLOCK =================
    if (password) {
      try {
        const inputPath = path.join(process.cwd(), `temp-in-${Date.now()}.pdf`);
        const outputPath = path.join(process.cwd(), `temp-out-${Date.now()}.pdf`);

        fs.writeFileSync(inputPath, file.buffer);

        execSync(
          `"C:\\Program Files\\qpdf 12.3.2\\bin\\qpdf.exe" --password="${password}" --decrypt "${inputPath}" "${outputPath}"`
        );

        buffer = fs.readFileSync(outputPath);
        isUnlocked = true;

        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        this.logger.log('✅ PDF UNLOCK SUCCESS');
      } catch {
        this.logger.error('❌ PDF UNLOCK FAILED');
        throw new BadRequestException('Invalid PDF password');
      }
    }

    // ================= 📄 PDF PARSE =================
    try {
      const pdf = await pdfParse(buffer);
      text = pdf?.text?.trim() || '';

      this.logger.log(`📄 PDF TEXT LENGTH: ${text.length}`);
    } catch (err: any) {
      this.logger.warn(`❌ PDF PARSE FAILED: ${err.message}`);
    }

    // ================= 🧠 OCR FALLBACK =================
    if (!text || text.trim().length < 50) {
      this.logger.log('🔁 USING GOOGLE OCR...');

      if (password && !isUnlocked) {
        throw new BadRequestException('PDF still locked');
      }

      text = await this.ocrService.extractText({ buffer } as any);

      this.logger.log(`🧠 OCR TEXT LENGTH: ${text.length}`);
    }

    // ================= ❌ FAIL SAFE =================
    if (!text || !text.trim()) {
      throw new BadRequestException('Unable to extract text from file');
    }

    // ================= 🔥 TEXT SIZE FIX (CRITICAL) =================
    if (text.length > 8000) {
      this.logger.warn('⚠️ TEXT TOO LARGE → FILTERING');

      text = text
        .split('\n')
        .filter((line) => {
          const l = line.toLowerCase();
          return (
            l.includes('salary') ||
            l.includes('emi') ||
            l.includes('loan') ||
            l.includes('credit') ||
            l.includes('debit') ||
            /\d{4,}/.test(line)
          );
        })
        .slice(0, 200)
        .join('\n');
    }

    // ================= 🤖 AI =================
    const ai = await this.aiService.extractFinancial(text, type);

    const lead: any = await this.leadModel.findById(leadId);

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (ai?.error) {
    this.logger.warn('⚠️ AI FAILED → USING PARSER ONLY');
    }

    // ================= 📊 BANK =================
    let parsed: any = {};

    if (type === 'bankStatement') {
      parsed = extractBankInsights(text);

  const income =
  parsed.monthly_income > 10000
    ? parsed.monthly_income
    : Number(ai?.monthly_income) || 0;

  const emi =
  parsed.emi_outflow > 3000 && parsed.emi_outflow < 100000
    ? parsed.emi_outflow
    : Number(ai?.emi_outflow) || 0;

      lead.monthlyNetIncome = income;
      lead.monthlyEmi = emi;
    }

    // ================= 📉 CIBIL =================
    if (type === 'cibil') {
      lead.cibilScore = Number(ai?.cibil_score) || 0;
      lead.activeLoans = Number(ai?.active_loans) || 0;
      lead.hasOverdue = Boolean(ai?.overdue);
    }

    // ================= 💡 ELIGIBILITY =================
    const income = lead.monthlyNetIncome || 0;
    const emi = lead.monthlyEmi || 0;
    const cibil = lead.cibilScore || 0;

    const foir = income > 0 ? (emi / income) * 100 : 100;

    let status = 'REJECTED';

    if (cibil >= 750 && foir < 40) status = 'STRONG';
    else if (cibil >= 700 && foir < 50) status = 'MODERATE';
    else if (cibil >= 650) status = 'WEAK';

    await lead.save();

    return {
      success: true,
      data: {
        ai,
        parsed,
        eligibility: {
          cibil,
          foir: Number(foir.toFixed(2)),
          status,
        },
        textLength: text.length,
      },
    };
  }
}