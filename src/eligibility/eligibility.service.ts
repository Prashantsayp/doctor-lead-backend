import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class EligibilityService {

  constructor(
    @InjectModel('Policy')
    private readonly lenderPolicyModel: Model<any>,
  ) {}

  async checkEligibility(data: any) {

    const policies =
      await this.lenderPolicyModel.find({
        isActive: true,
      });

    const eligibleLenders: any[] = [];

    for (const policy of policies) {

     
      const reasons: string[] = [];

      if (
        data.cibilScore <
        policy.minCibil
      ) {
        reasons.push(
          'Low CIBIL Score',
        );
      }

      if (
        data.salary <
        policy.minIncome
      ) {
        reasons.push(
          'Low Salary',
        );
      }

      if (
        data.loanAmount >
        policy.maxLoanAmount
      ) {
        reasons.push(
          'Loan Amount Exceeded',
        );
      }

      const eligible =
        reasons.length === 0;

      eligibleLenders.push({
        lenderName: policy.lenderName,
        lenderId: policy.lenderId,
        eligible: eligible,
        reasons: eligible
          ? ['Eligible']
          : reasons,
      });
    }

    const matchedLenders =
      eligibleLenders.filter(
        (item: any) => item.eligible,
      );

    return {
      success: true,
      totalPolicies: policies.length,
      matchedCount:
        matchedLenders.length,
      matchedLenders,
      allResults:
        eligibleLenders,
    };
  }
}