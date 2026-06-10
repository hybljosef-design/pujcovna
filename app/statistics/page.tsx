'use client'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import Link from 'next/link'

import {
  Activity,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Crown,
  TrendingUp,
  Wallet,
  Wrench
} from 'lucide-react'

import AuthGuard from '../../components/AuthGuard'
import Sidebar from '../../components/Sidebar'

import { supabase } from '../../lib/supabase'

type Period = 'today' | 'month' | 'year' | 'all'

type Rental = {
  id: string
  machine_id: string
  start_date: string
  end_date: string
  rental_price: number | null
  deposit: number | null
  returned: boolean | null
  machines:
    | {
        id: string
        name: string
        purchase_price?: number | null
        purchase_date?: string | null
      }
    | {
        id: string
        name: string
        purchase_price?: number | null
        purchase_date?: string | null
      }[]
    | null
}

type MachineStats = {
  machineId: string
  machineName: string
  rentalCount: number
  totalDays: number
  totalRevenue: number
  totalDeposit: number
  averageRevenue: number
  purchasePrice: number
  purchaseDate: string
  returnPercent: number
  lastRentalDate: string
}

function formatMoney(value: number) {
  return new Intl.NumberFormat(
    'cs-CZ',
    {
      style: 'currency',
      currency: 'CZK',
      maximumFractionDigits: 0
    }
  ).format(value)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('cs-CZ')
}

function getMachine(rental: Rental) {
  if (Array.isArray(rental.machines)) {
    return rental.machines[0] || null
  }

  return rental.machines
}

function getRentalDays(
  startDate: string,
  endDate: string
) {
  const start =
    new Date(startDate)

  const end =
    new Date(endDate)

  const diff =
    end.getTime() - start.getTime()

  return Math.max(
    1,
    Math.ceil(
      diff / (
        1000 *
        60 *
        60 *
        24
      )
    )
  )
}

function getReturnColor(percent: number) {
  if (percent >= 100) {
    return 'bg-green-100 text-green-700'
  }

  if (percent >= 50) {
    return 'bg-yellow-100 text-yellow-700'
  }

  return 'bg-red-100 text-red-700'
}

function getPeriodStart(period: Period) {
  const now =
    new Date()

  if (period === 'today') {
    const today =
      new Date()

    today.setHours(
      0,
      0,
      0,
      0
    )

    return today
  }

  if (period === 'month') {
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    )
  }

  if (period === 'year') {
    return new Date(
      now.getFullYear(),
      0,
      1
    )
  }

  return null
}

