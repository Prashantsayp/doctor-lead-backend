import {BadRequestException,Injectable,NotFoundException,} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {Model,Types,} from 'mongoose';
import {Lender,LenderDocument,} from './schema/lender.schema';
import { CreateLenderDto } from './dto/create-lender-dto';
import { MatchLenderDto } from './dto/match-lender.dto';
import { UpdateLenderDto } from './dto/update-lender-dto';

@Injectable()
export class LenderService {

  constructor(
    @InjectModel(Lender.name)
    private lenderModel: Model<LenderDocument>,
  ) {}

  async create(data: CreateLenderDto) {

    const existing =
      await this.lenderModel.findOne({
        name: data.name.toUpperCase(),
      });

    if (existing) {
      throw new BadRequestException(
        'Lender already exists',
      );
    }

    try {

      return await this.lenderModel.create({
        ...data,
        name: data.name.toUpperCase(),
      });

    } catch (error: any) {

      if (error.code === 11000) {
        throw new BadRequestException(
          'Lender already exists',
        );
      }

      throw error;
    }
  }


  async getAll() {

    return this.lenderModel
      .find()
      .sort({ createdAt: -1 })
      .lean();
  }

  async getById(id: string) {

    this.validateObjectId(id);

    const lender =
      await this.lenderModel.findById(id);

    if (!lender) {
      throw new NotFoundException(
        'Lender not found',
      );
    }

    return lender;
  }

  async update(
    id: string,
    data: UpdateLenderDto,
  ) {

    this.validateObjectId(id);

    if (data.name) {

      const existing =
        await this.lenderModel.findOne({
          name: data.name.toUpperCase(),
          _id: { $ne: id },
        });

      if (existing) {
        throw new BadRequestException(
          'Lender already exists',
        );
      }

      data.name = data.name.toUpperCase();
    }

    const lender =
      await this.lenderModel.findByIdAndUpdate(
        id,
        data,
        {
          new: true,
          runValidators: true,
        },
      );

    if (!lender) {
      throw new NotFoundException(
        'Lender not found',
      );
    }

    return lender;
  }

  
  async toggleStatus(id: string) {

    this.validateObjectId(id);

    const lender =
      await this.lenderModel.findById(id);

    if (!lender) {
      throw new NotFoundException(
        'Lender not found',
      );
    }

    lender.isActive = !lender.isActive;

    await lender.save();

    return {
      message: `Lender ${
        lender.isActive
          ? 'activated'
          : 'deactivated'
      } successfully`,
    };
  }


  async remove(id: string) {

    this.validateObjectId(id);

    const lender =
      await this.lenderModel.findByIdAndDelete(id);

    if (!lender) {
      throw new NotFoundException(
        'Lender not found',
      );
    }

    return {
      message: 'Lender deleted successfully',
    };
  }

  async matchLenders(
    user: MatchLenderDto,
  ) {

    const query = {

      isActive: true,

      minCibil: {
        $lte: user.cibil,
      },

      maxFoir: {
        $gte: user.foir,
      },

      minIncome: {
        $lte: user.income,
      },
    };

    const lenders =
      await this.lenderModel
        .find(query)
        .sort({
          minCibil: -1,
        })
        .lean();

    if (!lenders.length) {

      throw new NotFoundException(
        'No lenders matched',
      );
    }

    return lenders;
  }

  
  private validateObjectId(id: string) {

    if (!Types.ObjectId.isValid(id)) {

      throw new BadRequestException(
        'Invalid lender id',
      );
    }
  }
}