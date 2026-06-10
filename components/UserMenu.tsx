'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { supabase } from '../lib/supabase'

import {
  LogOut,
  Shield,
  User
} from 'lucide-react'

export default function UserMenu() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState('employee')

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) return

    setEmail(user.email || '')

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (data?.role) {
      setRole(data.role)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg p-4">

      <div className="flex items-center gap-3 mb-4">

        <div className="bg-black text-white p-3 rounded-2xl">
          <User size={22} />
        </div>

        <div className="min-w-0">

          <p className="font-bold text-sm truncate">
            {email}
          </p>

          <div className="flex items-center gap-2 text-xs text-gray-500">

            <Shield size={13} />

            {role === 'admin'
              ? 'ADMIN'
              : 'ZAMĚSTNANEC'}

          </div>

        </div>

      </div>

      <button
        onClick={handleLogout}
        className="
          w-full
          bg-red-100
          hover:bg-red-200
          transition
          text-red-700
          px-4
          py-3
          rounded-2xl
          flex
          items-center
          justify-center
          gap-2
          font-semibold
        "
      >

        <LogOut size={18} />

        Odhlásit

      </button>

    </div>
  )
}