import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import savedPostsService from '../services/savedPostsService';
import savedEventsService from '../services/savedEventsService';
import EventCard from '../components/EventCard';
import PostCard from '../components/posts/PostCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { toast } from 'sonner';

/**
 * SavedPage - Combined saved posts and events view
 */
export default function SavedPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('posts');
    const [savedPosts, setSavedPosts] = useState([]);
    const [savedEvents, setSavedEvents] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [loadingEvents, setLoadingEvents] = useState(true);

    useEffect(() => {
        loadSavedPosts();
        loadSavedEvents();
    }, []);

    const loadSavedPosts = async () => {
        try {
            setLoadingPosts(true);
            const response = await savedPostsService.getAll();
            const posts = (response.data || []).map(sp => sp.post).filter(Boolean);
            setSavedPosts(posts);
        } catch (error) {
            console.error('[SavedPage] Failed to load saved posts:', error);
        } finally {
            setLoadingPosts(false);
        }
    };

    const loadSavedEvents = async () => {
        try {
            setLoadingEvents(true);
            const response = await savedEventsService.getAll();
            const events = (response.data || response || []).map(se => se.event).filter(Boolean);
            setSavedEvents(events);
        } catch (error) {
            console.error('[SavedPage] Failed to load saved events:', error);
        } finally {
            setLoadingEvents(false);
        }
    };

    const handleUnsavePost = async (postId) => {
        try {
            await savedPostsService.unsave(postId);
            setSavedPosts(prev => prev.filter(p => p.id !== postId));
            toast.success('Post removed from saved');
        } catch (error) {
            toast.error('Failed to remove post');
        }
    };

    const handleUnsaveEvent = async (eventId) => {
        try {
            await savedEventsService.unsave(eventId);
            setSavedEvents(prev => prev.filter(e => e.id !== eventId));
            toast.success('Event removed from saved');
        } catch (error) {
            toast.error('Failed to remove event');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-24 md:pb-8 transition-colors duration-300">
            {/* Header */}
            <div className="bg-gradient-to-b from-gray-200 via-gray-100 to-gray-50 dark:from-[#1a1a1a] dark:via-[#0f0f0f] dark:to-[#0a0a0a] py-6 px-4 border-b border-gray-200 dark:border-[#2a2a2a]">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-4">
                        <Link to="/profile" className="text-gray-600 dark:text-gray-400 hover:text-[#d62e1f]">
                            <i className="fa-solid fa-arrow-left text-xl" />
                        </Link>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
                            <span className="text-[#d62e1f]">Saved</span>
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-gray-100 dark:bg-white/5 p-1 mb-6">
                        <TabsTrigger
                            value="posts"
                            className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-sm transition-all"
                        >
                            <i className="fa-solid fa-newspaper mr-2" />
                            Posts ({savedPosts.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="events"
                            className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-sm transition-all"
                        >
                            <i className="fa-solid fa-calendar mr-2" />
                            Events ({savedEvents.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="posts">
                        {loadingPosts ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#d62e1f]" />
                            </div>
                        ) : savedPosts.length === 0 ? (
                            <div className="text-center py-12">
                                <i className="fa-regular fa-bookmark text-5xl text-gray-400 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Saved Posts</h3>
                                <p className="text-gray-600 dark:text-[#a0a0a0]">
                                    Bookmark posts you like and they'll appear here
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {savedPosts.map(post => (
                                    <div key={post.id} className="relative">
                                        <PostCard
                                            post={post}
                                            onDelete={() => handleUnsavePost(post.id)}
                                            isSaved={true}
                                            onToggleSave={() => handleUnsavePost(post.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="events">
                        {loadingEvents ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#d62e1f]" />
                            </div>
                        ) : savedEvents.length === 0 ? (
                            <div className="text-center py-12">
                                <i className="fa-regular fa-calendar text-5xl text-gray-400 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Saved Events</h3>
                                <p className="text-gray-600 dark:text-[#a0a0a0] mb-6">
                                    Bookmark events you're interested in
                                </p>
                                <Link
                                    to="/events"
                                    className="inline-flex items-center gap-2 px-6 py-3 liquid-glass-red-button text-white font-semibold rounded-2xl"
                                >
                                    Browse Events
                                    <i className="fa-solid fa-arrow-right" />
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {savedEvents.map(event => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        isSaved={true}
                                        onToggleSave={() => handleUnsaveEvent(event.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
