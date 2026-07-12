'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RotateCcw,
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
  status?: string | null
}

function startOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function startOfMonth(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  )
}

function addMonths(
  date: Date,
  amount: number
) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + amount,
    1
  )
}

function isSameDay(
  first: Date,
  second: Date
) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  )
}

function isDateBeforeToday(date: Date) {
  return (
    startOfDay(date).getTime() <
    startOfDay(new Date()).getTime()
  )
}

function formatDate(date: Date) {
  return date.toLocaleDateString('cs-CZ')
}

function toDateInputValue(date: Date) {
  const offset = date.getTimezoneOffset()
  const local = new Date(
    date.getTime() -
    offset * 60 * 1000
  )

  return local
    .toISOString()
    .slice(0, 10)
}

function isDateInRange(date: Date, start: string, end: string) {
  const day = startOfDay(date).getTime()
  const rangeStart = startOfDay(new Date(start)).getTime()
  const rangeEnd = startOfDay(new Date(end)).getTime()

  return day >= rangeStart && day <= rangeEnd
}

function getDaysBetween(start: string, end: string) {
  const startDate = startOfDay(new Date(start))
  const endDate = startOfDay(new Date(end))
  const diff = endDate.getTime() - startDate.getTime()

  return Math.max(
    1,
    Math.ceil(
      diff / (
        1000 *
        60 *
        60 *
        24
      )
    ) + 1
  )
}

