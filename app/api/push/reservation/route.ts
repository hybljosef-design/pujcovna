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

function base64UrlToBuffer(
  value: string
) {
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

function bufferToBase64Url(
  value: Buffer
) {
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(
    'cs-CZ'
  )
}

type PushSubscriptionRow = {
  id: string
  subscription: webpush.PushSubscription
}

type ReservationPushPayload = {
  machineName?: string
  customerName?: string
  phone?: string
  startDate?: string
  endDate?: string
}

export async function POST(
  request: Request
) {
  try {
    if (
      !supabaseUrl ||
      !supabaseKey ||
      !vapidPublicKey ||
      !vapidPrivateKey
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Chybí nastavení push oznámení.'
        },
        {
          status: 500
        }
      )
    }

    const derivedPublicKey =
      derivePublicKeyFromPrivateKey(
        vapidPrivateKey
      )

    if (
      derivedPublicKey !== vapidPublicKey
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Veřejný a soukromý VAPID klíč netvoří jeden pár.'
        },
        {
          status: 500
        }
      )
    }

    const body =
      await request.json() as ReservationPushPayload

    webpush.setVapidDetails(
      'https://pujcovna-five.vercel.app',
      vapidPublicKey,
      vapidPrivateKey
    )

    const { data, error } =
      await supabase
        .from('push_subscriptions')
        .select('id, subscription')

    if (error) {
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

    if (
      subscriptions.length === 0
    ) {
      return NextResponse.json({
        ok: true,
        devices: 0,
        sent: 0
      })
    }

    const machineName =
      body.machineName?.trim() ||
      'Neuvedený stroj'

    const customerName =
      body.customerName?.trim() ||
      'Neuvedený zákazník'

    const phone =
      body.phone?.trim() || ''

    const startDate =
      body.startDate
        ? formatDate(body.startDate)
        : '-'

    const endDate =
      body.endDate
        ? formatDate(body.endDate)
        : '-'

    const payload =
      JSON.stringify({
        title: 'Nová online rezervace',
        body:
          `${machineName} • ${customerName} • ${startDate}–${endDate}`,
        url: '/reservations',
        tag: 'online-reservation',
        data: {
          machineName,
          customerName,
          phone,
          startDate,
          endDate
        }
      })

    const results =
      await Promise.allSettled(
        subscriptions.map(
          async (item) => {
            try {
              await webpush.sendNotification(
                item.subscription,
                payload,
                {
                  TTL: 300,
                  urgency: 'high'
                }
              )

              return {
                id: item.id,
                ok: true
              }
            } catch (pushError: any) {
              console.log(pushError)

              if (
                pushError?.statusCode === 404 ||
                pushError?.statusCode === 410
              ) {
                await supabase
                  .from('push_subscriptions')
                  .delete()
                  .eq('id', item.id)
              }

              return {
                id: item.id,
                ok: false,
                statusCode:
                  pushError?.statusCode || null
              }
            }
          }
        )
      )

    const sent =
      results.filter(
        result =>
          result.status === 'fulfilled' &&
          result.value.ok
      ).length

    return NextResponse.json({
      ok: true,
      devices: subscriptions.length,
      sent
    })
  } catch (error) {
    console.log(error)

    return NextResponse.json(
      {
        ok: false,
        error:
          'Push oznámení se nepodařilo odeslat.'
      },
      {
        status: 500
      }
    )
  }
}
