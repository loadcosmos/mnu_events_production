import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementType, UserLevel } from '@prisma/client';

/**
 * Points awarded for various actions
 */
export const POINTS = {
  // Event attendance
  FREE_EVENT_CHECKIN: 10,
  PAID_EVENT_CHECKIN: 20,
  EXTERNAL_EVENT_CHECKIN: 15,

  // Club participation
  JOIN_CLUB: 5,
  ACTIVE_CLUB_MEMBER: 30, // 3+ events per month in a club

  // Achievements
  FIRST_EVENT: 25,
  CATEGORY_EXPERT: 100, // 10 events in one category
  STREAK_2_WEEKS: 20,
  STREAK_MONTH: 50,
  STREAK_SEMESTER: 200,
};

/**
 * Level thresholds
 */
export const LEVEL_THRESHOLDS = {
  NEWCOMER: 0,
  ACTIVE: 100,
  LEADER: 500,
  LEGEND: 1000,
};

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Award points to a user and check for level up
   */
  async awardPoints(
    userId: string,
    points: number,
    reason: string,
  ): Promise<{ newPoints: number; leveledUp: boolean; newLevel?: UserLevel }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true, level: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const newPoints = user.points + points;
    const newLevel = this.calculateLevel(newPoints);
    const leveledUp = newLevel !== user.level;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        points: newPoints,
        level: newLevel,
      },
    });

    this.logger.log(
      `User ${userId} earned ${points} points (${reason}). Total: ${newPoints}`,
    );

    if (leveledUp) {
      this.logger.log(
        `User ${userId} leveled up to ${newLevel}!`,
      );
    }

    return { newPoints, leveledUp, newLevel: leveledUp ? newLevel : undefined };
  }

  /**
   * Calculate user level based on points
   */
  calculateLevel(points: number): UserLevel {
    if (points >= LEVEL_THRESHOLDS.LEGEND) return 'LEGEND';
    if (points >= LEVEL_THRESHOLDS.LEADER) return 'LEADER';
    if (points >= LEVEL_THRESHOLDS.ACTIVE) return 'ACTIVE';
    return 'NEWCOMER';
  }

  /**
   * Grant an achievement to a user
   */
  async grantAchievement(
    userId: string,
    type: AchievementType,
    name: string,
    description: string,
    points: number,
  ): Promise<void> {
    // Check if user already has this achievement
    const existing = await this.prisma.achievement.findFirst({
      where: {
        userId,
        name,
      },
    });

    if (existing) {
      this.logger.log(
        `User ${userId} already has achievement: ${name}`,
      );
      return;
    }

    // Create achievement
    await this.prisma.achievement.create({
      data: {
        userId,
        type,
        name,
        description,
        points,
      },
    });

    // Award points
    await this.awardPoints(userId, points, `Achievement: ${name}`);

    this.logger.log(
      `User ${userId} earned achievement: ${name} (+${points} points)`,
    );
  }

  /**
   * Check and award first event achievement
   */
  async checkFirstEvent(userId: string): Promise<void> {
    const checkInCount = await this.prisma.checkIn.count({
      where: { userId },
    });

    if (checkInCount === 1) {
      // This is the first event
      await this.grantAchievement(
        userId,
        'ATTENDANCE',
        'Первопроходец',
        'Посетил первое мероприятие',
        POINTS.FIRST_EVENT,
      );
    }
  }

  /**
   * Check and award category expert achievements (10 events in a category)
   */
  async checkCategoryExpert(userId: string): Promise<void> {
    // Get all check-ins with event details
    const checkIns = await this.prisma.checkIn.findMany({
      where: { userId },
      include: {
        event: {
          select: { category: true },
        },
      },
    });

    // Count events per category
    const categoryCount: { [key: string]: number } = {};
    checkIns.forEach((checkIn) => {
      const category = checkIn.event.category;
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    // Check for 10+ events in each category
    for (const [category, count] of Object.entries(categoryCount)) {
      if (count >= 10) {
        const achievementName = this.getCategoryAchievementName(category);
        await this.grantAchievement(
          userId,
          'CATEGORY',
          achievementName,
          `Посетил 10+ мероприятий категории ${category}`,
          POINTS.CATEGORY_EXPERT,
        );
      }
    }
  }

  /**
   * Get achievement name for a category
   */
  private getCategoryAchievementName(category: string): string {
    const names: { [key: string]: string } = {
      CULTURAL: 'Культурный',
      SPORTS: 'Спортсмен',
      TECH: 'Технарь',
      ACADEMIC: 'Ученый',
      SOCIAL: 'Социальный лев',
      CAREER: 'Карьерист',
      OTHER: 'Универсал',
    };
    return names[category] || 'Эксперт';
  }

  /**
   * Award points on event check-in
   */
  async onEventCheckIn(
    userId: string,
    eventId: string,
  ): Promise<void> {
    // Get event details
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { isPaid: true },
    });

    if (!event) {
      return;
    }

    // Award points based on event type
    const points = event.isPaid
      ? POINTS.PAID_EVENT_CHECKIN
      : POINTS.FREE_EVENT_CHECKIN;

    await this.awardPoints(
      userId,
      points,
      `Check-in at ${event.isPaid ? 'paid' : 'free'} event`,
    );

    // Check for achievements
    await this.checkFirstEvent(userId);
    await this.checkCategoryExpert(userId);
  }

  /**
   * Award points on club join
   */
  async onClubJoin(userId: string, clubId: string): Promise<void> {
    await this.awardPoints(userId, POINTS.JOIN_CLUB, `Joined club ${clubId}`);
  }

  /**
   * Get user's achievements
   */
  async getUserAchievements(userId: string) {
    return this.prisma.achievement.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
    });
  }

  /**
   * Get user's gamification stats
   */
  async getUserStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        points: true,
        level: true,
        _count: {
          select: {
            checkIns: true,
            clubMemberships: true,
            achievements: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate progress to next level
    let nextLevelThreshold = 0;
    let currentLevelThreshold = 0;

    switch (user.level) {
      case 'NEWCOMER':
        currentLevelThreshold = LEVEL_THRESHOLDS.NEWCOMER;
        nextLevelThreshold = LEVEL_THRESHOLDS.ACTIVE;
        break;
      case 'ACTIVE':
        currentLevelThreshold = LEVEL_THRESHOLDS.ACTIVE;
        nextLevelThreshold = LEVEL_THRESHOLDS.LEADER;
        break;
      case 'LEADER':
        currentLevelThreshold = LEVEL_THRESHOLDS.LEADER;
        nextLevelThreshold = LEVEL_THRESHOLDS.LEGEND;
        break;
      case 'LEGEND':
        currentLevelThreshold = LEVEL_THRESHOLDS.LEGEND;
        nextLevelThreshold = LEVEL_THRESHOLDS.LEGEND; // Max level
        break;
    }

    const progress =
      user.level === 'LEGEND'
        ? 100
        : ((user.points - currentLevelThreshold) /
            (nextLevelThreshold - currentLevelThreshold)) *
          100;

    return {
      points: user.points,
      level: user.level,
      eventsAttended: user._count.checkIns,
      clubsJoined: user._count.clubMemberships,
      achievementsCount: user._count.achievements,
      progressToNextLevel: Math.round(progress),
      nextLevelPoints: nextLevelThreshold,
    };
  }
}
