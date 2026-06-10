'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import {
  PlusCircle,
  Undo2,
  ClipboardList,
  Wrench,
  AlertTriangle,
  CalendarDays,
  Phone,
  User,
  Clock3,
  Users
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

type ActiveRental = {
  id: string
  start_date: string
  end_date: string
  rental_price: number
  deposit: number
  customers:
    | {
        first_name: string
        last_name: string
        phone: string
      }
    | {
        first_name: string
        last_name: string
        phone: string
      }[]
    | null
  machines:
    | {
        name: string
      }
    | {
        name: string
      }[]
    | null
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('cs-CZ')
}

function isOverdue(value: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const end = new Date(value)
  end.setHours(0, 0, 0, 0)

  return end < today
}

function getCustomer(rental: ActiveRental) {
  if (Array.isArray(rental.customers)) {
    return rental.customers[0] || null
  }

  return rental.customers
}

function getMachine(rental: ActiveRental) {
  if (Array.isArray(rental.machines)) {
    return rental.machines[0] || null
  }

  return rental.machines
}

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

  const [activeRentalList, setActiveRentalList] =
    useState<ActiveRental[]>([])

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)

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

    const { data, error } =
      await supabase
        .from('rentals')
        .select(`
          id,
          start_date,
          end_date,
          rental_price,
          deposit,
          customers (
            first_name,
            last_name,
            phone
          ),
          machines (
            name
          )
        `)
        .eq('returned', false)
        .order('end_date', {
          ascending: true
        })

    if (error) {
      console.log(error)

      setActiveRentalList([])
      setOverdue(0)
      setLoading(false)

      return
    }

    const rentals =
      (data || []) as unknown as ActiveRental[]

    setActiveRentalList(
      rentals
    )

    setOverdue(
      rentals.filter(
        rental =>
          isOverdue(
            rental.end_date
          )
      ).length
    )

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 lg:p-8">

      <div className="max-w-7xl mx-auto">

        <div className="mb-8">

          <h1 className="text-5xl font-bold mb-2">
            Dashboard
          </h1>

          <p className="text-gray-500 text-lg">
            Rychlá obsluha půjčovny strojů
          </p>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          <Link
            href="/rentals/new"
            className="
              bg-black
              text-white
              rounded-3xl
              p-7
              shadow-lg
              hover:scale-[1.02]
              transition
            "
          >

            <PlusCircle
              size={38}
              className="mb-4"
            />

            <h2 className="text-2xl font-bold mb-2">
              Nová půjčka
            </h2>

            <p className="text-gray-300">
              Vytvořit novou půjčku
            </p>

          </Link>

          <Link
            href="/reservations/new"
            className="
              bg-black
              text-white
              rounded-3xl
              p-7
              shadow-lg
              hover:scale-[1.02]
              transition
            "
          >

            <PlusCircle
              size={38}
              className="mb-4"
            />

            <h2 className="text-2xl font-bold mb-2">
              Nová rezervace
            </h2>

            <p className="text-gray-300">
              Vytvořit novou rezervaci
            </p>

          </Link>

          <Link
            href="/returns"
            className="
              bg-white
              rounded-3xl
              p-7
              shadow-lg
              hover:scale-[1.02]
              transition
            "
          >

            <Undo2
              size={38}
              className="mb-4"
            />

            <h2 className="text-2xl font-bold mb-2">
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
              p-7
              shadow-lg
              hover:scale-[1.02]
              transition
            "
          >

            <ClipboardList
              size={38}
              className="mb-4"
            />

            <h2 className="text-2xl font-bold mb-2">
              Rezervace
            </h2>

            <p className="text-gray-500">
              Správa rezervací
            </p>

          </Link>

          <Link
            href="/customers"
            className="
              bg-white
              rounded-3xl
              p-7
              shadow-lg
              hover:scale-[1.02]
              transition
            "
          >

            <Users
              size={38}
              className="mb-4"
            />

            <h2 className="text-2xl font-bold mb-2">
              Zákazníci
            </h2>

            <p className="text-gray-500">
              Evidence zákazníků
            </p>

          </Link>

          <Link
            href="/machines"
            className="
              bg-white
              rounded-3xl
              p-7
              shadow-lg
              hover:scale-[1.02]
              transition
            "
          >

            <Wrench
              size={38}
              className="mb-4"
            />

            <h2 className="text-2xl font-bold mb-2">
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
              p-7
              shadow-lg
              hover:scale-[1.02]
              transition
            "
          >

            <CalendarDays
              size={38}
              className="mb-4"
            />

            <h2 className="text-2xl font-bold mb-2">
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
              p-7
              shadow-lg
              hover:scale-[1.02]
              transition
            "
          >

            <AlertTriangle
              size={38}
              className="mb-4 text-red-600"
            />

            <h2 className="text-2xl font-bold mb-2 text-red-600">
              Po termínu
            </h2>

            <p className="text-red-500">
              Kontrola nevrácených strojů
            </p>

          </Link>

        </div>

        <section className="bg-white rounded-3xl shadow-lg overflow-hidden mb-8">

          <div className="p-6 lg:p-8 border-b">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

              <div>

                <h2 className="text-3xl font-bold mb-2">
                  Aktivní půjčky
                </h2>

                <p className="text-gray-500">
                  Provozní seznam s kontaktem na zákazníka
                </p>

              </div>

              <Link
                href="/calendar"
                className="
                  bg-gray-100
                  hover:bg-gray-200
                  transition
                  rounded-2xl
                  px-5
                  py-3
                  font-semibold
                  text-gray-700
                  flex
                  items-center
                  justify-center
                  gap-2
                "
              >

                <CalendarDays size={18} />

                Otevřít kalendář

              </Link>

            </div>

          </div>

          {loading ? (

            <div className="p-8 text-center text-gray-500">
              Načítám aktivní půjčky...
            </div>

          ) : activeRentalList.length === 0 ? (

            <div className="p-8 text-center text-gray-500">
              Žádné aktivní půjčky
            </div>

          ) : (

            <div className="divide-y">

              {activeRentalList.map(
                rental => {

                  const overdueRental =
                    isOverdue(
                      rental.end_date
                    )

                  const customer =
                    getCustomer(
                      rental
                    )

                  const machine =
                    getMachine(
                      rental
                    )

                  const customerName =
                    customer
                      ? `${customer.first_name} ${customer.last_name}`
                      : 'Neznámý zákazník'

                  const phone =
                    customer?.phone || ''

                  return (

                    <div
                      key={rental.id}
                      className={`
                        p-5
                        lg:p-6
                        grid
                        gap-4
                        lg:grid-cols-[1.4fr_1fr_1fr_auto]
                        lg:items-center
                        ${overdueRental
                          ? 'bg-red-50'
                          : 'bg-white'}
                      `}
                    >

                      <div>

                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">

                          <Wrench size={16} />

                          Stroj

                        </div>

                        <div className="text-xl font-bold">
                          {machine?.name || '-'}
                        </div>

                      </div>

                      <div>

                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">

                          <User size={16} />

                          Zákazník

                        </div>

                        <div className="font-semibold">
                          {customerName}
                        </div>

                        {phone ? (

                          <a
                            href={`tel:${phone}`}
                            className="
                              mt-2
                              inline-flex
                              items-center
                              gap-2
                              bg-black
                              text-white
                              rounded-xl
                              px-4
                              py-2
                              text-sm
                              font-semibold
                            "
                          >

                            <Phone size={16} />

                            {phone}

                          </a>

                        ) : (

                          <div className="text-sm text-red-500 mt-2">
                            Telefon chybí
                          </div>

                        )}

                      </div>

                      <div>

                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">

                          <Clock3 size={16} />

                          Termín

                        </div>

                        <div className="font-semibold">

                          {formatDate(
                            rental.start_date
                          )}
                          {' '}
                          –
                          {' '}
                          {formatDate(
                            rental.end_date
                          )}

                        </div>

                        {overdueRental && (

                          <div className="text-red-600 text-sm font-semibold mt-1">
                            Po termínu
                          </div>

                        )}

                      </div>

                      <Link
                        href="/returns"
                        className="
                          bg-gray-100
                          hover:bg-gray-200
                          transition
                          rounded-2xl
                          px-5
                          py-3
                          font-semibold
                          text-center
                        "
                      >
                        Vrátit
                      </Link>

                    </div>

                  )
                }
              )}

            </div>

          )}

        </section>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

          <div className="bg-white rounded-3xl p-5 shadow-lg">

            <div className="text-gray-500 mb-2">
              Aktivní půjčky
            </div>

            <div className="text-3xl font-bold">
              {activeRentals}
            </div>

          </div>

          <div className="bg-white rounded-3xl p-5 shadow-lg">

            <div className="text-gray-500 mb-2">
              Stroje
            </div>

            <div className="text-3xl font-bold">
              {machines}
            </div>

          </div>

          <div className="bg-white rounded-3xl p-5 shadow-lg">

            <div className="text-gray-500 mb-2">
              Zákazníci
            </div>

            <div className="text-3xl font-bold">
              {customers}
            </div>

          </div>

          <div className="bg-white rounded-3xl p-5 shadow-lg">

            <div className="text-gray-500 mb-2">
              Rezervace
            </div>

            <div className="text-3xl font-bold">
              {reservations}
            </div>

          </div>

          <div className="bg-red-50 rounded-3xl p-5 shadow-lg">

            <div className="text-red-600 mb-2">
              Po termínu
            </div>

            <div className="text-3xl font-bold text-red-600">
              {overdue}
            </div>

          </div>

        </div>

      </div>

    </main>
  )
}