import { ApiProperty } from '@nestjs/swagger';

export class StudentStatsDto {
  @ApiProperty({
    description: 'Number of events attended (checked in)',
    example: 12,
  })
  eventsAttended: number;

  @ApiProperty({
    description: 'Number of upcoming registered events',
    example: 3,
  })
  upcomingEvents: number;

  @ApiProperty({
    description: 'Number of club memberships',
    example: 2,
  })
  clubMemberships: number;

  @ApiProperty({
    description: 'Number of tickets purchased',
    example: 5,
  })
  ticketsPurchased: number;

  @ApiProperty({
    description: 'Achievement badges',
  })
  badges: {
    name: string;
    unlocked: boolean;
    requirement: string;
    progress: number;
    target: number;
  }[];
}
