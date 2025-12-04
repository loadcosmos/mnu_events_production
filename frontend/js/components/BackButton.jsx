import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

/**
 * Universal Back Button component
 * Uses browser history if available, otherwise navigates to fallback path
 */
export default function BackButton({ fallback = '/', className = '', label = 'Back' }) {
    const navigate = useNavigate();

    const handleBack = () => {
        // Check if there's history to go back to
        // window.history.length > 2 because: 
        // 1 = empty history, 2 = only current page
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate(fallback);
        }
    };

    return (
        <Button
            variant="ghost"
            onClick={handleBack}
            className={`mb-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white ${className}`}
        >
            <i className="fa-solid fa-arrow-left mr-2" />
            {label}
        </Button>
    );
}
