'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Filter,
  Phone,
  RotateCcw,
  User,
  Wrench
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

type Customer = {
  first_name: string
  last_name: string
  phone?: string | null
}

type Machine = {
  id?: string
  name: string
}

type Rental = {
  id: string
  machine_id: string
  start_date: string
  end_date: string
  returned: boolean
  customers: Customer | Customer[] | null
  machines: Machine | Machine[] | null
}

type Reservation = {
  id: string
  machine_id: string
  start_date: string
  end_date: string
  cancelled: boolean
  status?: string | null
  source?: string | null
  customers: Customer | Customer[] | null
  machines: Machine | Machine[] | null
}

type CalendarItem = {
  id: string
  type: 'rental' | 'reservation'
  machineId: string
  machineName: string
  customerName: string
  phone: string
  startDate: string
  endDate: string
  statusLabel: string
  overdue: boolean
}

function startOfDay(value: Date) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function startOfMonth(value: Date) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    1
  )
}

function addMonths(
  value: Date,
  amount: number
) {
  return new Date(
    value.getFullYear(),
    value.getMonth() + amount,
    1
  )
}

function toDateKey(value: Date) {
  const year = value.getFullYear()
  const month = String(
    value.getMonth() + 1
  ).padStart(2, '0')
  const day = String(
    value.getDate()
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function isDateInRange(
  date: Date,
  start: string,
  end: string
) {
  const value =
    startOfDay(date).getTime()

  const startValue =
    startOfDay(
      new Date(start)
    ).getTime()

  const endValue =
    startOfDay(
      new Date(end)
    ).getTime()

  return (
    value >= startValue &&
    value <= endValue
  )
}

function isOverdue(value: string) {
  return (
    startOfDay(
      new Date(value)
    ).getTime() <
    startOfDay(
      new Date()
    ).getTime()
  )
}

function formatDateTime(value: string) {
  return new Date(
    value
  ).toLocaleString(
    'cs-CZ',
    {
      dateStyle: 'short',
      timeStyle: 'short'
    }
  )
}

function getCustomer(
  relation: Customer | Customer[] | null
) {
  if (Array.isArray(relation)) {
    return relation[0] || null
  }

  return relation
}

function getMachine(
  relation: Machine | Machine[] | null
) {
  if (Array.isArray(relation)) {
    return relation[0] || null
  }

  return relation
}

export default function CalendarPage() {
  const [rentals, setRentals] =
    useState<Rental[]>([])

  const [reservations, setReservations] =
    useState<Reservation[]>([])

  const [loading, setLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [calendarMonth, setCalendarMonth] =
    useState(
      startOfMonth(new Date())
    )

  const [selectedMachineId, setSelectedMachineId] =
    useState('all')

  const [selectedDate, setSelectedDate] =
    useState<string | null>(null)

  useEffect(() => {
    loadCalendarData()
  }, [])

  async function loadCalendarData() {
    setLoading(true)
    setErrorMessage('')

    const [
      rentalsResult,
      reservationsResult
    ] = await Promise.all([
      supabase
        .from('rentals')
        .select(`
          id,
          machine_id,
          start_date,
          end_date,
          returned,
          customers (
            first_name,
            last_name,
            phone
          ),
          machines (
            id,
            name
          )
        `)
        .eq('returned', false)
        .order('start_date', {
          ascending: true
        }),

      supabase
        .from('reservations')
        .select(`
          id,
          machine_id,
          start_date,
          end_date,
          cancelled,
          status,
          source,
          customers (
            first_name,
            last_name,
            phone
          ),
          machines (
            id,
            name
          )
        `)
        .eq('cancelled', false)
        .order('start_date', {
          ascending: true
        })
    ])

    if (
      rentalsResult.error ||
      reservationsResult.error
    ) {
      console.log(
        rentalsResult.error ||
        reservationsResult.error
      )

      setErrorMessage(
        'Kalendář se nepodařilo načíst.'
      )

      setLoading(false)
      return
    }

    setRentals(
      (rentalsResult.data || []) as unknown as Rental[]
    )

    setReservations(
      (reservationsResult.data || []) as unknown as Reservation[]
    )

    setLoading(false)
  }

  const allItems =
    useMemo<CalendarItem[]>(
      () => {
        const rentalItems =
          rentals.map(
            rental => {
              const customer =
                getCustomer(
                  rental.customers
                )

              const machine =
                getMachine(
                  rental.machines
                )

              return {
                id: rental.id,
                type: 'rental' as const,
                machineId:
                  rental.machine_id,
                machineName:
                  machine?.name ||
                  'Neznámý stroj',
                customerName:
                  customer
                    ? `${customer.first_name} ${customer.last_name}`
                    : 'Neznámý zákazník',
                phone:
                  customer?.phone || '',
                startDate:
                  rental.start_date,
                endDate:
                  rental.end_date,
                statusLabel:
                  isOverdue(
                    rental.end_date
                  )
                    ? 'Po termínu'
                    : 'Aktivní půjčka',
                overdue:
                  isOverdue(
                    rental.end_date
                  )
              }
            }
          )

        const reservationItems =
          reservations.map(
            reservation => {
              const customer =
                getCustomer(
                  reservation.customers
                )

              const machine =
                getMachine(
                  reservation.machines
                )

              return {
                id: reservation.id,
                type:
                  'reservation' as const,
                machineId:
                  reservation.machine_id,
                machineName:
                  machine?.name ||
                  'Neznámý stroj',
                customerName:
                  customer
                    ? `${customer.first_name} ${customer.last_name}`
                    : 'Neznámý zákazník',
                phone:
                  customer?.phone || '',
                startDate:
                  reservation.start_date,
                endDate:
                  reservation.end_date,
                statusLabel:
                  reservation.status === 'pending'
                    ? 'Čeká na potvrzení'
                    : 'Rezervace',
                overdue: false
              }
            }
          )

        return [
          ...rentalItems,
          ...reservationItems
        ].sort(
          (a, b) =>
            new Date(
              a.startDate
            ).getTime() -
            new Date(
              b.startDate
            ).getTime()
        )
      },
      [
        rentals,
        reservations
      ]
    )

  const machineOptions =
    useMemo(
      () => {
        const map =
          new Map<string, string>()

        allItems.forEach(
          item => {
            map.set(
              item.machineId,
              item.machineName
            )
          }
        )

        return Array.from(
          map.entries()
        )
          .map(
            ([id, name]) => ({
              id,
              name
            })
          )
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name,
                'cs'
              )
          )
      },
      [allItems]
    )

  const filteredItems =
    useMemo(
      () => {
        if (
          selectedMachineId === 'all'
        ) {
          return allItems
        }

        return allItems.filter(
          item =>
            item.machineId ===
            selectedMachineId
        )
      },
      [
        allItems,
        selectedMachineId
      ]
    )

  const calendarDays =
    useMemo(
      () => {
        const firstDay =
          startOfMonth(
            calendarMonth
          )

        const weekday =
          (
            firstDay.getDay() +
            6
          ) % 7

        const gridStart =
          new Date(firstDay)

        gridStart.setDate(
          firstDay.getDate() -
          weekday
        )

        const days: Date[] = []

        for (
          let index = 0;
          index < 42;
          index++
        ) {
          const date =
            new Date(gridStart)

          date.setDate(
            gridStart.getDate() +
            index
          )

          days.push(date)
        }

        return days
      },
      [calendarMonth]
    )

  const visibleItems =
    useMemo(
      () => {
        if (selectedDate) {
          return filteredItems.filter(
            item =>
              isDateInRange(
                new Date(selectedDate),
                item.startDate,
                item.endDate
              )
          )
        }

        return filteredItems.filter(
          item => {
            const monthStart =
              startOfMonth(
                calendarMonth
              )

            const monthEnd =
              addMonths(
                monthStart,
                1
              )

            const itemStart =
              new Date(
                item.startDate
              )

            const itemEnd =
              new Date(
                item.endDate
              )

            return (
              itemStart < monthEnd &&
              itemEnd >= monthStart
            )
          }
        )
      },
      [
        filteredItems,
        selectedDate,
        calendarMonth
      ]
    )

  function resetFilters() {
    setSelectedMachineId('all')
    setSelectedDate(null)
    setCalendarMonth(
      startOfMonth(
        new Date()
      )
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6 lg:p-10">
        <div className="max-w-7xl mx-auto">
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
    <main className="min-h-screen bg-gray-100 p-4 lg:p-10">

      <div className="max-w-7xl mx-auto">

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
            🏠 Domů
          </Link>
        </div>

        <div className="flex items-center gap-4 mb-8">

          <div className="bg-black text-white p-4 rounded-3xl">
            <CalendarDays size={36} />
          </div>

          <div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-2">
              Kalendář půjček
            </h1>

            <p className="text-gray-500 text-lg">
              Půjčky, rezervace a obsazenost strojů
            </p>
          </div>

        </div>

        {errorMessage && (
          <div className="
            bg-red-50
            text-red-700
            rounded-2xl
            p-4
            mb-6
            font-semibold
          ">
            {errorMessage}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-lg p-5 lg:p-6 mb-6">

          <div className="flex flex-col lg:flex-row lg:items-end gap-4">

            <div className="flex-1">
              <label className="flex items-center gap-2 font-semibold mb-2">
                <Filter size={18} />
                Stroj
              </label>

              <select
                value={selectedMachineId}
                onChange={(event) =>
                  setSelectedMachineId(
                    event.target.value
                  )
                }
                className="
                  w-full
                  border
                  rounded-2xl
                  p-4
                  bg-white
                  text-lg
                "
              >
                <option value="all">
                  Všechny stroje
                </option>

                {machineOptions.map(
                  machine => (
                    <option
                      key={machine.id}
                      value={machine.id}
                    >
                      {machine.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                bg-gray-100
                hover:bg-gray-200
                rounded-2xl
                px-5
                py-4
                font-semibold
              "
            >
              <RotateCcw size={18} />
              Obnovit
            </button>

          </div>

        </div>

        <div className="bg-white rounded-3xl shadow-lg overflow-hidden mb-6">

          <div className="
            flex
            items-center
            justify-between
            gap-4
            p-4
            lg:p-6
            border-b
            bg-gray-50
          ">

            <button
              type="button"
              onClick={() =>
                setCalendarMonth(
                  value =>
                    addMonths(
                      value,
                      -1
                    )
                )
              }
              className="bg-white hover:bg-gray-100 border rounded-2xl p-3"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="text-center">
              <h2 className="text-2xl lg:text-3xl font-black capitalize">
                {calendarMonth.toLocaleDateString(
                  'cs-CZ',
                  {
                    month: 'long',
                    year: 'numeric'
                  }
                )}
              </h2>

              {selectedDate && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDate(null)
                  }
                  className="text-sm text-blue-600 font-semibold mt-1"
                >
                  Zrušit výběr dne
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setCalendarMonth(
                  value =>
                    addMonths(
                      value,
                      1
                    )
                )
              }
              className="bg-white hover:bg-gray-100 border rounded-2xl p-3"
            >
              <ChevronRight size={24} />
            </button>

          </div>

          <div className="grid grid-cols-7 border-b">
            {[
              'Po',
              'Út',
              'St',
              'Čt',
              'Pá',
              'So',
              'Ne'
            ].map(
              day => (
                <div
                  key={day}
                  className="py-3 text-center font-bold text-gray-500"
                >
                  {day}
                </div>
              )
            )}
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200">

            {calendarDays.map(
              day => {
                const dayKey =
                  toDateKey(day)

                const dayItems =
                  filteredItems.filter(
                    item =>
                      isDateInRange(
                        day,
                        item.startDate,
                        item.endDate
                      )
                  )

                const currentMonth =
                  day.getMonth() ===
                  calendarMonth.getMonth()

                const selected =
                  selectedDate ===
                  dayKey

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() =>
                      setSelectedDate(
                        selected
                          ? null
                          : dayKey
                      )
                    }
                    className={`
                      min-h-[92px]
                      lg:min-h-[130px]
                      bg-white
                      p-2
                      lg:p-3
                      text-left
                      transition
                      hover:bg-gray-50

                      ${!currentMonth
                        ? 'opacity-35'
                        : ''}

                      ${selected
                        ? 'ring-4 ring-black ring-inset'
                        : ''}
                    `}
                  >

                    <div className="font-black text-lg mb-2">
                      {day.getDate()}
                    </div>

                    <div className="space-y-1">

                      {dayItems
                        .slice(0, 3)
                        .map(
                          item => (
                            <div
                              key={`${item.type}-${item.id}`}
                              className={`
                                rounded-lg
                                px-2
                                py-1
                                text-[10px]
                                lg:text-xs
                                font-bold
                                truncate

                                ${item.type === 'rental'
                                  ? item.overdue
                                    ? 'bg-red-600 text-white'
                                    : 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'}
                              `}
                              title={`${item.machineName} – ${item.customerName}`}
                            >
                              {item.machineName}
                            </div>
                          )
                        )}

                      {dayItems.length > 3 && (
                        <div className="text-xs font-bold text-gray-500">
                          +{dayItems.length - 3} další
                        </div>
                      )}

                    </div>

                  </button>
                )
              }
            )}

          </div>

        </div>

        <div className="flex flex-wrap gap-3 mb-6 text-sm font-semibold">

          <div className="inline-flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-red-100 border border-red-300" />
            Aktivní půjčka
          </div>

          <div className="inline-flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-amber-100 border border-amber-300" />
            Rezervace
          </div>

          <div className="inline-flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-red-600" />
            Po termínu
          </div>

        </div>

        <section className="bg-white rounded-3xl shadow-lg overflow-hidden">

          <div className="p-5 lg:p-6 border-b">
            <h2 className="text-2xl lg:text-3xl font-black">
              {selectedDate
                ? `Události dne ${new Date(
                    `${selectedDate}T12:00:00`
                  ).toLocaleDateString(
                    'cs-CZ'
                  )}`
                : 'Přehled v měsíci'}
            </h2>

            <p className="text-gray-500 mt-1">
              {visibleItems.length} položek
            </p>
          </div>

          {visibleItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Pro vybraný termín nejsou žádné půjčky ani rezervace.
            </div>
          ) : (
            <div className="divide-y">

              {visibleItems.map(
                item => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="
                      p-5
                      lg:p-6
                      grid
                      gap-4
                      lg:grid-cols-[1.2fr_1fr_1fr_auto]
                      lg:items-center
                    "
                  >

                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        {item.type === 'rental'
                          ? <Wrench size={16} />
                          : <ClipboardList size={16} />}

                        {item.type === 'rental'
                          ? 'Půjčka'
                          : 'Rezervace'}
                      </div>

                      <div className="text-xl font-bold">
                        {item.machineName}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <User size={16} />
                        Zákazník
                      </div>

                      <div className="font-semibold">
                        {item.customerName}
                      </div>

                      {item.phone && (
                        <a
                          href={`tel:${item.phone}`}
                          className="
                            inline-flex
                            items-center
                            gap-2
                            mt-2
                            bg-black
                            text-white
                            rounded-xl
                            px-3
                            py-2
                            text-sm
                            font-semibold
                          "
                        >
                          <Phone size={15} />
                          {item.phone}
                        </a>
                      )}
                    </div>

                    <div>
                      <div className="text-sm text-gray-500 mb-1">
                        Termín
                      </div>

                      <div className="font-semibold">
                        {formatDateTime(
                          item.startDate
                        )}
                      </div>

                      <div className="text-gray-500 text-sm">
                        až {formatDateTime(
                          item.endDate
                        )}
                      </div>
                    </div>

                    <div className="flex lg:justify-end">
                      <span className={`
                        inline-flex
                        items-center
                        gap-2
                        rounded-2xl
                        px-4
                        py-3
                        font-bold

                        ${item.type === 'rental'
                          ? item.overdue
                            ? 'bg-red-600 text-white'
                            : 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'}
                      `}>
                        {item.overdue && (
                          <AlertTriangle size={18} />
                        )}

                        {item.statusLabel}
                      </span>
                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </section>

      </div>

    </main>
  )
}
