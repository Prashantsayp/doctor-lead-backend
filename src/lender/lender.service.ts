import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lender, LenderDocument } from './schema/lender.schema';
import { CreateLenderDto } from './dto/create-lender-dto';
import { MatchLenderDto } from './dto/match-lender.dto';

@Injectable()
export class LenderService {

  constructor(
    @InjectModel(Lender.name)
    private lenderModel: Model<LenderDocument>,
  ) {}

  async create(data: CreateLenderDto) {
    return this.lenderModel.create(data);
  }

  async getAll() {
    return this.lenderModel.find().sort({ createdAt: -1 });
  }

  async matchLenders(user: MatchLenderDto) {

    const lenders = await this.lenderModel.find({
      minCibil: { $lte: user.cibil },
      maxFoir: { $gte: user.foir },
      minIncome: { $lte: user.income },
    });

    if (!lenders.length) {
      throw new NotFoundException('No lenders matched');
    }

    return lenders;
  }
}