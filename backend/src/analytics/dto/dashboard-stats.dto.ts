import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ description: 'Total number of events', example: 150 })
  totalEvents: number;

  @ApiProperty({ description: 'Total number of users', example: 5000 })
  totalUsers: number;

  @ApiProperty({ description: 'Total revenue from tickets', example: 2500000 })
  totalRevenue: number;

  @ApiProperty({ description: 'Total tickets sold', example: 500 })
  totalTicketsSold: number;

  @ApiProperty({
    description: 'Events count by category',
    example: [
      { category: 'TECH', count: 45 },
      { category: 'SPORTS', count: 30 },
    ],
  })
  eventsByCategory: { category: string; count: number }[];

  @ApiProperty({
    description: 'Revenue by month (last 6 months)',
    example: [
      { month: '2025-01', amount: 450000 },
      { month: '2025-02', amount: 380000 },
    ],
  })
  revenueByMonth: { month: string; amount: number }[];

  @ApiProperty({
    description: 'Top 10 events by registrations',
  })
  topEvents: any[];
}
