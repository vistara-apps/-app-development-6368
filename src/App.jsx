import React, { useState, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import AppShell from './components/AppShell';
import SearchInput from './components/SearchInput';
import SampleCard from './components/SampleCard';
import FilterPanel from './components/FilterPanel';
import SampleDetail from './components/SampleDetail';
import UsageRightsVerification from './components/UsageRightsVerification';
import SampleUsageWizard from './components/SampleUsageWizard';
import { mockSamples } from './data/mockSamples';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLicense, setSelectedLicense] = useState('All');
  const [priceRange, setPriceRange] = useState('50');
  const [onlyCleared, setOnlyCleared] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSample, setSelectedSample] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardSample, setWizardSample] = useState(null);

  const filteredSamples = useMemo(() => {
    return mockSamples.filter(sample => {
      const matchesSearch = sample.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           sample.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           sample.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesGenre = selectedGenre === 'All' || sample.genre === selectedGenre;
      const matchesLicense = selectedLicense === 'All' || sample.licenseType === selectedLicense;
      const matchesPrice = sample.price <= parseInt(priceRange);
      const matchesCleared = !onlyCleared || sample.cleared;

      return matchesSearch && matchesGenre && matchesLicense && matchesPrice && matchesCleared;
    });
  }, [searchQuery, selectedGenre, selectedLicense, priceRange, onlyCleared]);

  const handleOpenWizard = (sample) => {
    setWizardSample(sample);
    setShowWizard(true);
  };

  const handleVerificationComplete = (results) => {
    console.log('Verification completed:', results);
    setShowVerification(false);
  };

  const handleWizardComplete = (data) => {
    console.log('Wizard completed:', data);
    setShowWizard(false);
    setWizardSample(null);
  };

  if (selectedSample) {
    return (
      <AppShell>
        <SampleDetail 
          sample={selectedSample} 
          onBack={() => setSelectedSample(null)}
          onOpenWizard={() => handleOpenWizard(selectedSample)}
        />
      </AppShell>
    );
  }

  return (
    <>
      <AppShell>
        <div className="space-y-6">
        <section className="text-center py-8">
          <h1 className="text-3xl font-bold text-text mb-2">SampleSecure</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Legally clear music samples for your remixes, instantly.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="card text-center">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-accent font-bold">1</span>
              </div>
              <h3 className="font-medium text-text mb-1">Search & Discover</h3>
              <p className="text-muted-foreground">Find samples by genre, mood, or instrument</p>
            </div>
            <div className="card text-center">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-accent font-bold">2</span>
              </div>
              <h3 className="font-medium text-text mb-1">Verify Clearance</h3>
              <p className="text-muted-foreground">Check legal status and usage rights</p>
            </div>
            <div className="card text-center">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-accent font-bold">3</span>
              </div>
              <h3 className="font-medium text-text mb-1">Create Safely</h3>
              <p className="text-muted-foreground">Use samples with confidence</p>
            </div>
          </div>
        </section>

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onFilterClick={() => setShowFilters(true)}
          placeholder="Search samples by title, artist, or tags..."
        />

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text">
            Sample Library
            <span className="text-sm text-muted-foreground ml-2">
              ({filteredSamples.length} samples)
            </span>
          </h2>
          <button
            onClick={() => setShowVerification(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            Verify Sample Rights
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredSamples.map((sample) => (
            <SampleCard
              key={sample.sampleId}
              sample={sample}
              onSampleSelect={setSelectedSample}
              onOpenWizard={() => handleOpenWizard(sample)}
            />
          ))}
        </div>

        {filteredSamples.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-muted-foreground">🎵</span>
            </div>
            <h3 className="text-lg font-medium text-text mb-2">No samples found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>

      <FilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        selectedGenre={selectedGenre}
        setSelectedGenre={setSelectedGenre}
        selectedLicense={selectedLicense}
        setSelectedLicense={setSelectedLicense}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        onlyCleared={onlyCleared}
        setOnlyCleared={setOnlyCleared}
      />
      </AppShell>

      {/* Modals */}
      {showVerification && (
        <UsageRightsVerification
          onClose={() => setShowVerification(false)}
          onVerificationComplete={handleVerificationComplete}
        />
      )}

      {showWizard && wizardSample && (
        <SampleUsageWizard
          sample={wizardSample}
          onClose={() => {
            setShowWizard(false);
            setWizardSample(null);
          }}
          onComplete={handleWizardComplete}
        />
      )}

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(220 15% 15%)',
            color: 'hsl(220 10% 90%)',
            border: '1px solid hsl(220 15% 25%)',
          },
        }}
      />
    </>
  );
}

export default App;