export default function PublicMachineDetailPage() {
  const params = useParams()
  const machineId = String(params.id || '')

  const [machine, setMachine] = useState<Machine | null>(null)
  const [rentals, setRentals] = useState<Rental[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedStart, setSelectedStart] = useState('')
  const [selectedEnd, setSelectedEnd] = useState('')
  const [selectedDates, setSelectedDates] = useState<string[]>([])

  const [calendarMonth, setCalendarMonth] =
    useState(
      startOfMonth(new Date())
    )

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')

  const [sending, setSending] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

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
            cancelled,
            status
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

  function getDateStatus(date: Date) {
    const rentalBlocked = rentals.some(
      rental =>
        isDateInRange(
          date,
          rental.start_date,
          rental.end_date
        )
    )

    if (rentalBlocked) {
      return 'rental'
    }

    const reservationBlocked = reservations.some(
      reservation =>
        isDateInRange(
          date,
          reservation.start_date,
          reservation.end_date
        )
    )

    if (reservationBlocked) {
      return 'reservation'
    }

    if (isDateBeforeToday(date)) {
      return 'past'
    }

    return 'available'
  }

  function isMachineBlockedOnDate(date: Date) {
    const status = getDateStatus(date)

    return (
      status === 'rental' ||
      status === 'reservation' ||
      status === 'past'
    )
  }

  function hasBlockedDateInSelection(start: string, end: string) {
    if (!start || !end) return true

    const startDate = startOfDay(new Date(start))
    const endDate = startOfDay(new Date(end))

    if (endDate < startDate) return true

    const current = new Date(startDate)

    while (current <= endDate) {
      if (isMachineBlockedOnDate(current)) {
        return true
      }

      current.setDate(
        current.getDate() + 1
      )
    }

    return false
  }

  function getDateRangeValues(
    start: string,
    end: string
  ) {
    const result: string[] = []

    const startDate = startOfDay(
      new Date(start)
    )

    const endDate = startOfDay(
      new Date(end)
    )

    const current =
      new Date(startDate)

    while (current <= endDate) {
      result.push(
        toDateInputValue(current)
      )

      current.setDate(
        current.getDate() + 1
      )
    }

    return result
  }

  function applySelectedDates(
    values: string[]
  ) {
    const sorted =
      [...values].sort(
        (a, b) =>
          new Date(a).getTime() -
          new Date(b).getTime()
      )

    setSelectedDates(sorted)

    setSelectedStart(
      sorted[0] || ''
    )

    setSelectedEnd(
      sorted[sorted.length - 1] || ''
    )
  }

  function selectDay(day: Date) {
    setSuccessMessage('')
    setErrorMessage('')

    const dayStatus =
      getDateStatus(day)

    if (dayStatus === 'past') {
      setErrorMessage(
        'Minulé datum nelze vybrat.'
      )
      return
    }

    if (
      dayStatus === 'rental' ||
      dayStatus === 'reservation'
    ) {
      setErrorMessage(
        dayStatus === 'rental'
          ? 'Tento den je stroj zapůjčený.'
          : 'Tento den je už rezervovaný.'
      )
      return
    }

    const value =
      toDateInputValue(day)

    if (selectedDates.includes(value)) {
      const next =
        selectedDates.filter(
          item => item !== value
        )

      applySelectedDates(next)

      return
    }

    if (selectedDates.length === 0) {
      applySelectedDates([
        value
      ])

      return
    }

    const currentStart =
      selectedStart || selectedDates[0]

    const rangeStart =
      new Date(value) <
      new Date(currentStart)
        ? value
        : currentStart

    const rangeEnd =
      new Date(value) >
      new Date(selectedEnd || currentStart)
        ? value
        : selectedEnd || currentStart

    if (
      hasBlockedDateInSelection(
        rangeStart,
        rangeEnd
      )
    ) {
      setErrorMessage(
        'Vybraný rozsah obsahuje obsazený den. Vyberte kratší termín.'
      )

      return
    }

    const rangeValues =
      getDateRangeValues(
        rangeStart,
        rangeEnd
      )

    applySelectedDates(
      rangeValues
    )
  }

  async function submitReservation() {
    setSuccessMessage('')
    setErrorMessage('')

    if (!machine) return

    if (selectedDates.length === 0) {
      setErrorMessage(
        'Vyberte v kalendáři alespoň jeden den rezervace.'
      )
      return
    }

    if (hasBlockedDateInSelection(selectedStart, selectedEnd)) {
      setErrorMessage(
        'Vybraný termín už není dostupný. Obnovte stránku a vyberte jiný termín.'
      )
      return
    }

    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setErrorMessage(
        'Vyplňte jméno, příjmení a telefon.'
      )
      return
    }

    setSending(true)

    let customerId = ''

    const { data: existingCustomer, error: existingError } =
      await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone.trim())
        .maybeSingle()

    if (existingError) {
      console.log(existingError)
    }

    if (existingCustomer) {
      customerId = existingCustomer.id

      const { error: updateCustomerError } =
        await supabase
          .from('customers')
          .update({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
            email: email.trim() || null
          })
          .eq('id', customerId)

      if (updateCustomerError) {
        console.log(updateCustomerError)
      }
    } else {
      const { data: customer, error: customerError } =
        await supabase
          .from('customers')
          .insert([
            {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              phone: phone.trim(),
              email: email.trim() || null
            }
          ])
          .select()
          .single()

      if (customerError) {
        console.log(customerError)
        setErrorMessage(
          'Rezervaci se nepodařilo odeslat. Zkuste to prosím znovu.'
        )
        setSending(false)
        return
      }

      customerId = customer.id
    }

    const onlineNote = [
      'Online rezervace ze zákaznické půjčovny.',
      note.trim()
        ? `Poznámka zákazníka: ${note.trim()}`
        : ''
    ]
      .filter(Boolean)
      .join('\n')

    const { error: reservationError } =
      await supabase
        .from('reservations')
        .insert([
          {
            machine_id: machine.id,
            customer_id: customerId,
            start_date: selectedStart,
            end_date: selectedEnd,
            note: onlineNote,
            cancelled: false,
            status: 'pending',
            source: 'online'
          }
        ])

    if (reservationError) {
      console.log(reservationError)
      setErrorMessage(
        'Rezervaci se nepodařilo odeslat. Zkontrolujte údaje a zkuste to znovu.'
      )
      setSending(false)
      return
    }

    setSuccessMessage(
      'Rezervace byla odeslána. Ozveme se vám pro potvrzení termínu.'
    )

    setFirstName('')
    setLastName('')
    setPhone('')
    setEmail('')
    setNote('')
    setSelectedStart('')
    setSelectedEnd('')
    setSelectedDates([])

    await loadData()

    setSending(false)
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

  const calendarDays = useMemo(() => {
    const firstDay =
      startOfMonth(calendarMonth)

    const firstWeekday =
      (firstDay.getDay() + 6) % 7

    const gridStart =
      new Date(firstDay)

    gridStart.setDate(
      firstDay.getDate() - firstWeekday
    )

    const days: Date[] = []

    for (let i = 0; i < 42; i++) {
      const date =
        new Date(gridStart)

      date.setDate(
        gridStart.getDate() + i
      )

      days.push(date)
    }

    return days
  }, [calendarMonth])

  const canGoToPreviousMonth =
    startOfMonth(calendarMonth).getTime() >
    startOfMonth(new Date()).getTime()

  function goToPreviousMonth() {
    if (!canGoToPreviousMonth) return

    setCalendarMonth(
      value => addMonths(value, -1)
    )
  }

  function goToNextMonth() {
    setCalendarMonth(
      value => addMonths(value, 1)
    )
  }

  function clearSelectedDates() {
    setSelectedStart('')
    setSelectedEnd('')
    setSelectedDates([])
    setErrorMessage('')
    setSuccessMessage('')
  }

  const selectedDays =
    selectedDates.length

  const calculatedPrice =
    machine && selectedDays
      ? machine.daily_price * selectedDays
      : 0

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
            Vyberte termín
          </h2>

          <p className="text-gray-500 mb-6">
            Zelené dny jsou volné, červené jsou obsazené. Vyberte jeden den, více dní postupně, nebo klikněte na první a poslední den delšího termínu.
          </p>

          <div className="border rounded-3xl overflow-hidden">

            <div className="
              flex
              items-center
              justify-between
              gap-4
              p-4
              lg:p-5
              border-b
              bg-gray-50
            ">

              <button
                type="button"
                onClick={goToPreviousMonth}
                disabled={!canGoToPreviousMonth}
                className="
                  rounded-2xl
                  p-3
                  bg-white
                  border
                  hover:bg-gray-100
                  disabled:opacity-30
                  disabled:cursor-not-allowed
                  transition
                "
              >
                <ChevronLeft size={22} />
              </button>

              <h3 className="
                text-xl
                lg:text-2xl
                font-black
                capitalize
                text-center
              ">
                {calendarMonth.toLocaleDateString(
                  'cs-CZ',
                  {
                    month: 'long',
                    year: 'numeric'
                  }
                )}
              </h3>

              <button
                type="button"
                onClick={goToNextMonth}
                className="
                  rounded-2xl
                  p-3
                  bg-white
                  border
                  hover:bg-gray-100
                  transition
                "
              >
                <ChevronRight size={22} />
              </button>

            </div>

            <div className="grid grid-cols-7 border-b bg-white">
              {['Po','Út','St','Čt','Pá','So','Ne'].map(dayName => (
                <div key={dayName} className="py-3 text-center text-sm font-bold text-gray-500">
                  {dayName}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 bg-gray-200 gap-px">
              {calendarDays.map(day => {
                const value = toDateInputValue(day)
                const selected = selectedDates.includes(value)
                const status = getDateStatus(day)
                const currentMonth = day.getMonth() === calendarMonth.getMonth()
                const today = isSameDay(day, new Date())
                const disabled = status !== 'available'
                const statusLabel =
                  status === 'rental'
                    ? 'Půjčeno'
                    : status === 'reservation'
                      ? 'Rezervace'
                      : status === 'past'
                        ? 'Minulost'
                        : 'Volno'

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectDay(day)}
                    className={`
                      min-h-[82px]
                      lg:min-h-[98px]
                      p-2
                      lg:p-3
                      text-left
                      transition
                      relative
                      ${!currentMonth ? 'opacity-35' : ''}
                      ${selected
                        ? 'bg-black text-white'
                        : status === 'rental'
                          ? 'bg-red-100 text-red-800 cursor-not-allowed'
                          : status === 'reservation'
                            ? 'bg-amber-100 text-amber-800 cursor-not-allowed'
                            : status === 'past'
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-green-50 text-green-800 hover:bg-green-100'}
                    `}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-lg lg:text-xl font-black">
                        {day.getDate()}
                      </span>
                      {today && (
                        <span className={`text-[10px] lg:text-xs rounded-full px-2 py-1 font-bold ${selected ? 'bg-white text-black' : 'bg-black text-white'}`}>
                          Dnes
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-[10px] lg:text-xs font-bold leading-tight">
                      {selected ? 'Vybráno' : statusLabel}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-5 text-sm font-semibold">
            <div className="inline-flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-100 border border-green-300" />Volno</div>
            <div className="inline-flex items-center gap-2"><span className="w-4 h-4 rounded bg-amber-100 border border-amber-300" />Rezervace</div>
            <div className="inline-flex items-center gap-2"><span className="w-4 h-4 rounded bg-red-100 border border-red-300" />Půjčeno</div>
            <div className="inline-flex items-center gap-2"><span className="w-4 h-4 rounded bg-gray-100 border border-gray-300" />Minulost</div>
            <div className="inline-flex items-center gap-2"><span className="w-4 h-4 rounded bg-black" />Vybráno</div>
          </div>

          {selectedDates.length > 0 && (
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-black text-white rounded-2xl p-4">
              <div>
                <div className="text-sm text-gray-300">Vybraný termín</div>
                <div className="text-lg font-black">
                  {selectedStart === selectedEnd
                    ? formatDate(new Date(selectedStart))
                    : `${formatDate(new Date(selectedStart))} – ${formatDate(new Date(selectedEnd))}`}
                </div>
              </div>
              <button
                type="button"
                onClick={clearSelectedDates}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black px-4 py-3 font-bold"
              >
                <RotateCcw size={18} />
                Zrušit výběr
              </button>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <CalendarDays size={24} />

              <h2 className="text-2xl font-black">
                Rezervace
              </h2>
            </div>

            {selectedDates.length > 0 ? (
              <div className="bg-gray-100 rounded-2xl p-4 mb-5">
                <p className="font-bold mb-1">
                  Vybraný termín
                </p>

                <p className="text-gray-600">
                  {selectedStart && selectedEnd && selectedStart !== selectedEnd
                    ? `${formatDate(new Date(selectedStart))} – ${formatDate(new Date(selectedEnd))}`
                    : selectedStart
                      ? formatDate(new Date(selectedStart))
                      : ''}
                </p>

                <p className="text-gray-600 mt-2">
                  Předběžná cena: <strong>{calculatedPrice} Kč</strong>
                </p>

                <p className="text-gray-600">
                  Kauce: <strong>{machine.deposit} Kč</strong>
                </p>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-2xl p-4 mb-5 text-gray-500">
                Vyberte v kalendáři jeden nebo více volných dní.
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-50 text-red-700 rounded-2xl p-4 mb-4 font-semibold">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 text-green-700 rounded-2xl p-4 mb-4 font-semibold">
                {successMessage}
              </div>
            )}

            <div className="grid gap-4">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jméno"
                className="w-full border rounded-2xl p-4"
              />

              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Příjmení"
                className="w-full border rounded-2xl p-4"
              />

              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefon"
                className="w-full border rounded-2xl p-4"
              />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail volitelně"
                className="w-full border rounded-2xl p-4"
              />

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Poznámka k rezervaci"
                rows={3}
                className="w-full border rounded-2xl p-4"
              />

              <button
                type="button"
                onClick={submitReservation}
                disabled={sending}
                className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 transition text-white rounded-2xl p-4 font-bold text-lg"
              >
                {sending
                  ? 'Odesílám rezervaci...'
                  : 'Odeslat rezervaci'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck size={24} />

              <h2 className="text-2xl font-black">
                Jak to funguje
              </h2>
            </div>

            <ul className="space-y-3 text-gray-600">
              <li>• Rezervace je nezávazná do potvrzení obsluhou.</li>
              <li>• Po odeslání vás kontaktujeme.</li>
              <li>• Cena se může upravit podle skutečné dohody.</li>
              <li>• Videonávody ke stroji připravujeme.</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  )
}
