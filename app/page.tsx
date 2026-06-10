'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import {
  Wrench,
  Undo2,
  PlusCircle,
  CalendarDays,
  ClipboardList,
  AlertTriangle
} from 'lucide-react'

import { supabase } from '../lib/supabase'

import AuthGuard from '../components/AuthGuard'
import Sidebar from '../components/Sidebar'
import UserMenu from '../components/UserMenu'

export default function DashboardPage() {
  const [reservationsCount, setReservationsCount] =
    useState(0)

  const [overdueCount, setOverdueCount] =
    useState(0)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const { count: reservations } = await supabase
      .from('reservations')
      .select('*', {
        count: 'exact',
        head: true
      })

    const { data: activeRentalsData } = await supabase
      .from('rentals')
      .select('end_date')
      .eq('returned', false)

    const today =
      new Date()

    today.setHours(
      0,
      0,
      0,
      0
    )

    const overdue =
      (activeRentalsData || []).filter(
        rental => {

          const end =
            new Date(
              rental.end_date
            )

          end.setHours(
            0,
            0,
            0,
            0
          )

          return end < today
        }
      ).length

    setReservationsCount(
      reservations || 0
    )

    setOverdueCount(
      overdue
    )
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
        <Sidebar />

        <div className="flex-1 min-w-0 w-full p-4 lg:p-10">

          <div className="mb-6">
            <UserMenu />
          </div>

          <div className="mb-8">

            <h1 className="text-3xl lg:text-4xl font-bold mb-2">

              Obsluha půjčovny

            </h1>

            <p className="text-gray-500 text-base lg:text-lg">

              Vyber akci podle zákazníka

            </p>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">

            <Link
              href="/rentals/new"
              className="
                bg-black
                text-white
                rounded-3xl
                shadow-lg
                p-8
                hover:bg-gray-800
                active:scale-[0.98]
                transition
                min-h-[190px]
                flex
                flex-col
                justify-between
              "
            >

              <PlusCircle
                size={46}
              />

              <div>

                <h2 className="text-3xl lg:text-4xl font-bold mb-2">

                  Nová půjčka

                </h2>

                <p className="text-gray-300 text-lg">

                  Přišel zákazník půjčit stroj

                </p>

              </div>

            </Link>

            <Link
              href="/reservations"
              className="
                bg-white
                rounded-3xl
                shadow-lg
                p-8
                hover:bg-gray-50
                active:scale-[0.98]
                transition
                min-h-[190px]
                flex
                flex-col
                justify-between
              "
            >

              <ClipboardList
                size={46}
              />

              <div>

                <div className="
                  flex
                  items-center
                  justify-between
                  gap-4
                  mb-2
                ">

                  <h2 className="text-3xl lg:text-4xl font-bold">

                    Rezervace

                  </h2>

                  <span className="
                    bg-black
                    text-white
                    rounded-2xl
                    px-4
                    py-2
                    text-2xl
                    font-bold
                  ">

                    {reservationsCount}

                  </span>

                </div>

                <p className="text-gray-500 text-lg">

                  Volání, úpravy a převod na půjčku

                </p>

              </div>

            </Link>

            <Link
              href="/returns"
              className="
                bg-white
                rounded-3xl
                shadow-lg
                p-8
                hover:bg-gray-50
                active:scale-[0.98]
                transition
                min-h-[190px]
                flex
                flex-col
                justify-between
              "
            >

              <Undo2
                size={46}
              />

              <div>

                <h2 className="text-3xl lg:text-4xl font-bold mb-2">

                  Vrácení

                </h2>

                <p className="text-gray-500 text-lg">

                  Zákazník vrací stroj

                </p>

              </div>

            </Link>

            <Link
              href="/overdue"
              className="
                bg-red-50
                rounded-3xl
                shadow-lg
                p-8
                hover:bg-red-100
                active:scale-[0.98]
                transition
                min-h-[190px]
                flex
                flex-col
                justify-between
              "
            >

              <AlertTriangle
                size={46}
                className="text-red-600"
              />

              <div>

                <div className="
                  flex
                  items-center
                  justify-between
                  gap-4
                  mb-2
                ">

                  <h2 className="text-3xl lg:text-4xl font-bold text-red-600">

                    Po termínu

                  </h2>

                  <span className="
                    bg-red-600
                    text-white
                    rounded-2xl
                    px-4
                    py-2
                    text-2xl
                    font-bold
                  ">

                    {overdueCount}

                  </span>

                </div>

                <p className="text-red-500 text-lg">

                  Kontrola nevrácených strojů

                </p>

              </div>

            </Link>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <Link
              href="/machines"
              className="
                bg-white
                rounded-3xl
                shadow-lg
                p-6
                hover:bg-gray-50
                active:scale-[0.98]
                transition
              "
            >

              <Wrench
                size={34}
                className="mb-4"
              />

              <h2 className="text-2xl font-bold mb-2">

                Stroje

              </h2>

              <p className="text-gray-500">

                Správa strojů a QR štítků

              </p>

            </Link>

            <Link
              href="/calendar"
              className="
                bg-white
                rounded-3xl
                shadow-lg
                p-6
                hover:bg-gray-50
                active:scale-[0.98]
                transition
              "
            >

              <CalendarDays
                size={34}
                className="mb-4"
              />

              <h2 className="text-2xl font-bold mb-2">

                Kalendář

              </h2>

              <p className="text-gray-500">

                Přehled vytížení strojů

              </p>

            </Link>

          </div>

        </div>
      </main>
    </AuthGuard>
  )
}
