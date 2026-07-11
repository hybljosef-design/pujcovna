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

    if (isMachineBlockedOnDate(day)) {
      setErrorMessage(
        'Tento den je obsazený. Vyberte zelený termín.'
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

    try {
      await fetch(
        '/api/push/reservation',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            machineName: machine.name,
            customerName:
              `${firstName.trim()} ${lastName.trim()}`,
            phone: phone.trim(),
            startDate: selectedStart,
            endDate: selectedEnd
          })
        }
      )
    } catch (pushError) {
      console.log(
        'Push oznámení se nepodařilo odeslat:',
        pushError
      )
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

  const nextDays = useMemo(() => {
    const days = []
    const today = startOfDay(new Date())

    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push(date)
    }

    return days
  }, [])

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

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {nextDays.map(day => {
              const blocked = isMachineBlockedOnDate(day)
              const value = toDateInputValue(day)

              const selected =
                selectedDates.includes(value)

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={blocked}
                  onClick={() => selectDay(day)}
                  className={`
                    rounded-2xl
                    p-4
                    text-center
                    border
                    font-bold
                    transition

                    ${blocked
                      ? 'bg-red-50 text-red-700 border-red-200 cursor-not-allowed'
                      : selected
                        ? 'bg-black text-white border-black'
                        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}
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
                      : selected
                        ? 'Vybráno'
                        : 'Volno'}
                  </div>
                </button>
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
