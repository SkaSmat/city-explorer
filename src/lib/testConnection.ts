import { supabaseGeo } from './supabaseGeo';

export async function testSupabaseConnection() {
  try {
    console.log('🧪 Testing Supabase external connection...');
    
    // Test 1: Query badges
    const { data: badges, error: badgesError } = await supabaseGeo
      .from('badges')
      .select('*')
      .limit(3);
    
    if (badgesError) {
      console.error('❌ Badges query failed:', badgesError);
      return false;
    }
    
    console.log('✅ Badges query successful:', badges);
    
    // Test 2: Query overpass_cache
    const { data: cache, error: cacheError } = await supabaseGeo
      .from('overpass_cache')
      .select('city')
      .limit(1);
    
    if (cacheError) {
      console.error('⚠️ Cache query failed (normal if empty):', cacheError);
    } else {
      console.log('✅ Cache query successful:', cache);
    }
    
    console.log('🎉 Connection to external Supabase OK!');
    return true;
    
  } catch (err) {
    console.error('❌ Connection test failed:', err);
    return false;
  }
}
