'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import {
  PlusCircle,
  Undo2,
  ClipboardList,
  Wrench,
  AlertTriangle,
  CalendarDays
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

export default function DashboardPage() {

  const [activeRentals, setActiveRentals] =
    useState(0)

  const [machines, setMachines] =
    useState(0)

  const [customers, setCustomers] =
    useState(0)

  const [reservations, setReservations] =
    useState(0)

  const [overdue, setOverdue] =
    useState(0)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {

    const [
      rentalsResult,
      machinesResult,
      customersResult,
      reservationsResult
    ] = await Promise.all([

      supabase
        .from('rentals')
        .select('*', {
          count: 'exact',
          head: true
        })
        .eq('returned', false),

      supabase
        .from('machines')
        .select('*', {
          count: 'exact',
          head: true
        }),

      supabase
        .from('customers')
        .select('*', {
          count: 'exact',
          head: true
        }),

      supabase
        .from('reservations')
        .select('*', {
          count: 'exact',
          head: true
        })

    ])

    setActiveRentals(
      rentalsResult.count || 0
    )

    setMachines(
      machinesResult.count || 0
    )

    setCustomers(
      customersResult.count || 0
    )

    setReservations(
      reservationsResult.count || 0
    )

    const { data } = await supabase
      .from('rentals')
      .select('end_date')
      .eq('returned', false)

    const today =
      new Date()

    const overdueCount =
      (data || []).filter(
        rental =>
          new Date(
            rental.end_date
          ) < today
      ).length

    setOverdue(
      overdueCount
    )
  }

  return (

    <main className="min-h-screen bg-gray-100 p-4 lg:p-8">

      <div className="max-w-7xl mx-auto">

        <div className="mb-10">

          <h1 className="text-5xl font-bold mb-2">

            Dashboard

          </h1>

          <p className="text-gray-500 text-lg">

            Profesionální systém půjčovny strojů

          </p>

        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">

          <div className="bg-white rounded-3xl p-6 shadow-lg">

            <div className="text-gray-500 mb-2">
              Aktivní půjčky
            </div>

            <div className="text-4xl font-bold">
              {activeRentals}
            </div>

          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg">

            <div className="text-gray-500 mb-2">
              Stroje
            </div>

            <div className="text-4xl font-bold">
              {machines}
            </div>

          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg">

            <div className="text-gray-500 mb-2">
              Zákazníci
            </div>

            <div className="text-4xl font-bold">
              {customers}
            </div>

          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg">

            <div className="text-gray-500 mb-2">
              Rezervace
            </div>

            <div className="text-4xl font-bold">
              {reservations}
            </div>

          </div>

          <div className="bg-red-50 rounded-3xl p-6 shadow-lg">

            <div className="text-red-600 mb-2">
              Po termínu
            </div>

            <div className="text-4xl font-bold text-red-600">
              {overdue}
            </div>

          </div>

        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          <Link
            href="/rentals/new"
            className="
              bg-black
              text-white
              rounded-3xl
              p-8
              shadow-lg
              hover:scale-[1.02]
              transition
            "
          >

            <PlusCircle
              size={40}
              className="mb-4"
            />

            <h2 className="text-3xl font-bold mb-2">
              Nová půjčka
            </h2>

            <p className="text-gray-300">
              Vytvořit novou půjčku
            </p>

          </Link>

          <Link
            href="/returns"
            className="
              bg-white
              rounded-3xl
              p-8
              shadow-lg
            "
          >

            <Undo2
              size={40}
              className="mb-4"
            />

            <h2 className="text-3xl font-bold mb-2">
              Vrácení
            </h2>

            <p className="text-gray-500">
              Přijmout vrácený stroj
            </p>

          </Link>

          <Link
            href="/reservations"
            className="
              bg-white
              rounded-3xl
              p-8
              shadow-lg
            "
          >

            <ClipboardList
              size={40}
              className="mb-4"
            />

            <h2 className="text-3xl font-bold mb-2">
              Rezervace
            </h2>

            <p className="text-gray-500">
              Správa rezervací
            </p>

          </Link>

          <Link
            href="/machines"
            className="
              bg-white
              rounded-3xl
              p-8
              shadow-lg
            "
          >

            <Wrench
              size={40}
              className="mb-4"
            />

            <h2 className="text-3xl font-bold mb-2">
              Stroje
            </h2>

            <p className="text-gray-500">
              Evidence strojů
            </p>

          </Link>

          <Link
            href="/calendar"
            className="
              bg-white
              rounded-3xl
              p-8
              shadow-lg
            "
          >

            <CalendarDays
              size={40}
              className="mb-4"
            />

            <h2 className="text-3xl font-bold mb-2">
              Kalendář
            </h2>

            <p className="text-gray-500">
              Přehled vytížení
            </p>

          </Link>

          <Link
            href="/overdue"
            className="
              bg-red-50
              rounded-3xl
              p-8
              shadow-lg
            "
          >

            <AlertTriangle
              size={40}
              className="mb-4 text-red-600"
            />

            <h2 className="text-3xl font-bold mb-2 text-red-600">
              Po termínu
            </h2>

            <p className="text-red-500">
              Kontrola nevrácených strojů
            </p>

          </Link>

        </div>

      </div>

    </main>
  )
}