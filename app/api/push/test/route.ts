import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { createECDH } from 'node:crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || ''

const vapidPublicKey =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || ''

const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY?.trim() || ''

const supabase =
  createClient(
    supabaseUrl,
    supabaseKey
  )

function base64UrlToBuffer(value: string) {
  const normalized =
    value
      .replace(/-/g, '+')
      .replace(/_/g, '/')

  const padding =
    '='.repeat(
      (4 - normalized.length % 4) % 4
    )

  return Buffer.from(
    normalized + padding,
    'base64'
  )
}

function bufferToBase64Url(value: Buffer) {
  return value
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function derivePublicKeyFromPrivateKey(
  privateKey: string
) {
  const ecdh =
    createECDH('prime256v1')

  ecdh.setPrivateKey(
    base64UrlToBuffer(privateKey)
  )

  return bufferToBase64Url(
    ecdh.getPublicKey()
  )
}

type PushSubscriptionRow = {
  id: string
  endpoint: string
  subscription: webpush.PushSubscription
}

async function sendTestNotification() {
  if (
    !supabaseUrl ||
    !supabaseKey ||
    !vapidPublicKey ||
    !vapidPrivateKey
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Chybí některá proměnná prostředí.',
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasSupabaseKey: Boolean(supabaseKey),
        hasVapidPublicKey: Boolean(vapidPublicKey),
        hasVapidPrivateKey: Boolean(vapidPrivateKey)
      },
      {
        status: 500
      }
    )
  }

  let derivedPublicKey = ''

  try {
    derivedPublicKey =
      derivePublicKeyFromPrivateKey(
        vapidPrivateKey
      )
  } catch (error) {
    console.log('VAPID PRIVATE KEY ERROR:')
    console.log(error)

    return NextResponse.json(
      {
        ok: false,
        error: 'Soukromý VAPID klíč není platný.'
      },
      {
        status: 500
      }
    )
  }

  const keysMatch =
    derivedPublicKey === vapidPublicKey

  if (!keysMatch) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Veřejný a soukromý VAPID klíč netvoří jeden pár.',
        keysMatch: false
      },
      {
        status: 500
      }
    )
  }

  webpush.setVapidDetails(
    'https://pujcovna-five.vercel.app',
    vapidPublicKey,
    vapidPrivateKey
  )

  const { data, error } =
    await supabase
      .from('push_subscriptions')
      .select('id, endpoint, subscription')

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        keysMatch
      },
      {
        status: 500
      }
    )
  }

  const subscriptions =
    (data || []) as PushSubscriptionRow[]

  if (subscriptions.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Není uložené žádné zařízení pro oznámení.',
        keysMatch
      },
      {
        status: 404
      }
    )
  }

  const payload =
    JSON.stringify({
      title: 'Test oznámení',
      body: 'Push oznámení z půjčovny funguje.',
      url: '/reservations'
    })

  const results =
    await Promise.allSettled(
      subscriptions.map(async (item) => {
        try {
          await webpush.sendNotification(
            item.subscription,
            payload,
            {
              TTL: 60,
              urgency: 'high'
            }
          )

          return {
            id: item.id,
            ok: true
          }
        } catch (error: any) {
          if (
            error?.statusCode === 404 ||
            error?.statusCode === 410
          ) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', item.id)
          }

          return {
            id: item.id,
            ok: false,
            statusCode: error?.statusCode || null,
            message:
              error?.message || 'Neznámá chyba',
            body: error?.body || null
          }
        }
      })
    )

  const sent =
    results.filter(
      result =>
        result.status === 'fulfilled' &&
        result.value.ok
    ).length

  const errors =
    results
      .filter(
        result =>
          result.status === 'fulfilled' &&
          !result.value.ok
      )
      .map(result =>
        result.status === 'fulfilled'
          ? result.value
          : null
      )

  return NextResponse.json(
    {
      ok: sent > 0,
      keysMatch,
      devices: subscriptions.length,
      sent,
      errors
    },
    {
      headers: {
        'Cache-Control': 'no-store'
      }
    }
  )
}

export async function GET() {
  return sendTestNotification()
}

export async function POST() {
  return sendTestNotification()
}
