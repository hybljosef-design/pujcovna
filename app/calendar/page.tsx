'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { supabase } from '../../lib/supabase'

import {
  CalendarDays,
  AlertTriangle
} from 'lucide-react'

type Rental = {
  id: string
  start_date: string
  end_date: string
  returned: boolean

  customers: {
    first_name: string
    last_name: string
  }

  machines: {
    name: string
  }
}

export default function CalendarPage() {

  const [rentals, setRentals] = useState<Rental[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {

    loadRentals()

  }, [])

  async function loadRentals() {

    const { data, error } = await supabase
      .from('rentals')
      .select(`
        *,
        customers (
          first_name,
          last_name
        ),
        machines (
          name
        )
      `)
      .eq('returned', false)
      .order('start_date', {
        ascending: true
      })

    if (error) {

      console.log(error)

      alert('Chyba načítání kalendáře')

      setLoading(false)

      return
    }

    setRentals(data as Rental[])

    setLoading(false)
  }

  const sortedRentals = useMemo(() => {

    return rentals.sort((a, b) => {

      return (
        new Date(a.start_date).getTime() -
        new Date(b.start_date).getTime()
      )
    })

  }, [rentals])

  function isOverdue(endDate: string) {

    return new Date(endDate) < new Date()
  }

  if (loading) {

    return (

      <main className="min-h-screen bg-gray-100 p-10">

        <div className="max-w-7xl mx-auto">

          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border px-4 py-2 rounded-xl shadow-sm font-medium"
            >
              🏠 Domů
            </Link>
          </div>

          <div className="bg-white rounded-3xl p-10 shadow-lg">

            <h1 className="text-3xl font-bold">
              Načítám kalendář...
            </h1>

          </div>

        </div>

      </main>
    )
  }

  return (

    <main className="min-h-screen bg-gray-100 p-6 lg:p-10">

      <div className="max-w-7xl mx-auto">

        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border px-4 py-2 rounded-xl shadow-sm font-medium"
          >
            🏠 Domů
          </Link>
        </div>

        <div className="flex items-center gap-4 mb-10">

          <div className="bg-black text-white p-4 rounded-3xl">

            <CalendarDays size={36} />

          </div>

          <div>

            <h1 className="text-5xl font-bold mb-2">
              Kalendář půjček
            </h1>

            <p className="text-gray-500 text-lg">
              Přehled aktivních půjček a obsazenosti
            </p>

          </div>

        </div>

        <div className="grid gap-6">

          {sortedRentals.map((rental) => (

            <div
              key={rental.id}
              className={`
                rounded-3xl shadow-lg p-6 border-2 bg-white
                ${
                  isOverdue(rental.end_date)
                    ? 'border-red-500'
                    : 'border-green-500'
                }
              `}
            >

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                <div>

                  <h2 className="text-3xl font-bold mb-2">

                    {rental.machines.name}

                  </h2>

                  <p className="text-lg text-gray-600">

                    {rental.customers.first_name}
                    {' '}
                    {rental.customers.last_name}

                  </p>

                </div>

                <div className="grid md:grid-cols-2 gap-6 flex-1">

                  <div className="bg-gray-100 rounded-2xl p-4">

                    <p className="text-sm text-gray-500 mb-2">
                      Začátek půjčky
                    </p>

                    <p className="font-bold text-lg">

                      {new Date(
                        rental.start_date
                      ).toLocaleString()}

                    </p>

                  </div>

                  <div className="bg-gray-100 rounded-2xl p-4">

                    <p className="text-sm text-gray-500 mb-2">
                      Konec půjčky
                    </p>

                    <p className="font-bold text-lg">

                      {new Date(
                        rental.end_date
                      ).toLocaleString()}

                    </p>

                  </div>

                </div>

                <div>

                  {isOverdue(rental.end_date) ? (

                    <div className="bg-red-100 text-red-700 px-5 py-3 rounded-2xl flex items-center gap-3 font-bold">

                      <AlertTriangle size={20} />

                      Po termínu

                    </div>

                  ) : (

                    <div className="bg-green-100 text-green-700 px-5 py-3 rounded-2xl font-bold">
                      Aktivní
                    </div>

                  )}

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </main>
  )
}
