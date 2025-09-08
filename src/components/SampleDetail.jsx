import React, { useState } from 'react';
import { ArrowLeft, Play, Pause, Download, Shield, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import LicenseBadge from './LicenseBadge';
import { usePaymentContext } from '../hooks/usePaymentContext';

const SampleDetail = ({ sample, onBack, onOpenWizard }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAccess, setHasAccess] = useState(!sample.premium);
  const [isLoading, setIsLoading] = useState(false);
  const { createSession } = usePaymentContext();

  const handlePlayPause = async () => {
    if (sample.premium && !hasAccess) {
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
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const getClearanceInfo = () => {
    if (sample.cleared) {
      return {
        icon: CheckCircle,
        text: 'Sample Cleared for Commercial Use',
        description: 'This sample has been verified as cleared for commercial use. You can use it in your productions without additional clearance.',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30'
      };
    } else {
      return {
        icon: AlertTriangle,
        text: 'Clearance Verification Needed',
        description: 'This sample requires additional clearance verification before commercial use. Our team can help you navigate the clearance process.',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30'
      };
    }
  };

  const clearanceInfo = getClearanceInfo();
  const ClearanceIcon = clearanceInfo.icon;

  return (
    <div className="animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-surface rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h2 className="text-xl font-bold text-text">Sample Details</h2>
      </div>

      <div className="card mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text mb-1">{sample.title}</h1>
            <p className="text-lg text-muted-foreground mb-3">{sample.artist}</p>
            <LicenseBadge licenseType={sample.licenseType} cleared={sample.cleared} />
          </div>
          <button
            onClick={handlePlayPause}
            disabled={isLoading}
            className="w-16 h-16 btn-primary rounded-full flex items-center justify-center disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : sample.premium && !hasAccess ? (
              <Lock className="w-6 h-6" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>
        </div>

        <p className="text-text mb-4">{sample.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <span className="text-xs text-muted-foreground">Duration</span>
            <p className="font-medium text-text">{sample.duration}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">BPM</span>
            <p className="font-medium text-text">{sample.bpm}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Key</span>
            <p className="font-medium text-text">{sample.key || 'N/A'}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Price</span>
            <p className="font-medium text-text">{sample.price === 0 ? 'Free' : `$${sample.price}`}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
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

      <div className={`card ${clearanceInfo.bgColor} ${clearanceInfo.borderColor} mb-6`}>
        <div className="flex items-start gap-3">
          <ClearanceIcon className={`w-6 h-6 ${clearanceInfo.color} flex-shrink-0 mt-1`} />
          <div>
            <h3 className={`font-semibold ${clearanceInfo.color} mb-2`}>
              {clearanceInfo.text}
            </h3>
            <p className="text-sm text-muted-foreground">
              {clearanceInfo.description}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-text mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent" />
          Usage Rights & Licensing
        </h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Commercial Use:</span>
            <span className={sample.cleared ? 'text-green-400' : 'text-orange-400'}>
              {sample.cleared ? 'Allowed' : 'Requires Clearance'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Attribution Required:</span>
            <span className="text-text">
              {sample.licenseType === 'royalty-free' ? 'No' : 'Yes'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Resale Rights:</span>
            <span className="text-text">Not Allowed</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sync Licensing:</span>
            <span className="text-text">
              {sample.licenseType === 'contact-required' ? 'Contact Required' : 'Included'}
            </span>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button 
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            disabled={!hasAccess && sample.premium}
          >
            <Download className="w-4 h-4" />
            {sample.premium && !hasAccess ? 'Purchase to Download' : 'Download Sample'}
          </button>
          {onOpenWizard && (
            <button 
              onClick={onOpenWizard}
              className="btn-secondary flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Usage Wizard
            </button>
          )}
          {!sample.cleared && (
            <button className="btn-secondary flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Request Clearance
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SampleDetail;
