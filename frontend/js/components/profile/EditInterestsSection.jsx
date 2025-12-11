import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import preferencesService from '../../services/preferencesService';
import { toast } from 'sonner';
import {
    EVENT_CATEGORIES,
    CSI_TAGS,
    DAYS_OF_WEEK,
    TIME_SLOTS,
    formatCategory,
    formatCsiTag,
    formatDay
} from '../../constants/preferences';

/**
 * EditInterestsSection - Modal content for editing user interests/preferences
 */
export default function EditInterestsSection({ onSave }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preferences, setPreferences] = useState({
        preferredCategories: [],
        preferredCsiTags: [],
        availableDays: [],
        preferredTimeSlot: ''
    });
    const [originalPreferences, setOriginalPreferences] = useState(null);

    // Check if there are unsaved changes
    const hasChanges = originalPreferences !== null &&
        JSON.stringify(preferences) !== originalPreferences;

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            setLoading(true);
            const data = await preferencesService.getMyPreferences();
            const prefs = {
                preferredCategories: data.preferredCategories || [],
                preferredCsiTags: data.preferredCsiTags || [],
                availableDays: data.availableDays || [],
                preferredTimeSlot: data.preferredTimeSlot || ''
            };
            setPreferences(prefs);
            setOriginalPreferences(JSON.stringify(prefs));
        } catch (error) {
            console.error('[EditInterestsSection] Failed to load preferences:', error);
            // Preferences may not exist yet, that's ok
        } finally {
            setLoading(false);
        }
    };

    const toggleCategory = (category) => {
        setPreferences(prev => ({
            ...prev,
            preferredCategories: prev.preferredCategories.includes(category)
                ? prev.preferredCategories.filter(c => c !== category)
                : [...prev.preferredCategories, category]
        }));
    };

    const toggleCsiTag = (tag) => {
        setPreferences(prev => ({
            ...prev,
            preferredCsiTags: prev.preferredCsiTags.includes(tag)
                ? prev.preferredCsiTags.filter(t => t !== tag)
                : [...prev.preferredCsiTags, tag]
        }));
    };

    const toggleDay = (day) => {
        setPreferences(prev => ({
            ...prev,
            availableDays: prev.availableDays.includes(day)
                ? prev.availableDays.filter(d => d !== day)
                : [...prev.availableDays, day]
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await preferencesService.updateMyPreferences(preferences);
            setOriginalPreferences(JSON.stringify(preferences));
            toast.success('Preferences saved!');
            if (onSave) onSave();
        } catch (error) {
            console.error('[EditInterestsSection] Failed to save preferences:', error);
            toast.error('Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d62e1f]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Preferred Event Categories */}
            <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    <i className="fa-solid fa-tags mr-2 text-[#d62e1f]" />
                    Event Categories You Like
                </h4>
                <div className="flex flex-wrap gap-2">
                    {EVENT_CATEGORIES.map(category => (
                        <Badge
                            key={category}
                            onClick={() => toggleCategory(category)}
                            className={`cursor-pointer transition-all ${preferences.preferredCategories.includes(category)
                                ? 'bg-[#d62e1f] text-white hover:bg-[#b82419]'
                                : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3a3a3a]'
                                }`}
                        >
                            {formatCategory(category)}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* CSI Tags */}
            <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    <i className="fa-solid fa-medal mr-2 text-[#d62e1f]" />
                    CSI Activity Interests
                </h4>
                <div className="flex flex-wrap gap-2">
                    {CSI_TAGS.map(tag => (
                        <Badge
                            key={tag}
                            onClick={() => toggleCsiTag(tag)}
                            className={`cursor-pointer transition-all ${preferences.preferredCsiTags.includes(tag)
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3a3a3a]'
                                }`}
                        >
                            {formatCsiTag(tag)}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Available Days */}
            <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    <i className="fa-solid fa-calendar-days mr-2 text-[#d62e1f]" />
                    When Are You Usually Free?
                </h4>
                <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day => (
                        <Badge
                            key={day}
                            onClick={() => toggleDay(day)}
                            className={`cursor-pointer transition-all ${preferences.availableDays.includes(day)
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3a3a3a]'
                                }`}
                        >
                            {formatDay(day)}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Time Slot Preference */}
            <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    <i className="fa-solid fa-clock mr-2 text-[#d62e1f]" />
                    Preferred Time
                </h4>
                <div className="flex gap-2">
                    {Object.values(TIME_SLOTS).map(slot => (
                        <Badge
                            key={slot}
                            onClick={() => setPreferences(prev => ({ ...prev, preferredTimeSlot: slot }))}
                            className={`cursor-pointer transition-all px-4 py-2 ${preferences.preferredTimeSlot === slot
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3a3a3a]'
                                }`}
                        >
                            {slot.charAt(0) + slot.slice(1).toLowerCase()}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Save Button - Only show when there are changes */}
            {hasChanges && (
                <div className="pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-2 mb-3 text-amber-600 dark:text-amber-400 text-sm">
                        <i className="fa-solid fa-circle-exclamation" />
                        <span>You have unsaved changes</span>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full liquid-glass-red-button text-white rounded-xl"
                    >
                        {saving ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin mr-2" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-check mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
