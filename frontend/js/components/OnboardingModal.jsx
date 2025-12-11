import React, { useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import preferencesService from '../services/preferencesService';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';
import {
    EVENT_CATEGORIES,
    CSI_TAGS,
    DAYS_OF_WEEK,
    TIME_SLOTS,
    formatCategory,
    formatCsiTag,
    formatDay,
    formatTimeSlot
} from '../constants/preferences';

export default function OnboardingModal({ isOpen, onComplete }) {
    const { t } = useTranslation();
    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [preferences, setPreferences] = useState({
        preferredCategories: [],
        preferredCsiTags: [],
        availableDays: [],
        preferredTimeSlot: ''
    });

    const steps = [
        {
            title: t('onboarding.welcome'),
            subtitle: t('onboarding.subtitle'),
            content: (
                <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {t('onboarding.intro')}
                    </p>
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                        <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl">
                            <i className="fa-solid fa-calendar text-3xl text-[#d62e1f] mb-2" />
                            <p className="text-sm font-semibold">{t('onboarding.discoverEvents')}</p>
                        </div>
                        <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-xl">
                            <i className="fa-solid fa-medal text-3xl text-purple-600 mb-2" />
                            <p className="text-sm font-semibold">{t('onboarding.earnCsiPoints')}</p>
                        </div>
                        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl">
                            <i className="fa-solid fa-users text-3xl text-green-600 mb-2" />
                            <p className="text-sm font-semibold">{t('onboarding.joinClubs')}</p>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                            <i className="fa-solid fa-star text-3xl text-blue-600 mb-2" />
                            <p className="text-sm font-semibold">{t('onboarding.getRecommendations')}</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: t('onboarding.whatInterestsYou'),
            subtitle: t('onboarding.selectCategories'),
            content: (
                <div className="flex flex-wrap gap-3 justify-center max-w-2xl mx-auto py-4">
                    {EVENT_CATEGORIES.map(category => (
                        <Badge
                            key={category}
                            onClick={() => togglePreference('preferredCategories', category)}
                            className={`cursor-pointer transition-all px-4 py-3 text-base ${preferences.preferredCategories.includes(category)
                                ? 'bg-[#d62e1f] text-white hover:bg-[#b82419] scale-105 shadow-md'
                                : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3a3a3a]'
                                }`}
                        >
                            {formatCategory(category)}
                        </Badge>
                    ))}
                </div>
            )
        },
        {
            title: t('onboarding.csiInterests'),
            subtitle: t('onboarding.selectCsiTags'),
            content: (
                <div className="flex flex-wrap gap-4 justify-center max-w-2xl mx-auto py-6">
                    {CSI_TAGS.map(tag => (
                        <Badge
                            key={tag}
                            onClick={() => togglePreference('preferredCsiTags', tag)}
                            className={`cursor-pointer transition-all px-6 py-4 text-lg ${preferences.preferredCsiTags.includes(tag)
                                ? 'bg-purple-600 text-white hover:bg-purple-700 scale-105 shadow-md'
                                : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3a3a3a]'
                                }`}
                        >
                            {formatCsiTag(tag)}
                        </Badge>
                    ))}
                </div>
            )
        },
        {
            title: t('onboarding.whenFree'),
            subtitle: t('onboarding.selectCategories'),
            content: (
                <div className="space-y-6 max-w-lg mx-auto py-4">
                    <div>
                        <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">{t('onboarding.availableDays')}</h4>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {DAYS_OF_WEEK.map(day => (
                                <Badge
                                    key={day}
                                    onClick={() => togglePreference('availableDays', day)}
                                    className={`cursor-pointer transition-all px-4 py-2 ${preferences.availableDays.includes(day)
                                        ? 'bg-green-600 text-white hover:bg-green-700 scale-105'
                                        : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3a3a3a]'
                                        }`}
                                >
                                    {formatDay(day)}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">{t('onboarding.preferredTime')}</h4>
                        <div className="flex gap-3 justify-center">
                            {Object.values(TIME_SLOTS).map(slot => {
                                const { label, sublabel } = formatTimeSlot(slot);
                                return (
                                    <div
                                        key={slot}
                                        onClick={() => setPreferences(prev => ({ ...prev, preferredTimeSlot: slot }))}
                                        className={`cursor-pointer transition-all px-4 py-3 rounded-xl text-center ${preferences.preferredTimeSlot === slot
                                            ? 'bg-blue-600 text-white scale-105 shadow-md'
                                            : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3a3a3a]'
                                            }`}
                                    >
                                        <p className="font-semibold">{label}</p>
                                        <p className={`text-xs ${preferences.preferredTimeSlot === slot ? 'text-blue-100' : 'text-gray-500'}`}>
                                            {sublabel}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )
        }
    ];

    const togglePreference = (field, value) => {
        setPreferences(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(v => v !== value)
                : [...prev[field], value]
        }));
    };

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete(true);
    };

    const handleComplete = async (skipped = false) => {
        setIsLoading(true);
        try {
            if (!skipped) {
                await preferencesService.updateMyPreferences({
                    ...preferences,
                    onboardingCompleted: true
                });
                // Confetti celebration
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
                toast.success(t('onboarding.profileSetupComplete'));
            } else {
                await preferencesService.updateMyPreferences({
                    onboardingCompleted: true
                });
            }
            onComplete();
        } catch (error) {
            console.error('Failed to save preferences:', error);
            toast.error(t('onboarding.failedToSave'));
        } finally {
            setIsLoading(false);
        }
    };

    const canProceed = () => {
        if (step === 0) return true;
        if (step === 1) return preferences.preferredCategories.length > 0;
        if (step === 2) return preferences.preferredCsiTags.length > 0;
        if (step === 3) return preferences.availableDays.length > 0 && preferences.preferredTimeSlot;
        return true;
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { }} modal={true}>
            <DialogContent
                className="sm:max-w-2xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a]"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex gap-2 mb-2">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`h-2 flex-1 rounded-full transition-all ${i <= step ? 'bg-[#d62e1f]' : 'bg-gray-200 dark:bg-[#2a2a2a]'
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        {t('onboarding.stepXofY', { current: step + 1, total: steps.length })}
                    </p>
                </div>

                {/* Content */}
                <div className="py-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                        {steps[step].title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                        {steps[step].subtitle}
                    </p>
                    {steps[step].content}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
                    <Button
                        variant="ghost"
                        onClick={handleSkip}
                        disabled={isLoading}
                        className="text-gray-500"
                    >
                        {t('onboarding.skipForNow')}
                    </Button>
                    <div className="flex gap-2">
                        {step > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => setStep(step - 1)}
                                disabled={isLoading}
                            >
                                {t('onboarding.back')}
                            </Button>
                        )}
                        <Button
                            onClick={handleNext}
                            disabled={!canProceed() || isLoading}
                            className="bg-[#d62e1f] hover:bg-[#b82419] text-white"
                        >
                            {isLoading ? (
                                <>
                                    <i className="fa-solid fa-spinner fa-spin mr-2" />
                                    {t('onboarding.saving')}
                                </>
                            ) : (
                                <>
                                    {step === steps.length - 1 ? t('onboarding.complete') : t('onboarding.next')}
                                    <i className="fa-solid fa-arrow-right ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
