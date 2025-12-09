import { useState, useEffect, useCallback } from 'react';
import savedEventsService from '../services/savedEventsService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

/**
 * Hook to manage saved events
 * Fetches all saved event IDs and provides toggle functionality
 */
export function useSavedEvents() {
    const { user } = useAuth();
    const [savedEventIds, setSavedEventIds] = useState(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchSavedEvents();
        } else {
            setSavedEventIds(new Set());
        }
    }, [user]);

    const fetchSavedEvents = async () => {
        try {
            setLoading(true);
            const response = await savedEventsService.getAll({ limit: 1000 }); // Fetch all or reasonable limit
            // response.data is array of events. We need IDs.
            // But wait, getAll returns { data: [events], meta: ... }
            // savedEventsService.getAll returns whatever API returns.
            // Backend: data: savedEvents.map(se => se.event)
            // So we get array of Event objects.

            const ids = new Set(response.data.map(event => event.id));
            setSavedEventIds(ids);
        } catch (error) {
            console.error('Failed to fetch saved events', error);
            // Silent error or toast? Silent for initial load usually better, or debug log
        } finally {
            setLoading(false);
        }
    };

    const toggleSave = useCallback(async (eventId) => {
        if (!user) {
            toast.error('Please log in to save events');
            return;
        }

        const isSaved = savedEventIds.has(eventId);

        // Optimistic update
        setSavedEventIds(prev => {
            const next = new Set(prev);
            if (isSaved) next.delete(eventId);
            else next.add(eventId);
            return next;
        });

        try {
            if (isSaved) {
                await savedEventsService.unsave(eventId);
                toast.success('Event removed from saved');
            } else {
                await savedEventsService.save(eventId);
                toast.success('Event saved');
            }
        } catch (error) {
            // Revert on error
            setSavedEventIds(prev => {
                const next = new Set(prev);
                if (isSaved) next.add(eventId);
                else next.delete(eventId);
                return next;
            });
            toast.error('Failed to update saved status');
        }
    }, [user, savedEventIds]);

    return { savedEventIds, toggleSave, loading };
}
