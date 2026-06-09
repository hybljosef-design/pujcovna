'use client'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import Link from 'next/link'

import { supabase } from '../../lib/supabase'

import {
  AlertTriangle,
  Phone,
  Search,
  Undo2,
  Wrench,
  User,
  Clock3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

type Rental = {
  id: string
  start_date: string
  end_date: string
  rental_price: number
  deposit: number

  customer: {
    first_name: string
    last_name: string
    phone: string
  }

  machine: {
    id: string
    name: string
    barcode?: string
    status?: string
  }
}

function isOverdue(
  value: string
) {

  const today =
    new Date()

  today.setHours(
    0,
    0,
    0,
    0
  )

  const end =
    new Date(value)

  end.setHours(
    0,
    0,
    0,
    0
  )

  return end < today
}

function formatDate(
  value: string
) {

  return new Date(
    value
  ).toLocaleDateString(
    'cs-CZ'
  )
}

function daysOverdue(
  value: string
) {

  const today =
    new Date()

  today.setHours(
    0,
    0,
    0,
    0
  )

  const end =
    new Date(value)

  end.setHours(
    0,
    0,
    0,
    0
  )

  const diff =
    today.getTime() -
    end.getTime()

  return Math.max(
    0,
    Math.ceil(
      diff /
      (
        1000 *
        60 *
        60 *
        24
      )
    )
  )
}

export default function OverduePage() {

  const [rentals, setRentals] =
    useState<Rental[]>([])

  const [loading, setLoading] =
    useState(true)

  const [search, setSearch] =
    useState('')

  const [statusMessage, setStatusMessage] =
    useState('')

  const [statusType, setStatusType] =
    useState<'success' | 'error' | ''>('')

  useEffect(() => {

    loadRentals()

  }, [])

  function showStatus(
    type: 'success' | 'error',
    message: string
  ) {

    setStatusType(type)

    setStatusMessage(message)

    setTimeout(() => {

      setStatusMessage('')

      setStatusType('')

    }, 3500)
  }

  async function loadRentals() {

    setLoading(true)

    const { data, error } =
      await supabase
        .from('rentals')
        .select(`
          *,
          customer:customers (
            first_name,
            last_name,
            phone
          ),
          machine:machines (
            id,
            name,
            barcode,
            status
          )
        `)
        .eq(
          'returned',
          false
        )
        .order(
          'end_date',
          {
            ascending: true
          }
        )

    if (error) {

      console.log(error)

      showStatus(
        'error',
        'Chyba načítání půjček po termínu'
      )

      setLoading(false)

      return
    }

    const overdueRentals =
      (data || []).filter(
        rental =>
          isOverdue(
            rental.end_date
          )
      ) as Rental[]

    setRentals(
      overdueRentals
    )

    setLoading(false)
  }

  async function returnRental(
    rental: Rental
  ) {

    const confirmed =
      confirm(
        `Opravdu vrátit stroj ${rental.machine.name}?`
      )

    if (!confirmed) return

    const { error: rentalError } =
      await supabase
        .from('rentals')
        .update({
          returned: true,
          returned_at:
            new Date().toISOString()
        })
        .eq(
          'id',
          rental.id
        )

    if (rentalError) {

      console.log(rentalError)

      showStatus(
        'error',
        'Chyba vrácení půjčky'
      )

      return
    }

    const { error: machineError } =
      await supabase
        .from('machines')
        .update({
          status: 'available'
        })
        .eq(
          'id',
          rental.machine.id
        )

    if (machineError) {

      console.log(machineError)

      showStatus(
        'error',
        'Chyba aktualizace stroje'
      )

      return
    }

    setRentals(prev =>
      prev.filter(
        item =>
          item.id !== rental.id
      )
    )

    showStatus(
      'success',
      `${rental.machine.name} vrácen`
    )
  }

  const filteredRentals =
    useMemo(() => {

      const value =
        search
          .toLowerCase()
          .trim()

      if (!value) {

        return rentals
      }

      return rentals.filter(
        rental => {

          return (
            rental.machine.name
              .toLowerCase()
              .includes(value) ||

            rental.customer.first_name
              .toLowerCase()
              .includes(value) ||

            rental.customer.last_name
              .toLowerCase()
              .includes(value) ||

            rental.customer.phone
              .toLowerCase()
              .includes(value)
          )
        }
      )

    }, [
      rentals,
      search
    ])

  return (

    <main className="min-h-screen bg-gray-100 p-4 lg:p-8">

      <div className="max-w-6xl mx-auto">

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

        {statusMessage && (

          <div
            className={`
              mb-6 rounded-2xl p-4 flex items-center gap-3 shadow-lg
              ${statusType === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'}
            `}
          >

            {statusType === 'success'
              ? <CheckCircle2 size={20} />
              : <AlertCircle size={20} />}

            <span className="font-medium">

              {statusMessage}

            </span>

          </div>

        )}

        <div className="
          flex
          flex-col
          lg:flex-row
          lg:items-center
          lg:justify-between
          gap-4
          mb-8
        ">

          <div>

            <div className="
              flex
              items-center
              gap-3
              mb-3
            ">

              <div className="
                bg-red-100
                text-red-700
                rounded-3xl
                p-4
              ">

                <AlertTriangle size={34} />

              </div>

              <div>

                <h1 className="
                  text-4xl
                  lg:text-5xl
                  font-bold
                ">

                  Po termínu

                </h1>

                <p className="
                  text-gray-500
                  text-lg
                  mt-2
                ">

                  Kontrola nevrácených strojů po termínu

                </p>

              </div>

            </div>

          </div>

          <Link
            href="/returns"
            className="
              bg-black
              hover:bg-gray-800
              transition
              text-white
              rounded-2xl
              px-6
              py-4
              font-semibold
              flex
              items-center
              justify-center
              gap-3
            "
          >

            <Undo2 size={20} />

            Otevřít vrácení

          </Link>

        </div>

        <div className="
          bg-white
          rounded-3xl
          shadow-lg
          p-6
          mb-6
        ">

          <div className="
            flex
            items-center
            justify-between
            gap-4
            flex-wrap
          ">

            <div>

              <p className="
                text-gray-500
                mb-2
              ">

                Počet půjček po termínu

              </p>

              <p className="
                text-5xl
                font-bold
                text-red-600
              ">

                {rentals.length}

              </p>

            </div>

            <div className="
              bg-red-50
              text-red-700
              px-5
              py-4
              rounded-2xl
              font-semibold
            ">

              {rentals.length === 0
                ? 'Aktuálně je vše v pořádku'
                : 'Nutná kontrola vrácení'}

            </div>

          </div>

        </div>

        <div className="
          bg-white
          rounded-3xl
          shadow-lg
          p-5
          mb-6
        ">

          <div className="relative">

            <Search
              size={20}
              className="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-gray-400
              "
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Vyhledat stroj, zákazníka nebo telefon..."
              className="
                w-full
                border
                rounded-2xl
                p-4
                pl-12
                text-lg
              "
            />

          </div>

        </div>

        <div className="grid gap-4">

          {loading && (

            <div className="
              bg-white
              rounded-3xl
              shadow-lg
              p-8
              text-center
              text-gray-500
            ">

              Načítám půjčky po termínu...

            </div>

          )}

          {!loading &&
            filteredRentals.length === 0 && (

            <div className="
              bg-white
              rounded-3xl
              shadow-lg
              p-10
              text-center
            ">

              <div className="
                text-5xl
                mb-4
              ">
                ✅
              </div>

              <h2 className="
                text-2xl
                font-bold
                mb-2
              ">

                Žádné stroje po termínu

              </h2>

              <p className="
                text-gray-500
              ">

                Aktuálně není žádná aktivní půjčka po datu vrácení.

              </p>

            </div>

          )}

          {!loading &&
            filteredRentals.map(
              rental => {

                const overdueDays =
                  daysOverdue(
                    rental.end_date
                  )

                return (

                  <div
                    key={rental.id}
                    className="
                      bg-white
                      rounded-3xl
                      shadow-lg
                      border-2
                      border-red-300
                      p-6
                    "
                  >

                    <div className="
                      flex
                      flex-col
                      xl:flex-row
                      xl:items-center
                      xl:justify-between
                      gap-5
                    ">

                      <div className="
                        grid
                        gap-4
                      ">

                        <div>

                          <div className="
                            flex
                            items-center
                            gap-2
                            text-sm
                            text-gray-500
                            mb-1
                          ">

                            <Wrench size={16} />

                            Stroj

                          </div>

                          <div className="
                            text-2xl
                            font-bold
                          ">

                            {rental.machine.name}

                          </div>

                        </div>

                        <div>

                          <div className="
                            flex
                            items-center
                            gap-2
                            text-sm
                            text-gray-500
                            mb-1
                          ">

                            <User size={16} />

                            Zákazník

                          </div>

                          <div className="
                            font-semibold
                            text-lg
                          ">

                            {rental.customer.first_name}
                            {' '}
                            {rental.customer.last_name}

                          </div>

                          {rental.customer.phone && (

                            <a
                              href={`tel:${rental.customer.phone}`}
                              className="
                                mt-3
                                inline-flex
                                items-center
                                gap-2
                                bg-black
                                text-white
                                px-4
                                py-2
                                rounded-xl
                                text-sm
                                font-semibold
                              "
                            >

                              <Phone size={16} />

                              {rental.customer.phone}

                            </a>

                          )}

                        </div>

                        <div>

                          <div className="
                            flex
                            items-center
                            gap-2
                            text-sm
                            text-gray-500
                            mb-1
                          ">

                            <Clock3 size={16} />

                            Termín vrácení

                          </div>

                          <div className="
                            font-semibold
                          ">

                            {formatDate(
                              rental.end_date
                            )}

                          </div>

                          <div className="
                            text-red-600
                            font-bold
                            mt-1
                          ">

                            {overdueDays}
                            {' '}
                            {overdueDays === 1
                              ? 'den po termínu'
                              : 'dnů po termínu'}

                          </div>

                        </div>

                      </div>

                      <button
                        onClick={() =>
                          returnRental(
                            rental
                          )
                        }
                        className="
                          bg-black
                          hover:bg-gray-800
                          transition
                          text-white
                          px-6
                          py-5
                          rounded-2xl
                          text-lg
                          font-semibold
                          min-w-[240px]
                        "
                      >

                        Vrátit stroj

                      </button>

                    </div>

                  </div>

                )
              }
            )}

        </div>

      </div>

    </main>
  )
}
