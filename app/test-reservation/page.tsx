'use client'

import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function TestReservationPage() {

  useEffect(() => {
    test()
  }, [])

  async function test() {

    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        customers (
          *
        ),
        machines (
          *
        )
      `)
      .limit(1)
      .single()

    console.log(
      JSON.stringify(
        data,
        null,
        2
      )
    )

    console.log(
      'ERROR:',
      error
    )
  }

  return (
    <main className="min-h-screen p-10">

      <h1 className="text-4xl font-bold">
        Test rezervace
      </h1>

      <p className="mt-4">
        Otevři konzoli F12
      </p>

    </main>
  )
}