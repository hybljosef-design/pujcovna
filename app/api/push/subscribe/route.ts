import { NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL!

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase =
  createClient(
    supabaseUrl,
    supabaseKey
  )

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json()

    const userId =
      body.userId || null

    const subscription =
      body.subscription

    if (
      !subscription ||
      !subscription.endpoint
    ) {
      return NextResponse.json(
        {
          error: 'Neplatná data oznámení'
        },
        {
          status: 400
        }
      )
    }

    const { error } =
      await supabase
        .from('push_subscriptions')
        .upsert(
          {
            user_id: userId,
            endpoint: subscription.endpoint,
            subscription
          },
          {
            onConflict: 'endpoint'
          }
        )

    if (error) {
      console.log(error)

      return NextResponse.json(
        {
          error: error.message
        },
        {
          status: 500
        }
      )
    }

    return NextResponse.json({
      ok: true
    })
  } catch (error) {
    console.log(error)

    return NextResponse.json(
      {
        error: 'Chyba při ukládání oznámení'
      },
      {
        status: 500
      }
    )
  }
}
