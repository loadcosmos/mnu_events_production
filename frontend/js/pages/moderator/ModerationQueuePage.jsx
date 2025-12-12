import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { moderationService } from '../../services/moderationService';
import { Button } from '../../components/ui/button';
import { formatDate } from '../../utils/dateFormatters';
import { sanitizeText } from '../../utils/sanitize';
import { useTranslation } from 'react-i18next';

export default function ModerationQueuePage() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { t } = useTranslation();
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('PENDING');
    const [filterType, setFilterType] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        loadQueue();
    }, [filterStatus, filterType]);

    const loadQueue = async () => {
        try {
            setLoading(true);
            const data = await moderationService.getQueue(filterStatus, filterType || undefined);
            setQueue(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load moderation queue:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            setProcessingId(id);
            await moderationService.approve(id);
            loadQueue(); // Reload list
        } catch (error) {
            console.error('Failed to approve item:', error);
            // In a real app we'd use toast here
            console.error(t('moderator.failedToApprove'));
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectModal = (item) => {
        setSelectedItem(item);
        setRejectionReason('');
        setRejectModalOpen(true);
    };

    const handleReject = async () => {
        if (!selectedItem || !rejectionReason.trim()) return;

        try {
            setProcessingId(selectedItem.id);
            await moderationService.reject(selectedItem.id, rejectionReason);
            setRejectModalOpen(false);
            setSelectedItem(null);
            loadQueue();
        } catch (error) {
            console.error('Failed to reject item:', error);
            console.error(t('moderator.failedToReject'));
        } finally {
            setProcessingId(null);
        }
    };

    const getItemTitle = (item) => {
        if (!item.details) return t('moderator.contentNotFound');
        return item.details.title || item.details.name || t('moderator.untitled');
    };

    const getItemDescription = (item) => {
        if (!item.details) return '';
        return sanitizeText(item.details.description || '');
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        {t('moderator.moderationQueue')}
                    </h1>
                    <p className="text-gray-600 dark:text-[#a0a0a0]">
                        {t('moderator.reviewContent')}
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#d62e1f] focus:border-transparent outline-none"
                    >
                        <option value="PENDING">{t('moderator.pending')}</option>
                        <option value="APPROVED">{t('moderator.approved')}</option>
                        <option value="REJECTED">{t('moderator.rejected')}</option>
                    </select>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#d62e1f] focus:border-transparent outline-none"
                    >
                        <option value="">{t('moderator.allTypes')}</option>
                        <option value="SERVICE">{t('moderator.services')}</option>
                        <option value="EVENT">{t('moderator.events')}</option>
                        <option value="ADVERTISEMENT">{t('moderator.ads')}</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d62e1f]"></div>
                </div>
            ) : queue.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a]">
                    <i className="fa-solid fa-check-circle text-4xl text-green-500 mb-4"></i>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">{t('moderator.allCaughtUp')}</p>
                    <p className="text-gray-600 dark:text-[#a0a0a0]">{t('moderator.noItemsFound')}</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {queue.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#2a2a2a] shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="flex flex-col md:flex-row gap-6 justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${item.itemType === 'SERVICE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            item.itemType === 'EVENT' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                            }`}>
                                            {item.itemType}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-[#666666]">
                                            {t('moderator.submitted')}: {formatDate(item.createdAt)}
                                        </span>
                                        {item.status !== 'PENDING' && (
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${item.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {item.status}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {getItemTitle(item)}
                                    </h3>

                                    <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-4 mb-4 text-gray-700 dark:text-[#d0d0d0] text-sm">
                                        {getItemDescription(item)}
                                    </div>

                                    {item.details?.imageUrl && (
                                        <img
                                            src={item.details.imageUrl}
                                            alt={t('moderator.preview')}
                                            className="w-32 h-32 object-cover rounded-lg mb-4"
                                        />
                                    )}

                                    {item.rejectionReason && (
                                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/30">
                                            <p className="text-sm font-bold text-red-800 dark:text-red-400 mb-1">{t('moderator.rejectionReason')}:</p>
                                            <p className="text-sm text-red-700 dark:text-red-300">{item.rejectionReason}</p>
                                        </div>
                                    )}
                                </div>

                                {item.status === 'PENDING' && (
                                    <div className="flex flex-row md:flex-col gap-3 min-w-[140px] justify-center">
                                        <Button
                                            onClick={() => handleApprove(item.id)}
                                            disabled={processingId === item.id}
                                            className="bg-green-600 hover:bg-green-700 text-white w-full"
                                        >
                                            {processingId === item.id ? t('moderator.processing') : t('moderator.approve')}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => openRejectModal(item)}
                                            disabled={processingId === item.id}
                                            className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                                        >
                                            {t('moderator.reject')}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-[#2a2a2a]">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('moderator.rejectSubmission')}</h3>
                    <p className="text-gray-600 dark:text-[#a0a0a0] mb-4 text-sm">
                        {t('moderator.provideReason')}
                    </p>
                    <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full h-32 p-3 rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#111] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#d62e1f] outline-none resize-none mb-6"
                        placeholder={t('moderator.enterRejectionReason')}
                    />
                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="ghost"
                            onClick={() => setRejectModalOpen(false)}
                            className="text-gray-600 dark:text-[#a0a0a0]"
                        >
                            {t('moderator.cancel')}
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={!rejectionReason.trim() || processingId === selectedItem?.id}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {processingId === selectedItem?.id ? t('moderator.rejecting') : t('moderator.confirmRejection')}
                        </Button>
                    </div>
                </div>
            </div>
            )
        </div>
    );
}
