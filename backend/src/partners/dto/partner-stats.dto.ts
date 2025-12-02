import { ApiProperty } from '@nestjs/swagger';

export class PartnerStatsDto {
  @ApiProperty({ description: 'Total events created' })
  totalEventsCreated: number;

  @ApiProperty({ description: 'Active events count' })
  activeEventsCount: number;

  @ApiProperty({ description: 'Total tickets sold' })
  totalTicketsSold: number;

  @ApiProperty({ description: 'Total revenue (₸)' })
  totalRevenue: number;

  @ApiProperty({ description: 'Commission debt (₸)' })
  commissionDebt: number;

  @ApiProperty({ description: 'Total commission paid (₸)' })
  totalCommissionPaid: number;

  @ApiProperty({ description: 'Commission rate' })
  commissionRate: number;

  @ApiProperty({ description: 'Paid event slots count' })
  paidEventSlots: number;

  @ApiProperty({ description: 'Event limit (free + paid slots)' })
  eventLimit: number;
}
