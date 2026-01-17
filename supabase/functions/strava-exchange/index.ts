// ============================================================
// EDGE FUNCTION: Strava Token Exchange
// Sécurise le client secret côté serveur
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StravaTokenResponse {
  token_type: string
  expires_at: number
  expires_in: number
  refresh_token: string
  access_token: string
  athlete: {
    id: number
    username: string
    firstname: string
    lastname: string
    profile: string
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get code from request
    const { code } = await req.json()

    if (!code) {
      throw new Error('Missing authorization code')
    }

    // Get Strava credentials from environment (SECURE!)
    const clientId = Deno.env.get('STRAVA_CLIENT_ID')
    const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      throw new Error('Strava credentials not configured')
    }

    // Exchange code for token with Strava
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Strava API error: ${error}`)
    }

    const data: StravaTokenResponse = await response.json()

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Invalid auth token')
    }

    // Store connection in database
    const { error: dbError } = await supabase
      .from('strava_connections')
      .upsert({
        user_id: user.id,
        strava_athlete_id: data.athlete.id,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(data.expires_at * 1000).toISOString(),
        athlete_data: data.athlete,
      }, {
        onConflict: 'user_id'
      })

    if (dbError) {
      throw dbError
    }

    // Return success (WITHOUT exposing tokens)
    return new Response(
      JSON.stringify({
        success: true,
        athlete: {
          id: data.athlete.id,
          username: data.athlete.username,
          firstname: data.athlete.firstname,
          lastname: data.athlete.lastname,
          profile: data.athlete.profile,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error: unknown) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
