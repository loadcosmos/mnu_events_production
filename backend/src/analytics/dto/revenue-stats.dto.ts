import { ApiProperty } from '@nestjs/swagger';

export class RevenueStatsDto {
  @ApiProperty({
    description: 'Total revenue from all sources',
    example: 2500000,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Revenue from ticket sales',
    example: 2100000,
  })
  ticketRevenue: number;

  @ApiProperty({
    description: 'Revenue from advertisements',
    example: 400000,
  })
  adRevenue: number;

  @ApiProperty({
    description: 'Platform fees collected',
    example: 300000,
  })
  platformFees: number;

  @ApiProperty({
    description: 'Revenue by month',
  })
  revenueByMonth: {
    month: string;
    tickets: number;
    ads: number;
    platformFees: number;
  }[];

  @ApiProperty({
    description: 'Top revenue-generating events',
  })
  topRevenueEvents: {
    eventId: string;
    title: string;
    ticketsSold: number;
    revenue: number;
  }[];
}
