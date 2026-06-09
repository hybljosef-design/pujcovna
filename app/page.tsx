'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import {
  Wrench,
  Users,
  Undo2,
  PlusCircle,
  CalendarDays,
  ClipboardList
} from 'lucide-react'

import { supabase } from '../lib/supabase'

import AuthGuard from '../components/AuthGuard'
import Sidebar from '../components/Sidebar'
import UserMenu from '../components/UserMenu'

export default function DashboardPage() {
  const [machinesCount, setMachinesCount] =
    useState(0)

  const [customersCount, setCustomersCount] =
    useState(0)

  const [activeRentals, setActiveRentals] =
    useState(0)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const { count: machines } = await supabase
      .from('machines')
      .select('*', {
        count: 'exact',
        head: true
      })

    const { count: customers } = await supabase
      .from('customers')
      .select('*', {
        count: 'exact',
        head: true
      })

    const { count: rentals } = await supabase
      .from('rentals')
      .select('*', {
        count: 'exact',
        head: true
      })
      .eq('returned', false)

    setMachinesCount(machines || 0)
    setCustomersCount(customers || 0)
    setActiveRentals(rentals || 0)
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
        <Sidebar />

        <div className="flex-1 min-w-0 w-full p-4 lg:p-10">

          <div className="mb-8">
            <UserMenu />
          </div>

          <div className="mb-10">
            <h1 className="text-4xl lg:text-5xl font-bold mb-3">
              Dashboard
            </h1>

            <p className="text-gray-500 text-base lg:text-lg">
              Profesionální systém půjčovny strojů
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

            <div className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Undo2 size={24} />
                <span className="text-gray-500">
                  Aktivní půjčky
                </span>
              </div>

              <h2 className="text-4xl font-bold">
                {activeRentals}
              </h2>
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Wrench size={24} />
                <span className="text-gray-500">
                  Stroje
                </span>
              </div>

              <h2 className="text-4xl font-bold">
                {machinesCount}
              </h2>
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Users size={24} />
                <span className="text-gray-500">
                  Zákazníci
                </span>
              </div>

              <h2 className="text-4xl font-bold">
                {customersCount}
              </h2>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">

            <Link
              href="/rentals/new"
              className="
                bg-black
                text-white
                rounded-3xl
                shadow-lg
                p-6
                hover:bg-gray-800
                transition
              "
            >
              <PlusCircle
                size={32}
                className="mb-4"
              />

              <h2 className="text-2xl font-bold mb-2">
                Nová půjčka
              </h2>

              <p className="text-gray-300">
                Vytvořit půjčku
              </p>
            </Link>

            <Link
              href="/returns"
              className="
                bg-white
                rounded-3xl
                shadow-lg
                p-6
              "
            >
              <Undo2
                size={32}
                className="mb-4"
              />

              <h2 className="text-2xl font-bold mb-2">
                Vrácení
              </h2>

              <p className="text-gray-500">
                Vrátit stroj
              </p>
            </Link>

            <Link
              href="/machines"
              className="
                bg-white
                rounded-3xl
                shadow-lg
                p-6
              "
            >
              <Wrench
                size={32}
                className="mb-4"
              />

              <h2 className="text-2xl font-bold mb-2">
                Stroje
              </h2>

              <p className="text-gray-500">
                Správa strojů
              </p>
            </Link>

            <Link
              href="/calendar"
              className="
                bg-white
                rounded-3xl
                shadow-lg
                p-6
              "
            >
              <CalendarDays
                size={32}
                className="mb-4"
              />

              <h2 className="text-2xl font-bold mb-2">
                Kalendář
              </h2>

              <p className="text-gray-500">
                Přehled rezervací
              </p>
            </Link>

            <Link
              href="/reservations"
              className="
                bg-white
                rounded-3xl
                shadow-lg
                p-6
              "
            >
              <ClipboardList
                size={32}
                className="mb-4"
              />

              <h2 className="text-2xl font-bold mb-2">
                Rezervace
              </h2>

              <p className="text-gray-500">
                Správa rezervací
              </p>
            </Link>

          </div>

        </div>
      </main>
    </AuthGuard>
  )
}