export default function StatisticsPage() {
  const [rentals, setRentals] =
    useState<Rental[]>([])

  const [period, setPeriod] =
    useState<Period>('year')

  const [loading, setLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState('')

  useEffect(() => {
    loadStatistics()
  }, [])

  async function loadStatistics() {
    setLoading(true)

    setErrorMessage('')

    const { data, error } =
      await supabase
        .from('rentals')
        .select(`
          id,
          machine_id,
          start_date,
          end_date,
          rental_price,
          deposit,
          returned,
          machines (
            id,
            name,
            purchase_price,
            purchase_date
          )
        `)
        .order(
          'start_date',
          {
            ascending: false
          }
        )

    if (error) {
      console.log(error)

      setErrorMessage(
        'Statistiky se nepodařilo načíst.'
      )

      setRentals([])

      setLoading(false)

      return
    }

    setRentals(
      (data || []) as unknown as Rental[]
    )

    setLoading(false)
  }

  const filteredRentals =
    useMemo(() => {
      const periodStart =
        getPeriodStart(period)

      if (!periodStart) {
        return rentals
      }

      return rentals.filter(
        rental =>
          new Date(rental.start_date) >=
          periodStart
      )
    }, [
      rentals,
      period
    ])

  const machineStats =
    useMemo(() => {
      const map =
        new Map<string, MachineStats>()

      filteredRentals.forEach(
        rental => {
          const machine =
            getMachine(rental)

          const machineId =
            rental.machine_id ||
            machine?.id ||
            'unknown'

          const machineName =
            machine?.name ||
            'Neznámý stroj'

          const purchasePrice =
            Number(
              machine?.purchase_price || 0
            )

          const purchaseDate =
            machine?.purchase_date || ''

          const days =
            getRentalDays(
              rental.start_date,
              rental.end_date
            )

          const rentalPrice =
            Number(
              rental.rental_price || 0
            )

          const deposit =
            Number(
              rental.deposit || 0
            )

          const existing =
            map.get(machineId)

          if (!existing) {
            map.set(
              machineId,
              {
                machineId,
                machineName,
                rentalCount: 1,
                totalDays: days,
                totalRevenue: rentalPrice,
                totalDeposit: deposit,
                averageRevenue: rentalPrice,
                purchasePrice,
                purchaseDate,
                returnPercent:
                  purchasePrice > 0
                    ? rentalPrice / purchasePrice * 100
                    : 0,
                lastRentalDate: rental.start_date
              }
            )

            return
          }

          existing.rentalCount += 1
          existing.totalDays += days
          existing.totalRevenue += rentalPrice
          existing.totalDeposit += deposit

          if (
            purchasePrice > 0 &&
            existing.purchasePrice === 0
          ) {
            existing.purchasePrice =
              purchasePrice
          }

          if (
            purchaseDate &&
            !existing.purchaseDate
          ) {
            existing.purchaseDate =
              purchaseDate
          }

          if (
            new Date(rental.start_date) >
            new Date(existing.lastRentalDate)
          ) {
            existing.lastRentalDate =
              rental.start_date
          }

          existing.averageRevenue =
            existing.totalRevenue /
            existing.rentalCount

          existing.returnPercent =
            existing.purchasePrice > 0
              ? existing.totalRevenue /
                existing.purchasePrice *
                100
              : 0
        }
      )

      return Array
        .from(map.values())
        .sort(
          (a, b) =>
            b.totalRevenue -
            a.totalRevenue
        )
    }, [
      filteredRentals
    ])

  const totalRentals =
    filteredRentals.length

  const totalRevenue =
    machineStats.reduce(
      (sum, item) =>
        sum + item.totalRevenue,
      0
    )

  const totalDeposit =
    machineStats.reduce(
      (sum, item) =>
        sum + item.totalDeposit,
      0
    )

  const activeRentals =
    filteredRentals.filter(
      rental =>
        rental.returned === false
    ).length

  const topRevenueMachine =
    machineStats[0] || null

  const mostRentedMachine =
    [...machineStats].sort(
      (a, b) =>
        b.rentalCount -
        a.rentalCount
    )[0] || null

  const bestReturnMachine =
    [...machineStats]
      .filter(
        item =>
          item.purchasePrice > 0
      )
      .sort(
        (a, b) =>
          b.returnPercent -
          a.returnPercent
      )[0] || null

  const totalPurchasePrice =
    machineStats.reduce(
      (sum, item) =>
        sum + item.purchasePrice,
      0
    )

  const totalReturnPercent =
    totalPurchasePrice > 0
      ? totalRevenue /
        totalPurchasePrice *
        100
      : 0

  const periodButtons: {
    value: Period
    label: string
  }[] = [
    {
      value: 'today',
      label: 'Dnes'
    },
    {
      value: 'month',
      label: 'Tento měsíc'
    },
    {
      value: 'year',
      label: 'Tento rok'
    },
    {
      value: 'all',
      label: 'Vše'
    }
  ]

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
        <Sidebar />

        <div className="flex-1 min-w-0 w-full p-4 lg:p-10">

          <div className="mb-6">
            <Link
              href="/dashboard"
              className="
                inline-flex
                items-center
                gap-2
                bg-white
                hover:bg-gray-50
                border
                px-4
                py-2
                rounded-xl
                shadow-sm
                font-medium
              "
            >
              <ArrowLeft size={18} />
              Dashboard
            </Link>
          </div>

          <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">

            <div>

              <h1 className="text-4xl lg:text-5xl font-black mb-2">
                Statistiky
              </h1>

              <p className="text-gray-500 text-lg">
                Interní přehled vytížení, výdělků a návratnosti strojů
              </p>

            </div>

            <div className="bg-white rounded-2xl shadow-sm p-2 flex flex-wrap gap-2">

              {periodButtons.map(
                item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      setPeriod(item.value)
                    }
                    className={`
                      px-4
                      py-3
                      rounded-xl
                      font-semibold
                      transition

                      ${period === item.value
                        ? 'bg-black text-white'
                        : 'text-gray-700 hover:bg-gray-100'}
                    `}
                  >
                    {item.label}
                  </button>
                )
              )}

            </div>

          </div>

          {errorMessage && (
            <div className="bg-red-50 text-red-700 rounded-2xl p-4 mb-6 font-semibold">
              {errorMessage}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-3xl shadow-lg p-8 text-center text-gray-500">
              Načítám statistiky...
            </div>
          ) : (
            <>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">

                <div className="bg-white rounded-3xl shadow-lg p-5">

                  <div className="flex items-center justify-between mb-4">

                    <div className="text-gray-500">
                      Počet půjček
                    </div>

                    <ClipboardList size={22} />

                  </div>

                  <div className="text-4xl font-black">
                    {totalRentals}
                  </div>

                </div>

                <div className="bg-white rounded-3xl shadow-lg p-5">

                  <div className="flex items-center justify-between mb-4">

                    <div className="text-gray-500">
                      Půjčovné
                    </div>

                    <Wallet size={22} />

                  </div>

                  <div className="text-3xl font-black">
                    {formatMoney(totalRevenue)}
                  </div>

                </div>

                <div className="bg-white rounded-3xl shadow-lg p-5">

                  <div className="flex items-center justify-between mb-4">

                    <div className="text-gray-500">
                      Pořizovací ceny
                    </div>

                    <TrendingUp size={22} />

                  </div>

                  <div className="text-3xl font-black">
                    {formatMoney(totalPurchasePrice)}
                  </div>

                </div>

                <div className="bg-white rounded-3xl shadow-lg p-5">

                  <div className="flex items-center justify-between mb-4">

                    <div className="text-gray-500">
                      Aktivní půjčky
                    </div>

                    <Activity size={22} />

                  </div>

                  <div className="text-4xl font-black">
                    {activeRentals}
                  </div>

                </div>

                <div className="bg-white rounded-3xl shadow-lg p-5">

                  <div className="flex items-center justify-between mb-4">

                    <div className="text-gray-500">
                      Návratnost celkem
                    </div>

                    <Wrench size={22} />

                  </div>

                  <div className="text-4xl font-black">
                    {Math.round(totalReturnPercent)} %
                  </div>

                </div>

              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">

                <div className="bg-black text-white rounded-3xl shadow-lg p-6">

                  <div className="flex items-center gap-3 mb-4">

                    <Crown size={24} />

                    <h2 className="text-xl font-bold">
                      Nejvýdělečnější
                    </h2>

                  </div>

                  <div className="text-2xl font-black mb-2">
                    {topRevenueMachine?.machineName || '-'}
                  </div>

                  <div className="text-gray-300">
                    {topRevenueMachine
                      ? formatMoney(topRevenueMachine.totalRevenue)
                      : 'Bez dat'}
                  </div>

                </div>

                <div className="bg-white rounded-3xl shadow-lg p-6">

                  <div className="flex items-center gap-3 mb-4">

                    <BarChart3 size={24} />

                    <h2 className="text-xl font-bold">
                      Nejčastěji půjčený
                    </h2>

                  </div>

                  <div className="text-2xl font-black mb-2">
                    {mostRentedMachine?.machineName || '-'}
                  </div>

                  <div className="text-gray-500">
                    {mostRentedMachine
                      ? `${mostRentedMachine.rentalCount}× půjčeno`
                      : 'Bez dat'}
                  </div>

                </div>

                <div className="bg-white rounded-3xl shadow-lg p-6">

                  <div className="flex items-center gap-3 mb-4">

                    <CalendarDays size={24} />

                    <h2 className="text-xl font-bold">
                      Nejlepší návratnost
                    </h2>

                  </div>

                  <div className="text-2xl font-black mb-2">
                    {bestReturnMachine?.machineName || '-'}
                  </div>

                  <div className="text-gray-500">
                    {bestReturnMachine
                      ? `${Math.round(bestReturnMachine.returnPercent)} %`
                      : 'Bez dat'}
                  </div>

                </div>

              </div>

              <section className="bg-white rounded-3xl shadow-lg overflow-hidden">

                <div className="p-6 border-b">

                  <h2 className="text-3xl font-black mb-2">
                    Výkon strojů
                  </h2>

                  <p className="text-gray-500">
                    Seřazeno podle celkového půjčovného.
                  </p>

                </div>

                {machineStats.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Pro vybrané období nejsou žádné půjčky.
                  </div>
                ) : (
                  <div className="overflow-x-auto">

                    <table className="w-full text-left">

                      <thead className="bg-gray-50 text-gray-500 text-sm">

                        <tr>

                          <th className="p-4 font-semibold">
                            Stroj
                          </th>

                          <th className="p-4 font-semibold text-right">
                            Půjčení
                          </th>

                          <th className="p-4 font-semibold text-right">
                            Dní
                          </th>

                          <th className="p-4 font-semibold text-right">
                            Pořizovací cena
                          </th>

                          <th className="p-4 font-semibold text-right">
                            Vydělal
                          </th>

                          <th className="p-4 font-semibold text-right">
                            Návratnost
                          </th>

                          <th className="p-4 font-semibold text-right">
                            Průměr
                          </th>

                          <th className="p-4 font-semibold text-right">
                            Pořízeno
                          </th>

                          <th className="p-4 font-semibold text-right">
                            Poslední
                          </th>

                        </tr>

                      </thead>

                      <tbody className="divide-y">

                        {machineStats.map(
                          item => (
                            <tr
                              key={item.machineId}
                              className="hover:bg-gray-50"
                            >

                              <td className="p-4 font-bold min-w-[220px]">
                                {item.machineName}
                              </td>

                              <td className="p-4 text-right font-semibold">
                                {item.rentalCount}×
                              </td>

                              <td className="p-4 text-right">
                                {item.totalDays}
                              </td>

                              <td className="p-4 text-right">
                                {item.purchasePrice > 0
                                  ? formatMoney(item.purchasePrice)
                                  : '-'}
                              </td>

                              <td className="p-4 text-right font-black">
                                {formatMoney(item.totalRevenue)}
                              </td>

                              <td className="p-4 text-right">
                                {item.purchasePrice > 0 ? (
                                  <span className={`
                                    inline-flex
                                    px-3
                                    py-1
                                    rounded-xl
                                    font-bold
                                    ${getReturnColor(item.returnPercent)}
                                  `}>
                                    {Math.round(item.returnPercent)} %
                                  </span>
                                ) : (
                                  <span className="text-gray-400">
                                    -
                                  </span>
                                )}
                              </td>

                              <td className="p-4 text-right">
                                {formatMoney(item.averageRevenue)}
                              </td>

                              <td className="p-4 text-right whitespace-nowrap text-gray-500">
                                {item.purchaseDate
                                  ? formatDate(item.purchaseDate)
                                  : '-'}
                              </td>

                              <td className="p-4 text-right whitespace-nowrap text-gray-500">
                                {formatDate(item.lastRentalDate)}
                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                    </table>

                  </div>
                )}

              </section>

            </>
          )}

        </div>
      </main>
    </AuthGuard>
  )
}
