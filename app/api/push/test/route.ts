import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL!

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const vapidPublicKey =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY!

const supabase =
  createClient(
    supabaseUrl,
    supabaseKey
  )

webpush.setVapidDetails(
  'mailto:hybljosef@seznam.cz',
  vapidPublicKey,
  vapidPrivateKey
)

type PushSubscriptionRow = {
  id: string
  endpoint: string
  subscription: webpush.PushSubscription
}

async function sendTestNotification() {
  const { data, error } =
    await supabase
      .from('push_subscriptions')
      .select('id, endpoint, subscription')

  if (error) {
    console.log('SUPABASE ERROR:')
    console.log(error)

    return NextResponse.json(
      {
        ok: false,
        error: error.message
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
        error: 'Není uložené žádné zařízení pro oznámení.'
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
            payload
          )

          return {
            id: item.id,
            ok: true
          }
        } catch (error: any) {
          console.log('PUSH ERROR:')
          console.log(error)
          console.log('PUSH ERROR BODY:')
          console.log(error?.body)
          console.log('PUSH STATUS CODE:')
          console.log(error?.statusCode)

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
            message: error?.message || 'Neznámá chyba',
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

  return NextResponse.json({
    ok: true,
    devices: subscriptions.length,
    sent,
    errors
  })
}

export async function GET() {
  return sendTestNotification()
}

export async function POST() {
  return sendTestNotification()
}
