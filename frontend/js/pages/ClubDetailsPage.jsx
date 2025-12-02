import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import clubsService from '../services/clubsService';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function ClubDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    loadClub();
  }, [id]);

  useEffect(() => {
    if (isAuthenticated() && club) {
      checkMembership();
      // Проверяем, является ли текущий пользователь организатором
      if (user && club.organizerId === user.id) {
        setIsOrganizer(true);
      } else {
        setIsOrganizer(false);
      }
    } else {
      setIsMember(false);
      setIsOrganizer(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club, user]);

  const loadClub = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await clubsService.getById(id);
      setClub(data);
    } catch (err) {
      setError(err.message || 'Failed to load club');
      console.error('[ClubDetailsPage] Load club failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkMembership = async () => {
    try {
      const myClubs = await clubsService.getMyClubs();
      // API может вернуть массив или объект с data
      const clubs = Array.isArray(myClubs) ? myClubs : (myClubs.data || myClubs.clubs || []);
      const membership = clubs.find(c => c.id === id);
      if (membership) {
        setIsMember(true);
      }
    } catch (err) {
      console.error('[ClubDetailsPage] Check membership failed:', err);
    }
  };

  const handleJoin = async () => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: { pathname: `/clubs/${id}` } } });
      return;
    }

    try {
      setJoining(true);
      setError('');
      await clubsService.join(id);
      setIsMember(true);
      toast.success('Successfully joined!', {
        description: 'You are now a member of this club.',
      });
      // Перезагружаем клуб для обновления количества участников
      await loadClub();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to join club';
      setError(errorMessage);
      toast.error('Failed to join club', {
        description: errorMessage,
      });
      console.error('[ClubDetailsPage] Join failed:', err);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!isAuthenticated()) {
      return;
    }

    try {
      setLeaving(true);
      setError('');
      await clubsService.leave(id);
      setIsMember(false);
      toast.success('Left club successfully', {
        description: 'You are no longer a member of this club.',
      });
      // Перезагружаем клуб для обновления количества участников
      await loadClub();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to leave club';
      setError(errorMessage);
      toast.error('Failed to leave club', {
        description: errorMessage,
      });
      console.error('[ClubDetailsPage] Leave failed:', err);
    } finally {
      setLeaving(false);
    }
  };

  const getCategoryColor = (category) => {
    const categoryMap = {
      ACADEMIC: 'bg-blue-600',
      ARTS: 'bg-purple-600',
      SERVICE: 'bg-green-600',
      TECH: 'bg-orange-600',
      SPORTS: 'bg-red-600',
      CULTURAL: 'bg-pink-600',
      OTHER: 'bg-gray-600',
    };
    return categoryMap[category] || 'bg-gray-600';
  };

  const mapCategoryToUI = (category) => {
    const categoryMap = {
      ACADEMIC: 'Academic',
      ARTS: 'Arts',
      SERVICE: 'Service',
      TECH: 'Tech',
      SPORTS: 'Sports',
      CULTURAL: 'Cultural',
      OTHER: 'Other',
    };
    return categoryMap[category] || category;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading club details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !club) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={loadClub}>Try Again</Button>
                <Button variant="outline" onClick={() => navigate('/clubs')}>
                  Back to Clubs
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!club) {
    return null;
  }

  const memberCount = club._count?.members || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/clubs')}
        className="mb-4 rounded-xl"
      >
        ← Back to Clubs
      </Button>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Club Header */}
      <Card className="mb-6 liquid-glass-card rounded-2xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-3xl dark:text-white">{club.name}</CardTitle>
                <Badge className={cn('text-white', getCategoryColor(club.category))}>
                  {mapCategoryToUI(club.category)}
                </Badge>
              </div>
              <CardDescription className="text-base mt-2 dark:text-gray-400">
                {club.description || 'No description available'}
              </CardDescription>
            </div>
            {club.imageUrl && (
              <img
                src={club.imageUrl}
                alt={club.name}
                className="w-32 h-32 object-cover rounded-2xl ml-4"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground dark:text-gray-400">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-users"></i>
              <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
            </div>
            {club.organizer && (
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-user-tie"></i>
                <span>
                  Organized by {club.organizer.firstName} {club.organizer.lastName}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-calendar"></i>
              <span>Created {new Date(club.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons - только для студентов */}
      {isAuthenticated() && user?.role === 'STUDENT' && (
        <div className="mb-6 flex gap-3">
          {isOrganizer ? (
            <Badge variant="outline" className="px-4 py-2">
              <i className="fa-solid fa-crown mr-2"></i>
              You are the organizer
            </Badge>
          ) : isMember ? (
            <Button
              variant="destructive"
              onClick={handleLeave}
              disabled={leaving}
              className="flex-1 rounded-2xl"
            >
              {leaving ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Leaving...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-sign-out-alt mr-2"></i>
                  Leave Club
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleJoin}
              disabled={joining}
              className="flex-1 rounded-2xl"
            >
              {joining ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Joining...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-user-plus mr-2"></i>
                  Join Club
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {!isAuthenticated() && (
        <div className="mb-6">
          <Card className="liquid-glass-card rounded-2xl">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground dark:text-gray-400 mb-4">
                Sign in to join this club
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full rounded-2xl"
              >
                Sign In to Join
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Сообщение для организаторов и админов */}
      {isAuthenticated() && user?.role !== 'STUDENT' && (
        <div className="mb-6">
          <Card className="liquid-glass-card rounded-2xl">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground dark:text-gray-400 text-center">
                {user?.role === 'ORGANIZER'
                  ? 'Organizers cannot join clubs. Manage your clubs from the dashboard.'
                  : 'Only students can join clubs.'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Club Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Organizer Card */}
        {club.organizer && (
          <Card className="liquid-glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">Organizer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {club.organizer.avatar ? (
                  <img
                    src={club.organizer.avatar}
                    alt={`${club.organizer.firstName} ${club.organizer.lastName}`}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold',
                    !club.organizer.avatar ? 'bg-primary' : 'hidden'
                  )}
                >
                  {club.organizer.firstName?.[0] || club.organizer.email?.[0] || 'U'}
                </div>
                <div>
                  <p className="font-semibold dark:text-white">
                    {club.organizer.firstName} {club.organizer.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">{club.organizer.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Club Stats */}
        <Card className="liquid-glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">Club Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground dark:text-gray-400">Members</span>
                <span className="font-semibold dark:text-white">{memberCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground dark:text-gray-400">Category</span>
                <Badge className={cn('text-white', getCategoryColor(club.category))}>
                  {mapCategoryToUI(club.category)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground dark:text-gray-400">Created</span>
                <span className="font-semibold dark:text-white">
                  {new Date(club.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for future features */}
      {/* TODO: Add events list when events are linked to clubs */}
      {/* TODO: Add members list when API supports it */}
    </div>
  );
}

