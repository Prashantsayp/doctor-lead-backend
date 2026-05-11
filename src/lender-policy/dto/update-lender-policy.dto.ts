import { PartialType } from '@nestjs/mapped-types';
import { CreateLenderPolicyDto } from '../../lender-policy/dto/create-lender-policy.dto';

export class UpdateLenderPolicyDto extends PartialType(CreateLenderPolicyDto) {}