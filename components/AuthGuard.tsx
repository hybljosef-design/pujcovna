'use client'

import {
  useEffect,
  useState,
  ReactNode
} from 'react'

import { useRouter } from 'next/navigation'

import { supabase } from '../lib/supabase'

type Props = {
  children: ReactNode
}

export default function AuthGuard({
  children
}: Props) {

  const router = useRouter()

  const [loading, setLoading] = useState(true)

  const [authorized, setAuthorized] =
    useState(false)

  useEffect(() => {

    checkUser()

  }, [])

  async function checkUser() {

    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (!session) {

      router.push('/login')

      return
    }

    setAuthorized(true)

    setLoading(false)
  }

  if (loading) {

    return (

      <main className="min-h-screen bg-gray-100 flex items-center justify-center">

        <div className="bg-white rounded-3xl shadow-lg p-10">

          <h1 className="text-3xl font-bold">
            Ověřuji přihlášení...
          </h1>

        </div>

      </main>
    )
  }

  if (!authorized) return null

  return <>{children}</>
}