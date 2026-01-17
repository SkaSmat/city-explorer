// ============================================================
// EDGE FUNCTION: Strava Token Refresh
// Renouvelle automatiquement les tokens expirés
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StravaRefreshResponse {
  token_type: string
  access_token: string
  expires_at: number
  expires_in: number
  refresh_token: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // Get current Strava connection
    const { data: connection, error: connError } = await supabase
      .from('strava_connections')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (connError || !connection) {
      throw new Error('No Strava connection found')
    }

    // Check if token needs refresh (expires in less than 1 hour)
    const expiresAt = new Date(connection.expires_at).getTime()
    const now = Date.now()
    const oneHour = 60 * 60 * 1000

    if (expiresAt - now > oneHour) {
      // Token still valid, return existing
      return new Response(
        JSON.stringify({
          access_token: connection.access_token,
          expires_at: connection.expires_at,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Token expired or expiring soon, refresh it
    const clientId = Deno.env.get('STRAVA_CLIENT_ID')
    const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      throw new Error('Strava credentials not configured')
    }

    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: connection.refresh_token,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Strava API error: ${error}`)
    }

    const data: StravaRefreshResponse = await response.json()

    // Update connection in database
    const { error: updateError } = await supabase
      .from('strava_connections')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(data.expires_at * 1000).toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      throw updateError
    }

    // Return new token
    return new Response(
      JSON.stringify({
        access_token: data.access_token,
        expires_at: new Date(data.expires_at * 1000).toISOString(),
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
