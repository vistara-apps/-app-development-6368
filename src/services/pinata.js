import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
  console.warn('Pinata configuration missing. File uploads will be disabled.');
}

const pinataApi = axios.create({
  baseURL: 'https://api.pinata.cloud',
  headers: {
    'pinata_api_key': PINATA_API_KEY,
    'pinata_secret_api_key': PINATA_SECRET_KEY,
    ...(PINATA_JWT && { 'Authorization': `Bearer ${PINATA_JWT}` })
  }
});

export const pinataService = {
  // Upload file to IPFS
  async uploadFile(file, metadata = {}) {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      return { success: false, error: 'Pinata not configured' };
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const pinataMetadata = JSON.stringify({
        name: metadata.name || file.name,
        keyvalues: {
          type: metadata.type || 'sample',
          uploadedBy: metadata.userId || 'anonymous',
          ...metadata.customData
        }
      });
      
      const pinataOptions = JSON.stringify({
        cidVersion: 0,
        customPinPolicy: {
          regions: [
            {
              id: 'FRA1',
              desiredReplicationCount: 1
            },
            {
              id: 'NYC1', 
              desiredReplicationCount: 1
            }
          ]
        }
      });

      formData.append('pinataMetadata', pinataMetadata);
      formData.append('pinataOptions', pinataOptions);

      const response = await pinataApi.post('/pinning/pinFileToIPFS', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        success: true,
        data: {
          ipfsHash: response.data.IpfsHash,
          pinSize: response.data.PinSize,
          timestamp: response.data.Timestamp,
          url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
        }
      };
    } catch (error) {
      console.error('Pinata upload error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  // Upload JSON metadata to IPFS
  async uploadJSON(jsonData, metadata = {}) {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      return { success: false, error: 'Pinata not configured' };
    }

    try {
      const pinataMetadata = {
        name: metadata.name || 'metadata.json',
        keyvalues: {
          type: metadata.type || 'metadata',
          uploadedBy: metadata.userId || 'anonymous',
          ...metadata.customData
        }
      };

      const pinataOptions = {
        cidVersion: 0,
        customPinPolicy: {
          regions: [
            {
              id: 'FRA1',
              desiredReplicationCount: 1
            },
            {
              id: 'NYC1',
              desiredReplicationCount: 1
            }
          ]
        }
      };

      const response = await pinataApi.post('/pinning/pinJSONToIPFS', {
        pinataContent: jsonData,
        pinataMetadata,
        pinataOptions
      });

      return {
        success: true,
        data: {
          ipfsHash: response.data.IpfsHash,
          pinSize: response.data.PinSize,
          timestamp: response.data.Timestamp,
          url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
        }
      };
    } catch (error) {
      console.error('Pinata JSON upload error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  // Get pinned files list
  async getPinnedFiles(filters = {}) {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      return { success: false, error: 'Pinata not configured' };
    }

    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.pageLimit) params.append('pageLimit', filters.pageLimit);
      if (filters.pageOffset) params.append('pageOffset', filters.pageOffset);
      if (filters.metadata) {
        Object.entries(filters.metadata).forEach(([key, value]) => {
          params.append(`metadata[keyvalues][${key}]`, value);
        });
      }

      const response = await pinataApi.get(`/data/pinList?${params.toString()}`);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Pinata list error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  // Unpin file from IPFS
  async unpinFile(ipfsHash) {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      return { success: false, error: 'Pinata not configured' };
    }

    try {
      await pinataApi.delete(`/pinning/unpin/${ipfsHash}`);
      
      return {
        success: true,
        message: 'File unpinned successfully'
      };
    } catch (error) {
      console.error('Pinata unpin error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  // Test Pinata connection
  async testConnection() {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      return { success: false, error: 'Pinata not configured' };
    }

    try {
      const response = await pinataApi.get('/data/testAuthentication');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Pinata connection test error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  // Generate IPFS gateway URL
  getGatewayUrl(ipfsHash, gateway = 'https://gateway.pinata.cloud') {
    return `${gateway}/ipfs/${ipfsHash}`;
  },

  // Upload sample with metadata
  async uploadSampleWithMetadata(audioFile, metadata) {
    try {
      // Upload the audio file
      const audioUpload = await this.uploadFile(audioFile, {
        name: `${metadata.title}_audio`,
        type: 'sample_audio',
        userId: metadata.userId,
        customData: {
          sampleId: metadata.sampleId,
          title: metadata.title,
          artist: metadata.artist
        }
      });

      if (!audioUpload.success) {
        return audioUpload;
      }

      // Upload metadata JSON
      const metadataUpload = await this.uploadJSON({
        sampleId: metadata.sampleId,
        title: metadata.title,
        artist: metadata.artist,
        genre: metadata.genre,
        licenseType: metadata.licenseType,
        duration: metadata.duration,
        bpm: metadata.bpm,
        key: metadata.key,
        tags: metadata.tags,
        audioIpfsHash: audioUpload.data.ipfsHash,
        audioUrl: audioUpload.data.url,
        uploadedAt: new Date().toISOString(),
        uploadedBy: metadata.userId
      }, {
        name: `${metadata.title}_metadata`,
        type: 'sample_metadata',
        userId: metadata.userId,
        customData: {
          sampleId: metadata.sampleId
        }
      });

      if (!metadataUpload.success) {
        // If metadata upload fails, unpin the audio file
        await this.unpinFile(audioUpload.data.ipfsHash);
        return metadataUpload;
      }

      return {
        success: true,
        data: {
          audioHash: audioUpload.data.ipfsHash,
          audioUrl: audioUpload.data.url,
          metadataHash: metadataUpload.data.ipfsHash,
          metadataUrl: metadataUpload.data.url
        }
      };
    } catch (error) {
      console.error('Sample upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};
