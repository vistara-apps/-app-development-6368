import OpenAI from 'openai';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key missing. AI features will be disabled.');
}

const openai = OPENAI_API_KEY ? new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, this should be handled server-side
}) : null;

export const openaiService = {
  // Analyze sample metadata and suggest categorization
  async analyzeSample(sampleData) {
    if (!openai) {
      return { success: false, error: 'OpenAI not configured' };
    }

    try {
      const prompt = `
        Analyze this music sample and provide categorization suggestions:
        
        Title: ${sampleData.title}
        Artist: ${sampleData.artist}
        Duration: ${sampleData.duration || 'Unknown'}
        BPM: ${sampleData.bpm || 'Unknown'}
        Key: ${sampleData.key || 'Unknown'}
        Existing Tags: ${sampleData.tags?.join(', ') || 'None'}
        
        Please provide:
        1. Genre classification (choose from: Hip-Hop, Jazz, Electronic, Funk, Folk, R&B, Rock, Pop, Classical, World)
        2. Mood/vibe tags (3-5 descriptive words)
        3. Instrument tags (if identifiable)
        4. Usage suggestions (what type of productions this would work well in)
        5. License recommendation (royalty-free, paid, or contact-required based on complexity/commercial potential)
        
        Respond in JSON format:
        {
          "genre": "suggested genre",
          "mood_tags": ["tag1", "tag2", "tag3"],
          "instrument_tags": ["instrument1", "instrument2"],
          "usage_suggestions": ["suggestion1", "suggestion2"],
          "license_recommendation": "royalty-free|paid|contact-required",
          "confidence_score": 0.85
        }
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a music industry expert specializing in sample categorization and licensing. Provide accurate, helpful categorization for music samples.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        data: analysis
      };
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Generate license summary and usage guidelines
  async generateLicenseSummary(licenseType, sampleData) {
    if (!openai) {
      return { success: false, error: 'OpenAI not configured' };
    }

    try {
      const prompt = `
        Generate a clear, concise license summary for this music sample:
        
        Sample: "${sampleData.title}" by ${sampleData.artist}
        License Type: ${licenseType}
        Genre: ${sampleData.genre}
        
        Please provide:
        1. A brief explanation of what this license allows
        2. Any restrictions or requirements
        3. Commercial use permissions
        4. Attribution requirements (if any)
        5. Recommended next steps for the user
        
        Keep it under 200 words and make it easy to understand for remix artists.
        Use a friendly, helpful tone.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a legal expert specializing in music licensing. Explain complex licensing terms in simple, actionable language for musicians and producers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 300
      });

      return {
        success: true,
        data: {
          summary: response.choices[0].message.content.trim()
        }
      };
    } catch (error) {
      console.error('OpenAI license summary error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Generate clearance verification checklist
  async generateClearanceChecklist(sampleData) {
    if (!openai) {
      return { success: false, error: 'OpenAI not configured' };
    }

    try {
      const prompt = `
        Create a clearance verification checklist for this sample:
        
        Sample: "${sampleData.title}" by ${sampleData.artist}
        License Type: ${sampleData.licenseType}
        Genre: ${sampleData.genre}
        Current Clearance Status: ${sampleData.cleared ? 'Cleared' : 'Needs Verification'}
        
        Generate a step-by-step checklist that helps users verify they can legally use this sample.
        Include specific action items and what documentation they should look for.
        
        Format as a JSON array of checklist items:
        [
          {
            "step": 1,
            "title": "Check Title",
            "description": "Description of what to do",
            "required": true,
            "completed": false
          }
        ]
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a music clearance specialist. Create practical, actionable checklists that help artists navigate sample clearance legally and safely.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 600
      });

      const checklist = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        data: checklist
      };
    } catch (error) {
      console.error('OpenAI checklist error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Analyze uploaded sample for potential copyright issues
  async analyzeCopyrightRisk(sampleMetadata, audioAnalysis = null) {
    if (!openai) {
      return { success: false, error: 'OpenAI not configured' };
    }

    try {
      const prompt = `
        Analyze this sample for potential copyright concerns:
        
        Title: ${sampleMetadata.title}
        Artist: ${sampleMetadata.artist}
        Genre: ${sampleMetadata.genre}
        Duration: ${sampleMetadata.duration}
        Source: ${sampleMetadata.source || 'Unknown'}
        
        ${audioAnalysis ? `Audio Analysis: ${JSON.stringify(audioAnalysis)}` : ''}
        
        Assess the copyright risk level and provide guidance:
        1. Risk level (low, medium, high)
        2. Potential concerns
        3. Recommended actions
        4. Alternative suggestions if high risk
        
        Respond in JSON format:
        {
          "risk_level": "low|medium|high",
          "risk_score": 0.3,
          "concerns": ["concern1", "concern2"],
          "recommendations": ["action1", "action2"],
          "alternatives": ["alternative1", "alternative2"],
          "explanation": "Brief explanation of the assessment"
        }
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a copyright and music law expert. Provide conservative, legally-sound assessments of copyright risk for music samples.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        data: analysis
      };
    } catch (error) {
      console.error('OpenAI copyright analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Generate sample description and tags
  async generateSampleDescription(basicInfo) {
    if (!openai) {
      return { success: false, error: 'OpenAI not configured' };
    }

    try {
      const prompt = `
        Create an engaging description for this music sample:
        
        Title: ${basicInfo.title}
        Artist: ${basicInfo.artist}
        Genre: ${basicInfo.genre}
        BPM: ${basicInfo.bpm || 'Unknown'}
        Key: ${basicInfo.key || 'Unknown'}
        Duration: ${basicInfo.duration || 'Unknown'}
        
        Write a compelling 1-2 sentence description that would help producers understand what this sample offers.
        Also suggest 5-8 relevant tags.
        
        Respond in JSON format:
        {
          "description": "Engaging description here",
          "suggested_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
        }
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a music producer and sample library curator. Write descriptions that help other producers quickly understand the vibe and potential of samples.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('OpenAI description generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Test OpenAI connection
  async testConnection() {
    if (!openai) {
      return { success: false, error: 'OpenAI not configured' };
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Hello, this is a connection test. Please respond with "Connection successful".'
          }
        ],
        max_tokens: 10
      });

      return {
        success: true,
        data: {
          message: response.choices[0].message.content,
          model: response.model
        }
      };
    } catch (error) {
      console.error('OpenAI connection test error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};
