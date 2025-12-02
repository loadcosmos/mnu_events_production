import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePartnerDto } from './create-partner.dto';

// Update DTO - все поля опциональны, userId нельзя менять
export class UpdatePartnerDto extends PartialType(
  OmitType(CreatePartnerDto, ['userId'] as const),
) {}
