import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class LenderPolicyService {
  constructor(
    @InjectModel('Policy')
    private readonly lenderPolicyModel: Model<any>,
  ) {}

  async create(dto: any) {
    try {
      const cleanData = {
        lenderId: dto.lenderId,
        minCibil: dto.minCibil,
        minIncome: dto.minIncome,
        maxLoanAmount: dto.maxLoanAmount,
        employmentTypes: dto.employmentTypes || [],
        isActive: true,
      };

      const policy = await this.lenderPolicyModel.create(cleanData);

      return {
        success: true,
        message: 'Policy created successfully',
        data: policy,
      };
    } catch (err) {
      return {
        success: false,
        message: 'Failed to create policy',
        error: err.message,
      };
    }
  }

  async findAll() {
    try {
      const data = await this.lenderPolicyModel
        .find()
        .populate('lenderId', 'name')
        .sort({ createdAt: -1 });

      return {
        success: true,
        data,
      };
    } catch (err) {
      return {
        success: false,
        message: 'Failed to fetch policies',
      };
    }
  }

  async findOne(id: string) {
    const policy = await this.lenderPolicyModel
      .findById(id)
      .populate('lenderId', 'name');

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    return {
      success: true,
      data: policy,
    };
  }

  async update(id: string, dto: any) {
    const updated = await this.lenderPolicyModel.findByIdAndUpdate(
      id,
      dto,
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Policy not found');
    }

    return {
      success: true,
      message: 'Policy updated successfully',
      data: updated,
    };
  }

  async remove(id: string) {
    const deleted = await this.lenderPolicyModel.findByIdAndDelete(id);

    if (!deleted) {
      throw new NotFoundException('Policy not found');
    }

    return {
      success: true,
      message: 'Policy deleted successfully',
    };
  }

  async toggleStatus(id: string, isActive: boolean) {
    const updated = await this.lenderPolicyModel.findByIdAndUpdate(
      id,
      { isActive },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Policy not found');
    }

    return {
      success: true,
      message: 'Status updated',
      data: updated,
    };
  }
}