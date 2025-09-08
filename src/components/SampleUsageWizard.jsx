import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Info, X, FileText, Scale, DollarSign } from 'lucide-react';
import { openaiService } from '../services/openai';
import LicenseBadge from './LicenseBadge';
import toast from 'react-hot-toast';

const SampleUsageWizard = ({ sample, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [checklist, setChecklist] = useState([]);
  const [licenseSummary, setLicenseSummary] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userResponses, setUserResponses] = useState({});

  const steps = [
    {
      id: 'overview',
      title: 'Sample Overview',
      icon: Info,
      description: 'Review sample details and license type'
    },
    {
      id: 'license',
      title: 'License Requirements',
      icon: Scale,
      description: 'Understand what this license allows and requires'
    },
    {
      id: 'checklist',
      title: 'Clearance Checklist',
      icon: CheckCircle,
      description: 'Complete the verification checklist'
    },
    {
      id: 'pricing',
      title: 'Usage Costs',
      icon: DollarSign,
      description: 'Review pricing and payment requirements'
    },
    {
      id: 'summary',
      title: 'Summary & Next Steps',
      icon: FileText,
      description: 'Review your clearance status and next actions'
    }
  ];

  useEffect(() => {
    loadWizardData();
  }, [sample]);

  const loadWizardData = async () => {
    setIsLoading(true);
    
    try {
      // Generate license summary
      const summaryResult = await openaiService.generateLicenseSummary(sample.licenseType, sample);
      if (summaryResult.success) {
        setLicenseSummary(summaryResult.data.summary);
      }

      // Generate clearance checklist
      const checklistResult = await openaiService.generateClearanceChecklist(sample);
      if (checklistResult.success) {
        setChecklist(checklistResult.data);
      }
    } catch (error) {
      console.error('Failed to load wizard data:', error);
      toast.error('Failed to load wizard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChecklistItemToggle = (stepIndex, completed) => {
    const updatedChecklist = [...checklist];
    updatedChecklist[stepIndex].completed = completed;
    setChecklist(updatedChecklist);
  };

  const handleUserResponse = (key, value) => {
    setUserResponses(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getCompletionStatus = () => {
    const requiredItems = checklist.filter(item => item.required);
    const completedRequired = requiredItems.filter(item => item.completed);
    return {
      completed: completedRequired.length,
      total: requiredItems.length,
      percentage: requiredItems.length > 0 ? (completedRequired.length / requiredItems.length) * 100 : 0
    };
  };

  const canProceedToNext = () => {
    if (currentStep === 2) { // Checklist step
      const status = getCompletionStatus();
      return status.percentage >= 80; // Require 80% completion
    }
    return true;
  };

  const getPriceInfo = () => {
    switch (sample.licenseType) {
      case 'royalty-free':
        return {
          cost: '$0',
          description: 'This sample is free to use under its license terms.',
          paymentRequired: false
        };
      case 'paid':
        return {
          cost: `$${sample.price || 10}`,
          description: 'One-time payment required for commercial use rights.',
          paymentRequired: true
        };
      case 'contact-required':
        return {
          cost: 'Contact for pricing',
          description: 'Custom licensing required. Contact rights holder for terms.',
          paymentRequired: false
        };
      default:
        return {
          cost: 'Unknown',
          description: 'Pricing information not available.',
          paymentRequired: false
        };
    }
  };

  const handleComplete = () => {
    const status = getCompletionStatus();
    const priceInfo = getPriceInfo();
    
    const completionData = {
      sample,
      checklist,
      userResponses,
      completionStatus: status,
      priceInfo,
      licenseSummary,
      completedAt: new Date().toISOString()
    };

    onComplete?.(completionData);
    toast.success('Usage wizard completed!');
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-surface rounded-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text">Loading usage wizard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-text">Sample Usage Wizard</h2>
              <p className="text-muted-foreground">"{sample.title}" by {sample.artist}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white'
                      : isActive
                      ? 'bg-primary border-primary text-white'
                      : 'border-muted-foreground/30 text-muted-foreground'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 ml-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-muted-foreground/30'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {/* Step 0: Overview */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-medium text-text mb-2">Sample Overview</h3>
                  <p className="text-muted-foreground">
                    Let's review the details of this sample and its licensing requirements.
                  </p>
                </div>

                <div className="bg-bg p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-text mb-2">Sample Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Title:</span>
                            <span className="text-text">{sample.title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Artist:</span>
                            <span className="text-text">{sample.artist}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Genre:</span>
                            <span className="text-text">{sample.genre}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="text-text">{sample.duration}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">BPM:</span>
                            <span className="text-text">{sample.bpm}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Key:</span>
                            <span className="text-text">{sample.key}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-text mb-2">License Information</h4>
                        <div className="space-y-3">
                          <LicenseBadge licenseType={sample.licenseType} />
                          <div className="flex items-center space-x-2">
                            {sample.cleared ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-green-400">Pre-cleared for use</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4 text-orange-400" />
                                <span className="text-sm text-orange-400">Clearance verification needed</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {sample.tags && (
                        <div>
                          <h4 className="font-medium text-text mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {sample.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-surface text-xs rounded-md text-accent">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: License Requirements */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-medium text-text mb-2">License Requirements</h3>
                  <p className="text-muted-foreground">
                    Understanding what this license allows and requires for your use case.
                  </p>
                </div>

                <div className="bg-bg p-6 rounded-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <Scale className="w-6 h-6 text-primary" />
                    <h4 className="text-lg font-medium text-text">
                      {sample.licenseType.charAt(0).toUpperCase() + sample.licenseType.slice(1).replace('-', ' ')} License
                    </h4>
                  </div>
                  
                  {licenseSummary ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-muted-foreground whitespace-pre-line">{licenseSummary}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Loading license information...</p>
                  )}
                </div>

                <div className="bg-bg p-6 rounded-lg">
                  <h4 className="font-medium text-text mb-4">Your Usage Intent</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        How do you plan to use this sample?
                      </label>
                      <select
                        value={userResponses.usageType || ''}
                        onChange={(e) => handleUserResponse('usageType', e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-muted-foreground/30 rounded-lg text-text focus:outline-none focus:border-primary"
                      >
                        <option value="">Select usage type</option>
                        <option value="personal">Personal/Non-commercial</option>
                        <option value="commercial">Commercial release</option>
                        <option value="streaming">Streaming platforms</option>
                        <option value="sync">TV/Film sync</option>
                        <option value="live">Live performances</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Expected distribution scale
                      </label>
                      <select
                        value={userResponses.scale || ''}
                        onChange={(e) => handleUserResponse('scale', e.target.value)}
                        className="w-full px-3 py-2 bg-surface border border-muted-foreground/30 rounded-lg text-text focus:outline-none focus:border-primary"
                      >
                        <option value="">Select scale</option>
                        <option value="small">Small (< 1K plays/views)</option>
                        <option value="medium">Medium (1K - 100K plays/views)</option>
                        <option value="large">Large (100K+ plays/views)</option>
                        <option value="major">Major label/commercial</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Checklist */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-medium text-text mb-2">Clearance Checklist</h3>
                  <p className="text-muted-foreground">
                    Complete these steps to ensure proper clearance for your usage.
                  </p>
                </div>

                {checklist.length > 0 && (
                  <div className="bg-bg p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-text">Verification Steps</h4>
                      <div className="text-sm text-muted-foreground">
                        {getCompletionStatus().completed} of {getCompletionStatus().total} required steps completed
                      </div>
                    </div>

                    <div className="space-y-4">
                      {checklist.map((item, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-surface rounded-lg">
                          <button
                            onClick={() => handleChecklistItemToggle(index, !item.completed)}
                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              item.completed
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-muted-foreground/30 hover:border-primary'
                            }`}
                          >
                            {item.completed && <CheckCircle className="w-3 h-3" />}
                          </button>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h5 className="font-medium text-text">{item.title}</h5>
                              {item.required && (
                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                  Required
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 bg-surface rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${
                          getCompletionStatus().percentage >= 80 ? 'bg-green-500' : 'bg-orange-500'
                        }`} />
                        <span className="text-sm font-medium text-text">
                          Completion Status: {Math.round(getCompletionStatus().percentage)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted-foreground/20 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getCompletionStatus().percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Pricing */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-medium text-text mb-2">Usage Costs</h3>
                  <p className="text-muted-foreground">
                    Review the pricing and payment requirements for this sample.
                  </p>
                </div>

                <div className="bg-bg p-6 rounded-lg">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {getPriceInfo().cost}
                    </div>
                    <p className="text-muted-foreground">{getPriceInfo().description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-text mb-3">What's Included</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span>High-quality audio file</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span>Usage rights documentation</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span>Clearance verification</span>
                        </li>
                        {sample.licenseType === 'royalty-free' && (
                          <li className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span>No ongoing royalties</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-text mb-3">Payment Terms</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">License Type:</span>
                          <span className="text-text capitalize">{sample.licenseType.replace('-', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Method:</span>
                          <span className="text-text">Crypto (Base network)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Processing:</span>
                          <span className="text-text">Instant</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Summary */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-medium text-text mb-2">Summary & Next Steps</h3>
                  <p className="text-muted-foreground">
                    Review your clearance status and recommended next actions.
                  </p>
                </div>

                <div className="bg-bg p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-text mb-3">Clearance Status</h4>
                      <div className="space-y-3">
                        <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                          getCompletionStatus().percentage >= 80
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-orange-500/10 text-orange-400'
                        }`}>
                          {getCompletionStatus().percentage >= 80 ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <AlertTriangle className="w-5 h-5" />
                          )}
                          <span className="font-medium">
                            {getCompletionStatus().percentage >= 80 ? 'Ready to Use' : 'Additional Steps Needed'}
                          </span>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <p>Checklist completion: {Math.round(getCompletionStatus().percentage)}%</p>
                          <p>Usage type: {userResponses.usageType || 'Not specified'}</p>
                          <p>Distribution scale: {userResponses.scale || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-text mb-3">Next Steps</h4>
                      <div className="space-y-2 text-sm">
                        {getCompletionStatus().percentage >= 80 ? (
                          <>
                            <div className="flex items-start space-x-2">
                              <span className="text-primary">1.</span>
                              <span className="text-muted-foreground">
                                {getPriceInfo().paymentRequired ? 'Complete payment to unlock sample' : 'Download and use the sample'}
                              </span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <span className="text-primary">2.</span>
                              <span className="text-muted-foreground">Keep clearance documentation for your records</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <span className="text-primary">3.</span>
                              <span className="text-muted-foreground">Follow any attribution requirements</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-start space-x-2">
                              <span className="text-orange-400">1.</span>
                              <span className="text-muted-foreground">Complete remaining checklist items</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <span className="text-orange-400">2.</span>
                              <span className="text-muted-foreground">Verify usage rights with rights holder</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <span className="text-orange-400">3.</span>
                              <span className="text-muted-foreground">Return to complete the wizard</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-muted-foreground/20">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-4 py-2 text-muted-foreground hover:text-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToNext()}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Complete Wizard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleUsageWizard;
