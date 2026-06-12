'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Wrench
} from 'lucide-react'

import { supabase } from '../../../../lib/supabase'

type Machine = {
  id: string
  name: string
  daily_price: number
  deposit: number
  active?: boolean
  status?: string
  barcode?: string
  public_description?: string | null
  public_visible?: boolean | null
  public_slug?: string | null
}

type Rental = {
  machine_id: string
  start_date: string
  end_date: string
  returned: boolean
}

type Reservation = {
  machine_id: string
  start_date: string
  end_date: string
  cancelled?: boolean
}

function startOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function formatDate(date: Date) {
  return date.toLocaleDateString('cs-CZ')
}

function isDateInRange(date: Date, start: string, end: string) {
  const day = startOfDay(date).getTime()
  const rangeStart = startOfDay(new Date(start)).getTime()
  const rangeEnd = startOfDay(new Date(end)).getTime()

  return day >= rangeStart && day <= rangeEnd
}

export default function PublicMachineDetailPage() {
  const params = useParams()
  const machineId = String(params.id || '')

  const [machine, setMachine] = useState<Machine | null>(null)
  const [rentals, setRentals] = useState<Rental[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (machineId) {
      loadData()
    }
  }, [machineId])

  async function loadData() {
    setLoading(true)

    const [machineResult, rentalsResult, reservationsResult] =
      await Promise.all([
        supabase
          .from('machines')
          .select(`
            id,
            name,
            daily_price,
            deposit,
            active,
            status,
            barcode,
            public_description,
            public_visible,
            public_slug
          `)
          .eq('id', machineId)
          .single(),

        supabase
          .from('rentals')
          .select(`
            machine_id,
            start_date,
            end_date,
            returned
          `)
          .eq('machine_id', machineId)
          .eq('returned', false),

        supabase
          .from('reservations')
          .select(`
            machine_id,
            start_date,
            end_date,
            cancelled
          `)
          .eq('machine_id', machineId)
          .eq('cancelled', false)
      ])

    if (machineResult.error) {
      console.log(machineResult.error)
      setMachine(null)
      setLoading(false)
      return
    }

    setMachine(machineResult.data)
    setRentals(rentalsResult.data || [])
    setReservations(reservationsResult.data || [])
    setLoading(false)
  }

  function isMachineBlockedOnDate(date: Date) {
    const rentalBlocked = rentals.some(
      rental =>
        isDateInRange(
          date,
          rental.start_date,
          rental.end_date
        )
    )

    const reservationBlocked = reservations.some(
      reservation =>
        isDateInRange(
          date,
          reservation.start_date,
          reservation.end_date
        )
    )

    return rentalBlocked || reservationBlocked
  }

  const availability = useMemo(() => {
    const today = startOfDay(new Date())

    if (!isMachineBlockedOnDate(today)) {
      return {
        availableToday: true,
        label: 'Volné dnes'
      }
    }

    for (let i = 1; i <= 90; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)

      if (!isMachineBlockedOnDate(date)) {
        return {
          availableToday: false,
          label: `Nejbližší volno ${formatDate(date)}`
        }
      }
    }

    return {
      availableToday: false,
      label: 'Termín na dotaz'
    }
  }, [rentals, reservations])

  const nextDays = useMemo(() => {
    const days = []
    const today = startOfDay(new Date())

    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push(date)
    }

    return days
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center text-gray-500">
          Načítám detail stroje...
        </div>
      </main>
    )
  }

  if (!machine) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
          <h1 className="text-3xl font-black mb-3">
            Stroj nebyl nalezen
          </h1>

          <Link
            href="/pujcovna"
            className="text-blue-600 font-bold"
          >
            Zpět do půjčovny
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <section className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
          <Link
            href="/pujcovna"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-8 font-semibold"
          >
            <ArrowLeft size={20} />
            Zpět na seznam strojů
          </Link>

          <div className="grid lg:grid-cols-[1.4fr_0.8fr] gap-8 items-end">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-2 mb-5">
                <Wrench size={18} />
                Detail stroje
              </div>

              <h1 className="text-4xl lg:text-6xl font-black mb-5">
                {machine.name}
              </h1>

              <p className="text-gray-300 text-lg lg:text-xl max-w-3xl">
                {machine.public_description ||
                  'Popis stroje připravujeme. Pro více informací nás kontaktujte nebo pokračujte na rezervaci.'}
              </p>
            </div>

            <div className="bg-white text-black rounded-3xl p-6 shadow-2xl">
              <div className={`
                inline-flex
                items-center
                gap-2
                rounded-2xl
                px-4
                py-2
                font-bold
                mb-5

                ${availability.availableToday
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'}
              `}>
                {availability.availableToday
                  ? <CheckCircle2 size={20} />
                  : <Clock3 size={20} />}

                {availability.label}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-100 rounded-2xl p-4">
                  <p className="text-gray-500 text-sm mb-1">
                    Cena / den
                  </p>

                  <p className="text-3xl font-black">
                    {machine.daily_price} Kč
                  </p>
                </div>

                <div className="bg-gray-100 rounded-2xl p-4">
                  <p className="text-gray-500 text-sm mb-1">
                    Kauce
                  </p>

                  <p className="text-3xl font-black">
                    {machine.deposit} Kč
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_0.7fr] gap-8">
        <div className="bg-white rounded-3xl shadow-lg p-6 lg:p-8">
          <h2 className="text-3xl font-black mb-4">
            Dostupnost
          </h2>

          <p className="text-gray-500 mb-6">
            Základní přehled dostupnosti na nejbližších 14 dní. Detailní výběr termínu bude v dalším kroku.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {nextDays.map(day => {
              const blocked = isMachineBlockedOnDate(day)

              return (
                <div
                  key={day.toISOString()}
                  className={`
                    rounded-2xl
                    p-4
                    text-center
                    border
                    font-bold

                    ${blocked
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-green-50 text-green-700 border-green-200'}
                  `}
                >
                  <div className="text-sm">
                    {day.toLocaleDateString(
                      'cs-CZ',
                      {
                        weekday: 'short'
                      }
                    )}
                  </div>

                  <div className="text-xl">
                    {day.getDate()}.
                  </div>

                  <div className="text-xs mt-1">
                    {blocked
                      ? 'Obsazeno'
                      : 'Volno'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <CalendarDays size={24} />

              <h2 className="text-2xl font-black">
                Rezervace
              </h2>
            </div>

            <p className="text-gray-500 mb-5">
              Online výběr termínu a odeslání rezervace připravíme v dalším kroku.
            </p>

            <button
              type="button"
              disabled
              className="w-full bg-gray-300 text-gray-600 rounded-2xl p-4 font-bold text-lg cursor-not-allowed"
            >
              Rezervace bude brzy dostupná
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck size={24} />

              <h2 className="text-2xl font-black">
                Co připravujeme
              </h2>
            </div>

            <ul className="space-y-3 text-gray-600">
              <li>• Výběr termínu v kalendáři</li>
              <li>• Online rezervace bez přihlášení</li>
              <li>• Videonávody ke stroji</li>
              <li>• Praktické pokyny k použití</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  )
}
