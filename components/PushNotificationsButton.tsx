'use client'

import {
  useEffect,
  useState
} from 'react'

import {
  BellRing,
  CheckCircle,
  Loader2,
  X
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
    useState(true)

  const [showPrompt, setShowPrompt] =
    useState(false)

  const [enabled, setEnabled] =
    useState(false)

  useEffect(() => {
    initializeNotifications()
  }, [])

  async function initializeNotifications() {
    try {
      if (
        typeof window === 'undefined' ||
        !('serviceWorker' in navigator) ||
        !('PushManager' in window) ||
        !('Notification' in window)
      ) {
        setLoading(false)
        return
      }

      const registration =
        await navigator.serviceWorker.register(
          '/sw.js'
        )

      const existingSubscription =
        await registration.pushManager.getSubscription()

      if (existingSubscription) {
        await saveSubscription(
          existingSubscription
        )

        setEnabled(true)
        setShowPrompt(false)
        setLoading(false)
        return
      }

      if (
        Notification.permission === 'granted'
      ) {
        const subscription =
          await createSubscription(
            registration
          )

        await saveSubscription(
          subscription
        )

        setEnabled(true)
        setShowPrompt(false)
        setLoading(false)
        return
      }

      if (
        Notification.permission === 'default'
      ) {
        const dismissed =
          window.localStorage.getItem(
            'push-notifications-dismissed'
          )

        if (!dismissed) {
          setShowPrompt(true)
        }
      }

      setLoading(false)
    } catch (error) {
      console.log(error)
      setLoading(false)
    }
  }

  async function createSubscription(
    registration: ServiceWorkerRegistration
  ) {
    const publicKey =
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

    if (!publicKey) {
      throw new Error(
        'Chybí NEXT_PUBLIC_VAPID_PUBLIC_KEY.'
      )
    }

    return registration
      .pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          urlBase64ToUint8Array(
            publicKey
          )
      })
  }

  async function saveSubscription(
    subscription: PushSubscription
  ) {
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
  }

  async function enableNotifications() {
    try {
      setLoading(true)

      const permission =
        await Notification.requestPermission()

      if (
        permission !== 'granted'
      ) {
        setShowPrompt(false)
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
        await createSubscription(
          registration
        )

      await saveSubscription(
        subscription
      )

      window.localStorage.removeItem(
        'push-notifications-dismissed'
      )

      setEnabled(true)
      setShowPrompt(false)
    } catch (error) {
      console.log(error)

      alert(
        'Oznámení se nepodařilo zapnout.'
      )
    } finally {
      setLoading(false)
    }
  }

  function dismissPrompt() {
    window.localStorage.setItem(
      'push-notifications-dismissed',
      '1'
    )

    setShowPrompt(false)
  }

  if (
    enabled ||
    !showPrompt
  ) {
    return null
  }

  return (
    <div className="
      fixed
      inset-0
      z-[110]
      bg-black/50
      flex
      items-center
      justify-center
      p-4
    ">

      <div className="
        bg-white
        rounded-3xl
        shadow-2xl
        w-full
        max-w-lg
        overflow-hidden
      ">

        <div className="
          bg-orange-600
          text-white
          p-5
          flex
          items-center
          justify-between
          gap-4
        ">

          <div className="
            flex
            items-center
            gap-3
          ">

            <BellRing size={30} />

            <h2 className="
              text-2xl
              font-black
            ">
              Upozornění na rezervace
            </h2>

          </div>

          <button
            type="button"
            onClick={dismissPrompt}
            className="
              bg-white/20
              hover:bg-white/30
              rounded-2xl
              p-3
              transition
            "
          >
            <X size={22} />
          </button>

        </div>

        <div className="p-6">

          <p className="
            text-gray-600
            text-lg
            mb-6
          ">
            Chcete dostávat upozornění na nové online rezervace i při zavřené aplikaci?
          </p>

          <div className="
            grid
            sm:grid-cols-2
            gap-3
          ">

            <button
              type="button"
              onClick={enableNotifications}
              disabled={loading}
              className="
                bg-orange-600
                hover:bg-orange-700
                disabled:bg-orange-300
                transition
                text-white
                rounded-2xl
                p-4
                font-bold
                text-lg
                flex
                items-center
                justify-center
                gap-2
              "
            >

              {loading ? (
                <Loader2
                  size={20}
                  className="animate-spin"
                />
              ) : (
                <CheckCircle size={20} />
              )}

              {loading
                ? 'Zapínám...'
                : 'Povolit oznámení'}

            </button>

            <button
              type="button"
              onClick={dismissPrompt}
              className="
                bg-gray-100
                hover:bg-gray-200
                transition
                rounded-2xl
                p-4
                font-bold
                text-lg
              "
            >
              Později
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}
