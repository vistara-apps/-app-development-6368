import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing. Using mock data.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database service functions
export const supabaseService = {
  // User operations
  async createUser(userData) {
    if (!supabase) return { data: null, error: 'Supabase not configured' };
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        user_id: userData.userId,
        wallet_address: userData.walletAddress,
        email: userData.email,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    return { data, error };
  },

  async getUser(userId) {
    if (!supabase) return { data: null, error: 'Supabase not configured' };
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return { data, error };
  },

  async updateUser(userId, updates) {
    if (!supabase) return { data: null, error: 'Supabase not configured' };
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    return { data, error };
  },

  // Sample operations
  async getSamples(filters = {}) {
    if (!supabase) return { data: [], error: 'Supabase not configured' };
    
    let query = supabase.from('samples').select('*');
    
    if (filters.genre && filters.genre !== 'All') {
      query = query.eq('genre', filters.genre);
    }
    
    if (filters.licenseType && filters.licenseType !== 'All') {
      query = query.eq('license_type', filters.licenseType);
    }
    
    if (filters.cleared !== undefined) {
      query = query.eq('cleared', filters.cleared);
    }
    
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,artist.ilike.%${filters.search}%`);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    return { data, error };
  },

  async getSample(sampleId) {
    if (!supabase) return { data: null, error: 'Supabase not configured' };
    
    const { data, error } = await supabase
      .from('samples')
      .select('*')
      .eq('sample_id', sampleId)
      .single();
    
    return { data, error };
  },

  async createSample(sampleData) {
    if (!supabase) return { data: null, error: 'Supabase not configured' };
    
    const { data, error } = await supabase
      .from('samples')
      .insert([{
        sample_id: sampleData.sampleId,
        title: sampleData.title,
        artist: sampleData.artist,
        genre: sampleData.genre,
        license_type: sampleData.licenseType,
        cleared: sampleData.cleared,
        storage_url: sampleData.storageUrl,
        metadata: sampleData.metadata,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    return { data, error };
  },

  // Clearance operations
  async createClearance(clearanceData) {
    if (!supabase) return { data: null, error: 'Supabase not configured' };
    
    const { data, error } = await supabase
      .from('clearances')
      .insert([{
        clearance_id: clearanceData.clearanceId,
        user_id: clearanceData.userId,
        sample_id: clearanceData.sampleId,
        clearance_type: clearanceData.clearanceType,
        status: clearanceData.status,
        proof_url: clearanceData.proofUrl,
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();
    
    return { data, error };
  },

  async getUserClearances(userId) {
    if (!supabase) return { data: [], error: 'Supabase not configured' };
    
    const { data, error } = await supabase
      .from('clearances')
      .select(`
        *,
        samples (
          sample_id,
          title,
          artist,
          genre
        )
      `)
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
    
    return { data, error };
  },

  async updateClearanceStatus(clearanceId, status, proofUrl = null) {
    if (!supabase) return { data: null, error: 'Supabase not configured' };
    
    const updates = { status };
    if (proofUrl) updates.proof_url = proofUrl;
    
    const { data, error } = await supabase
      .from('clearances')
      .update(updates)
      .eq('clearance_id', clearanceId)
      .select()
      .single();
    
    return { data, error };
  },

  // User bookmarks
  async addBookmark(userId, sampleId) {
    if (!supabase) return { data: null, error: 'Supabase not configured' };
    
    const { data, error } = await supabase
      .from('user_bookmarks')
      .insert([{
        user_id: userId,
        sample_id: sampleId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    return { data, error };
  },

  async removeBookmark(userId, sampleId) {
    if (!supabase) return { data: null, error: 'Supabase not configured' };
    
    const { data, error } = await supabase
      .from('user_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('sample_id', sampleId);
    
    return { data, error };
  },

  async getUserBookmarks(userId) {
    if (!supabase) return { data: [], error: 'Supabase not configured' };
    
    const { data, error } = await supabase
      .from('user_bookmarks')
      .select(`
        *,
        samples (
          sample_id,
          title,
          artist,
          genre,
          license_type,
          cleared
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  }
};
