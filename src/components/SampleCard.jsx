import React, { useState } from 'react';
import { Play, Pause, Clock, Music, Key, Zap, Lock } from 'lucide-react';
import LicenseBadge from './LicenseBadge';
import { usePaymentContext } from '../hooks/usePaymentContext';

const SampleCard = ({ sample, variant = 'default', onSampleSelect, onOpenWizard }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAccess, setHasAccess] = useState(!sample.premium);
  const [isLoading, setIsLoading] = useState(false);
  const { createSession } = usePaymentContext();

  const handlePlayPause = (e) => {
    e.stopPropagation();
    if (sample.premium && !hasAccess) {
      handlePremiumAccess();
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const handlePremiumAccess = async () => {
    setIsLoading(true);
    try {
      await createSession();
      setHasAccess(true);
      setIsPlaying(true);
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = () => {
    if (onSampleSelect) {
      onSampleSelect(sample);
    }
  };

  if (variant === 'compact') {
    return (
      <div 
        className="card hover:cursor-pointer animate-fade-in"
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text truncate">{sample.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{sample.artist}</p>
            <LicenseBadge licenseType={sample.licenseType} cleared={sample.cleared} />
          </div>
          <button
            onClick={handlePlayPause}
            disabled={isLoading}
            className="ml-3 w-10 h-10 btn-primary rounded-full flex items-center justify-center disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : sample.premium && !hasAccess ? (
              <Lock className="w-4 h-4" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="card hover:cursor-pointer animate-slide-up"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-text truncate">{sample.title}</h3>
            {sample.premium && (
              <Zap className="w-4 h-4 text-accent flex-shrink-0" title="Premium sample" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{sample.artist}</p>
          <LicenseBadge licenseType={sample.licenseType} cleared={sample.cleared} />
        </div>
        <button
          onClick={handlePlayPause}
          disabled={isLoading}
          className="ml-3 w-12 h-12 btn-primary rounded-full flex items-center justify-center disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : sample.premium && !hasAccess ? (
            <Lock className="w-5 h-5" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-sm text-muted-foreground">{sample.description}</p>
        
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{sample.duration}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Music className="w-3 h-3" />
            <span>{sample.bpm} BPM</span>
          </div>
          {sample.key && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Key className="w-3 h-3" />
              <span>{sample.key}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {sample.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-bg border border-surface rounded-sm text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text">
          {sample.price === 0 ? 'Free' : `$${sample.price}`}
        </span>
        <div className="flex gap-2">
          {onOpenWizard && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onOpenWizard();
              }}
              className="px-3 py-1 text-xs bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
            >
              Usage Guide
            </button>
          )}
          <button className="btn-secondary text-sm">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default SampleCard;
