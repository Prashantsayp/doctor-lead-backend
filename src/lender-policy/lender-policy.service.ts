import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel }
from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import {
  LenderPolicy,
  LenderPolicyDocument,
} from './schema/lender-policy-schema';

import { CreateLenderPolicyDto }
from './dto/create-lender-policy.dto';

import { UpdateLenderPolicyDto }
from './dto/update-lender-policy.dto';

@Injectable()
export class LenderPolicyService {

  constructor(
    @InjectModel(LenderPolicy.name)
    private readonly lenderPolicyModel:
      Model<LenderPolicyDocument>,
  ) {}

  /**
   * Create policy
   */
  async create(
    dto: CreateLenderPolicyDto,
  ) {

    this.validateBusinessRules(dto);

    const existing =
      await this.lenderPolicyModel.findOne({

        lenderId: dto.lenderId,

        policyType:
          dto.policyType || '',

        minCibil:
          dto.minCibil,

        maxCibil:
          dto.maxCibil,

        minLoanAmount:
          dto.minLoanAmount,

        maxLoanAmount:
          dto.maxLoanAmount,

        isActive: true,
      });

    if (existing) {

      throw new BadRequestException(
        'Similar active policy already exists',
      );
    }

    try {

      const policy =
        await this.lenderPolicyModel.create({

          ...dto,

          lenderName:
            dto.lenderName.toUpperCase(),

          policyType:
            dto.policyType?.toUpperCase() || '',

          allowedProfessions:
            Array.isArray(
              dto.allowedProfessions,
            )
              ? dto.allowedProfessions
              : [],

          allowedLocations:
            Array.isArray(
              dto.allowedLocations,
            )
              ? dto.allowedLocations
              : [],

          blockedLocations:
            Array.isArray(
              dto.blockedLocations,
            )
              ? dto.blockedLocations
              : [],

          employmentTypes:
            Array.isArray(
              dto.employmentTypes,
            )
              ? dto.employmentTypes
              : [],

          isActive:
            dto.isActive ?? true,
        });

      return {

        success: true,

        message:
          'Policy created successfully',

        data: policy,
      };

    } catch (error: any) {

      throw new BadRequestException(
        error.message,
      );
    }
  }

  /**
   * Get all policies
   */
  async findAll(
    search?: string,
  ) {

    const query = search

      ? {

          lenderName: {
            $regex: search,
            $options: 'i',
          },
        }

      : {};

    const data =
      await this.lenderPolicyModel

        .find(query)

        .populate(
          'lenderId',
          'name',
        )

        .sort({
          createdAt: -1,
        })

        .lean();

    return {
      success: true,
      data,
    };
  }

  /**
   * Get policy by id
   */
  async findOne(id: string) {

    this.validateObjectId(id);

    const policy =
      await this.lenderPolicyModel

        .findById(id)

        .populate(
          'lenderId',
          'name',
        )

        .lean();

    if (!policy) {

      throw new NotFoundException(
        'Policy not found',
      );
    }

    return {
      success: true,
      data: policy,
    };
  }

  /**
   * Update policy
   */
  async update(

    id: string,

    dto: UpdateLenderPolicyDto,

  ) {

    this.validateObjectId(id);

    this.validateBusinessRules(dto);

    const duplicate =
      await this.lenderPolicyModel.findOne({

        _id: { $ne: id },

        lenderId:
          dto.lenderId,

        policyType:
          dto.policyType,

        minCibil:
          dto.minCibil,

        maxCibil:
          dto.maxCibil,

        isActive: true,
      });

    if (duplicate) {

      throw new BadRequestException(
        'Similar policy already exists',
      );
    }

    if (dto.lenderName) {

      dto.lenderName =
        dto.lenderName.toUpperCase();
    }

      dto.lenderId =
      dto.lenderId ||
    `LENDER-${Date.now()}`;

    if (dto.policyType) {

      dto.policyType =
        dto.policyType.toUpperCase();
    }

    const updated =
      await this.lenderPolicyModel
        .findByIdAndUpdate(

          id,

          {

            ...dto,

            allowedProfessions:
              Array.isArray(
                dto.allowedProfessions,
              )
                ? dto.allowedProfessions
                : [],

            allowedLocations:
              Array.isArray(
                dto.allowedLocations,
              )
                ? dto.allowedLocations
                : [],

            blockedLocations:
              Array.isArray(
                dto.blockedLocations,
              )
                ? dto.blockedLocations
                : [],

            employmentTypes:
              Array.isArray(
                dto.employmentTypes,
              )
                ? dto.employmentTypes
                : [],
          },

          {
            new: true,
            runValidators: true,
          },
        )

        .populate(
          'lenderId',
          'name',
        );

    if (!updated) {

      throw new NotFoundException(
        'Policy not found',
      );
    }

    return {

      success: true,

      message:
        'Policy updated successfully',

      data: updated,
    };
  }

  /**
   * Delete policy
   */
  async remove(id: string) {

    this.validateObjectId(id);

    const deleted =
      await this.lenderPolicyModel
        .findByIdAndDelete(id);

    if (!deleted) {

      throw new NotFoundException(
        'Policy not found',
      );
    }

    return {

      success: true,

      message:
        'Policy deleted successfully',
    };
  }

  /**
   * Toggle policy status
   */
  async toggleStatus(id: string) {

    this.validateObjectId(id);

    const policy =
      await this.lenderPolicyModel
        .findById(id);

    if (!policy) {

      throw new NotFoundException(
        'Policy not found',
      );
    }

    policy.isActive =
      !policy.isActive;

    await policy.save();

    return {

      success: true,

      message: `Policy ${
        policy.isActive
          ? 'activated'
          : 'deactivated'
      } successfully`,

      data: policy,
    };
  }

  /**
   * Validate Mongo ObjectId
   */
  private validateObjectId(
    id: string,
  ) {

    if (
      !Types.ObjectId.isValid(id)
    ) {

      throw new BadRequestException(
        'Invalid policy id',
      );
    }
  }

  /**
   * Business validations
   */
  private validateBusinessRules(
    dto: any,
  ) {

    /**
     * CIBIL range validation
     */
    if (

      dto.minCibil &&
      dto.maxCibil &&

      dto.minCibil >
      dto.maxCibil

    ) {

      throw new BadRequestException(

        'Min CIBIL cannot exceed Max CIBIL',
      );
    }

    /**
     * Loan amount validation
     */
    if (

      dto.minLoanAmount &&
      dto.maxLoanAmount &&

      dto.minLoanAmount >
      dto.maxLoanAmount

    ) {

      throw new BadRequestException(

        'Invalid loan amount range',
      );
    }

    /**
     * Allowed vs blocked locations
     */
    const conflicts =
      dto.allowedLocations?.filter(
        (loc: string) =>
          dto.blockedLocations?.includes(
            loc,
          ),
      );

    if (conflicts?.length) {

      throw new BadRequestException(

        'Allowed and blocked locations cannot overlap',
      );
    }
  }
}