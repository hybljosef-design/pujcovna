'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { supabase } from '../../lib/supabase'

import {
  LogIn,
  Mail,
  Lock
} from 'lucide-react'

export default function LoginPage() {

  const router = useRouter()

  const [email, setEmail] = useState('')

  const [password, setPassword] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  async function handleLogin() {

    if (!email || !password) {

      alert('Vyplňte email a heslo')

      return
    }

    setLoading(true)

    const { error } = await supabase.auth
      .signInWithPassword({
        email,
        password
      })

    if (error) {

      console.log(error)

      alert(error.message)

      setLoading(false)

      return
    }

    router.push('/')

    setLoading(false)
  }

  return (

    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">

      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-10">

        <div className="text-center mb-10">

          <div className="bg-black text-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">

            <LogIn size={36} />

          </div>

          <h1 className="text-4xl font-bold mb-3">
            Přihlášení
          </h1>

          <p className="text-gray-500">
            Profesionální systém půjčovny
          </p>

        </div>

        <div className="space-y-5">

          <div>

            <label className="block mb-2 font-semibold">
              Email
            </label>

            <div className="relative">

              <Mail
                size={20}
                className="absolute left-4 top-4 text-gray-400"
              />

              <input
                type="email"
                placeholder="admin@email.cz"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="w-full border rounded-2xl py-4 pl-12 pr-4"
              />

            </div>

          </div>

          <div>

            <label className="block mb-2 font-semibold">
              Heslo
            </label>

            <div className="relative">

              <Lock
                size={20}
                className="absolute left-4 top-4 text-gray-400"
              />

              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full border rounded-2xl py-4 pl-12 pr-4"
              />

            </div>

          </div>

        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full mt-8 bg-black hover:bg-gray-800 transition text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3"
        >

          <LogIn size={20} />

          {loading
            ? 'Přihlašuji...'
            : 'Přihlásit'}

        </button>

      </div>

    </main>
  )
}