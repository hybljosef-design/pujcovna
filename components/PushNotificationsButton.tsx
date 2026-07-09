'use client'

import { useState } from 'react'

import {
  BellRing,
  CheckCircle,
  Loader2
} from 'lucide-react'

import { supabase } from '../lib/supabase'

function urlBase64ToUint8Array(
  base64String: string
) {
  const padding =
    '='.repeat(
      (4 - base64String.length % 4) % 4
    )

  const base64 =
    (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

  const rawData =
    window.atob(base64)

  const outputArray =
    new Uint8Array(rawData.length)

  for (
    let i = 0;
    i < rawData.length;
    ++i
  ) {
    outputArray[i] =
      rawData.charCodeAt(i)
  }

  return outputArray
}

export default function PushNotificationsButton() {
  const [loading, setLoading] =
    useState(false)

  const [enabled, setEnabled] =
    useState(false)

  async function enableNotifications() {
    try {
      setLoading(true)

      if (
        typeof window === 'undefined' ||
        !('serviceWorker' in navigator) ||
        !('PushManager' in window) ||
        !('Notification' in window)
      ) {
        alert(
          'Toto zařízení nebo prohlížeč nepodporuje push oznámení.'
        )

        setLoading(false)

        return
      }

      const publicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!publicKey) {
        alert(
          'Chybí NEXT_PUBLIC_VAPID_PUBLIC_KEY v nastavení aplikace.'
        )

        setLoading(false)

        return
      }

      const permission =
        await Notification.requestPermission()

      if (permission !== 'granted') {
        alert(
          'Oznámení nebyla povolena.'
        )

        setLoading(false)

        return
      }

      const registration =
        await navigator.serviceWorker.register(
          '/sw.js'
        )

      const existingSubscription =
        await registration.pushManager.getSubscription()

      const subscription =
        existingSubscription ||
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey:
            urlBase64ToUint8Array(publicKey)
        })

      const {
        data: { user }
      } = await supabase.auth.getUser()

      const response =
        await fetch(
          '/api/push/subscribe',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId: user?.id || null,
              subscription
            })
          }
        )

      if (!response.ok) {
        throw new Error(
          'Nepodařilo se uložit zařízení pro oznámení.'
        )
      }

      setEnabled(true)

      alert(
        'Oznámení jsou na tomto zařízení povolena.'
      )
    } catch (error) {
      console.log(error)

      alert(
        'Oznámení se nepodařilo zapnout.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={enableNotifications}
      disabled={loading || enabled}
      className={`
        rounded-2xl
        px-5
        py-3
        font-semibold
        flex
        items-center
        justify-center
        gap-2
        transition

        ${enabled
          ? 'bg-green-100 text-green-700'
          : 'bg-orange-100 hover:bg-orange-200 text-orange-700'}
      `}
    >
      {loading && (
        <Loader2
          size={18}
          className="animate-spin"
        />
      )}

      {!loading && enabled && (
        <CheckCircle size={18} />
      )}

      {!loading && !enabled && (
        <BellRing size={18} />
      )}

      {enabled
        ? 'Oznámení povolena'
        : loading
          ? 'Zapínám oznámení...'
          : 'Povolit oznámení'}
    </button>
  )
}
