import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSavedEvents, useUnsaveEvent } from '../../hooks';
import EventCard from '../../components/EventCard';
import { toast } from 'sonner';


/**
 * SavedEventsTab - Displays user's saved/bookmarked events
 */
export default function SavedEventsTab() {
    const navigate = useNavigate();
    const { data: events = [], isLoading: loading } = useSavedEvents();
    const unsaveEventMutation = useUnsaveEvent();

    const handleEventClick = (eventId) => {
        navigate(`/events/${eventId}`);
    };


    const handleUnsave = async (eventId) => {
        try {
            await unsaveEventMutation.mutateAsync(eventId);
            toast.success('Event removed from saved');
        } catch (error) {
            console.error('[SavedEventsTab] Failed to unsave event:', error);
            toast.error('Failed to remove event');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#d62e1f]" />
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-12">
                <i className="fa-regular fa-bookmark text-5xl text-gray-400 dark:text-[#666666] mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Saved Events</h3>
                <p className="text-gray-600 dark:text-[#a0a0a0] mb-6">
                    Bookmark events you're interested in and they'll appear here
                </p>
                <Link
                    to="/events"
                    className="inline-flex items-center gap-2 px-6 py-3 liquid-glass-red-button text-white font-semibold rounded-2xl"
                >
                    Browse Events
                    <i className="fa-solid fa-arrow-right" />
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-[#a0a0a0]">
                    {events.length} saved {events.length === 1 ? 'event' : 'events'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map(event => (
                    <div key={event.id} className="relative">
                        <EventCard
                            event={event}
                            onClick={handleEventClick}
                            isSaved={true}
                            onToggleSave={() => handleUnsave(event.id)}
                        />
                    </div>

                ))}
            </div>
        </div>
    );
}
