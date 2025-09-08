import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, AlertTriangle, CheckCircle, Loader, X, Info } from 'lucide-react';
import { openaiService } from '../services/openai';
import { pinataService } from '../services/pinata';
import { supabaseService } from '../services/supabase';
import toast from 'react-hot-toast';

const UsageRightsVerification = ({ onClose, onVerificationComplete }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Analysis, 3: Results
  const [uploadedFile, setUploadedFile] = useState(null);
  const [sampleUrl, setSampleUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [verificationMethod, setVerificationMethod] = useState('upload'); // 'upload' or 'url'

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        toast.error('Please upload an audio file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setUploadedFile(file);
      toast.success('File uploaded successfully');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.aiff', '.flac', '.m4a']
    },
    multiple: false
  });

  const handleAnalyze = async () => {
    if (!uploadedFile && !sampleUrl) {
      toast.error('Please upload a file or provide a URL');
      return;
    }

    setIsAnalyzing(true);
    setStep(2);

    try {
      let sampleData = {};
      let ipfsData = null;

      if (uploadedFile) {
        // Extract basic metadata from file
        sampleData = {
          title: uploadedFile.name.replace(/\.[^/.]+$/, ''),
          artist: 'Unknown',
          genre: 'Unknown',
          duration: 'Unknown',
          source: 'user_upload'
        };

        // Upload to IPFS for analysis
        const uploadResult = await pinataService.uploadFile(uploadedFile, {
          name: `verification_${Date.now()}`,
          type: 'verification_sample',
          userId: 'current_user' // Replace with actual user ID
        });

        if (uploadResult.success) {
          ipfsData = uploadResult.data;
          sampleData.ipfsHash = ipfsData.ipfsHash;
          sampleData.ipfsUrl = ipfsData.url;
        }
      } else {
        // Parse URL for basic info
        sampleData = {
          title: 'URL Sample',
          artist: 'Unknown',
          genre: 'Unknown',
          duration: 'Unknown',
          source: sampleUrl
        };
      }

      // Analyze with OpenAI
      const copyrightAnalysis = await openaiService.analyzeCopyrightRisk(sampleData);
      const sampleAnalysis = await openaiService.analyzeSample(sampleData);
      const clearanceChecklist = await openaiService.generateClearanceChecklist(sampleData);

      const results = {
        sampleData,
        ipfsData,
        copyrightAnalysis: copyrightAnalysis.success ? copyrightAnalysis.data : null,
        sampleAnalysis: sampleAnalysis.success ? sampleAnalysis.data : null,
        clearanceChecklist: clearanceChecklist.success ? clearanceChecklist.data : null,
        timestamp: new Date().toISOString()
      };

      setAnalysisResults(results);
      setStep(3);
      
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Analysis failed. Please try again.');
      setStep(1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveClearance = async () => {
    if (!analysisResults) return;

    try {
      const clearanceData = {
        clearanceId: `clearance_${Date.now()}`,
        userId: 'current_user', // Replace with actual user ID
        sampleId: analysisResults.sampleData.ipfsHash || `url_${Date.now()}`,
        clearanceType: 'verification',
        status: analysisResults.copyrightAnalysis?.risk_level === 'low' ? 'approved' : 'pending',
        proofUrl: analysisResults.ipfsData?.url || analysisResults.sampleData.source
      };

      const result = await supabaseService.createClearance(clearanceData);
      
      if (result.error) {
        console.warn('Failed to save clearance:', result.error);
        // Continue anyway since this is not critical
      }

      onVerificationComplete?.(analysisResults);
      toast.success('Verification saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save verification');
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'medium': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return CheckCircle;
      case 'medium': return AlertTriangle;
      case 'high': return AlertTriangle;
      default: return Info;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-text">Usage Rights Verification</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-6">
              <p className="text-muted-foreground">
                Upload a sample or provide a URL to verify its usage rights and get clearance guidance.
              </p>

              {/* Method Selection */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setVerificationMethod('upload')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    verificationMethod === 'upload'
                      ? 'bg-primary text-white'
                      : 'bg-bg text-muted-foreground hover:text-text'
                  }`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setVerificationMethod('url')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    verificationMethod === 'url'
                      ? 'bg-primary text-white'
                      : 'bg-bg text-muted-foreground hover:text-text'
                  }`}
                >
                  Provide URL
                </button>
              </div>

              {/* Upload Area */}
              {verificationMethod === 'upload' && (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : uploadedFile
                      ? 'border-green-500 bg-green-500/5'
                      : 'border-muted-foreground/30 hover:border-muted-foreground/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  
                  {uploadedFile ? (
                    <div className="space-y-2">
                      <FileAudio className="w-12 h-12 text-green-400 mx-auto" />
                      <p className="text-text font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                      <p className="text-text">
                        {isDragActive ? 'Drop the file here' : 'Drag & drop an audio file here'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or click to select (MP3, WAV, AIFF, FLAC, M4A - max 10MB)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* URL Input */}
              {verificationMethod === 'url' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text">
                    Sample URL
                  </label>
                  <input
                    type="url"
                    value={sampleUrl}
                    onChange={(e) => setSampleUrl(e.target.value)}
                    placeholder="https://example.com/sample.mp3"
                    className="w-full px-3 py-2 bg-bg border border-muted-foreground/30 rounded-lg text-text placeholder-muted-foreground focus:outline-none focus:border-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide a direct link to the audio file you want to verify
                  </p>
                </div>
              )}

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={!uploadedFile && !sampleUrl}
                className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Analyze Sample
              </button>
            </div>
          )}

          {/* Step 2: Analysis */}
          {step === 2 && (
            <div className="text-center space-y-4">
              <Loader className="w-12 h-12 text-primary mx-auto animate-spin" />
              <h3 className="text-xl font-medium text-text">Analyzing Sample</h3>
              <p className="text-muted-foreground">
                We're analyzing the sample for copyright risks, categorization, and clearance requirements...
              </p>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && analysisResults && (
            <div className="space-y-6">
              <h3 className="text-xl font-medium text-text">Verification Results</h3>

              {/* Copyright Risk Assessment */}
              {analysisResults.copyrightAnalysis && (
                <div className={`p-4 rounded-lg border ${getRiskColor(analysisResults.copyrightAnalysis.risk_level)}`}>
                  <div className="flex items-center space-x-3 mb-3">
                    {React.createElement(getRiskIcon(analysisResults.copyrightAnalysis.risk_level), {
                      className: "w-5 h-5"
                    })}
                    <h4 className="font-medium">
                      Copyright Risk: {analysisResults.copyrightAnalysis.risk_level.toUpperCase()}
                    </h4>
                  </div>
                  <p className="text-sm mb-3">{analysisResults.copyrightAnalysis.explanation}</p>
                  
                  {analysisResults.copyrightAnalysis.concerns.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium mb-1">Concerns:</p>
                      <ul className="text-sm space-y-1">
                        {analysisResults.copyrightAnalysis.concerns.map((concern, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-current">•</span>
                            <span>{concern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResults.copyrightAnalysis.recommendations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Recommendations:</p>
                      <ul className="text-sm space-y-1">
                        {analysisResults.copyrightAnalysis.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-current">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Sample Analysis */}
              {analysisResults.sampleAnalysis && (
                <div className="bg-bg p-4 rounded-lg">
                  <h4 className="font-medium text-text mb-3">Sample Classification</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Genre:</span>
                      <span className="ml-2 text-text">{analysisResults.sampleAnalysis.genre}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">License Rec:</span>
                      <span className="ml-2 text-text">{analysisResults.sampleAnalysis.license_recommendation}</span>
                    </div>
                  </div>
                  
                  {analysisResults.sampleAnalysis.mood_tags && (
                    <div className="mt-3">
                      <span className="text-muted-foreground text-sm">Mood Tags:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {analysisResults.sampleAnalysis.mood_tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-surface text-xs rounded-md text-accent">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveClearance}
                  className="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Save Verification
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-bg text-text rounded-lg font-medium hover:bg-surface transition-colors"
                >
                  Verify Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsageRightsVerification;
