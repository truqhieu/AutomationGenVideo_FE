'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Clock, TrendingUp, Sparkles, Loader2, X } from 'lucide-react';
import { useSearchSuggestions, SearchSuggestion } from '@/hooks/useSearchSuggestions';

interface SearchAutocompleteProps {
    platform: string;
    value: string;
    onChange: (value: string) => void;
    onSearch: (query: string) => void;
    placeholder?: string;
    className?: string;
}

export default function SearchAutocomplete({
    platform,
    value,
    onChange,
    onSearch,
    placeholder = 'Tìm kiếm...',
    className = ''
}: SearchAutocompleteProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        suggestions,
        loading,
        fetchSuggestions,
        trackSearch,
        clearSuggestions
    } = useSearchSuggestions({ platform });

    // Fetch suggestions when value changes
    useEffect(() => {
        if (value && value.length >= 2) {
            fetchSuggestions(value);
        } else {
            clearSuggestions();
        }
    }, [value, fetchSuggestions, clearSuggestions]);

    // Handle click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setIsFocused(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        setSelectedIndex(-1);
    };

    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
        onChange(suggestion.text);
        setIsFocused(false);
        trackSearch(suggestion.text);
        onSearch(suggestion.text);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!suggestions.length) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    handleSuggestionClick(suggestions[selectedIndex]);
                } else if (value) {
                    trackSearch(value);
                    onSearch(value);
                    setIsFocused(false);
                }
                break;
            case 'Escape':
                setIsFocused(false);
                break;
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value) {
            trackSearch(value);
            onSearch(value);
            setIsFocused(false);
        }
    };

    const handleClear = () => {
        onChange('');
        clearSuggestions();
        inputRef.current?.focus();
    };

    const getSuggestionIcon = (type: SearchSuggestion['type']) => {
        switch (type) {
            case 'history':
                return <Clock className="w-4 h-4 text-gray-400" />;
            case 'trending':
                return <TrendingUp className="w-4 h-4 text-orange-400" />;
            case 'ai':
                return <Sparkles className="w-4 h-4 text-purple-400" />;
        }
    };

    const showDropdown = isFocused && (suggestions.length > 0 || loading);

    return (
        <div className={`relative ${className}`}>
            {/* Search Input */}
            <form onSubmit={handleSubmit} className="relative">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />

                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={handleInputChange}
                        onFocus={() => setIsFocused(true)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="w-full pl-12 pr-12 py-3 bg-[#1a1a1a] border border-gray-800 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />

                    {/* Loading or Clear Button */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {loading ? (
                            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                        ) : value ? (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-400 hover:text-white" />
                            </button>
                        ) : null}
                    </div>
                </div>
            </form>

            {/* Suggestions Dropdown */}
            {showDropdown && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                    {suggestions.length === 0 ? (
                        <div className="px-4 py-3 text-center text-gray-500 text-sm">
                            {loading ? 'Đang tìm gợi ý...' : 'Không có gợi ý'}
                        </div>
                    ) : (
                        <>
                            {/* Simple list - no grouping */}
                            {suggestions.slice(0, 6).map((suggestion, idx) => (
                                <SuggestionItem
                                    key={`suggestion-${idx}`}
                                    suggestion={suggestion}
                                    isSelected={selectedIndex === idx}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    icon={getSuggestionIcon(suggestion.type)}
                                />
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// Suggestion Item Component
interface SuggestionItemProps {
    suggestion: SearchSuggestion;
    isSelected: boolean;
    onClick: () => void;
    icon: React.ReactNode;
}

function SuggestionItem({ suggestion, isSelected, onClick, icon }: SuggestionItemProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left ${isSelected
                ? 'bg-purple-600/20 text-white'
                : 'hover:bg-gray-800/50 text-gray-300'
                }`}
        >
            {icon}
            <span className="flex-1 text-sm">{suggestion.text}</span>

            {/* Count badge for history */}
            {suggestion.type === 'history' && suggestion.count && suggestion.count > 1 && (
                <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded-full">
                    {suggestion.count}
                </span>
            )}

            {/* Trending indicator */}
            {suggestion.type === 'trending' && (
                <span className="text-xs text-orange-400">🔥</span>
            )}
        </button>
    );
}
