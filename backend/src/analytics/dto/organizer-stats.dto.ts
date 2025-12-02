import { ApiProperty } from '@nestjs/swagger';

export class OrganizerStatsDto {
  @ApiProperty({
    description: 'Total events created by organizer',
    example: 25,
  })
  totalEvents: number;

  @ApiProperty({
    description: 'Number of upcoming events',
    example: 5,
  })
  upcomingEvents: number;

  @ApiProperty({
    description: 'Total registrations across all events',
    example: 450,
  })
  totalRegistrations: number;

  @ApiProperty({
    description: 'Total check-ins across all events',
    example: 380,
  })
  totalCheckIns: number;

  @ApiProperty({
    description: 'Overall check-in rate as percentage',
    example: 84.4,
  })
  checkInRate: number;

  @ApiProperty({
    description: 'Total revenue generated from paid events',
    example: 450000,
  })
  revenueGenerated: number;

  @ApiProperty({
    description: 'Performance metrics for each event',
  })
  eventPerformance: {
    eventId: string;
    title: string;
    registrations: number;
    checkIns: number;
    checkInRate: number;
    revenue: number;
  }[];
}
