'use client'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import { supabase } from '../../lib/supabase'

import { Html5QrcodeScanner } from 'html5-qrcode'

import {
  QrCode,
  Undo2,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Search
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

export default function ReturnsPage() {

  const [rentals, setRentals] =
    useState<Rental[]>([])

  const [scannerOpen, setScannerOpen] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  const [search, setSearch] =
    useState('')

  const [statusMessage, setStatusMessage] =
    useState('')

  const [statusType, setStatusType] =
    useState<'success' | 'error' | ''>('')

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

  useEffect(() => {

    loadRentals()

  }, [])

  useEffect(() => {

    if (!scannerOpen) return

    const scanner = new Html5QrcodeScanner(
      'return-reader',
      {
        fps: 10,
        qrbox: {
          width: 260,
          height: 260
        }
      },
      false
    )

    scanner.render(

      async (decodedText) => {

        const rental =
          rentals.find(
            (rental) =>
              rental.machine.barcode?.toLowerCase() ===
              decodedText.toLowerCase()
          )

        if (!rental) {

          showStatus(
            'error',
            'Aktivní půjčka nenalezena'
          )

          return
        }

        setScannerOpen(false)

        scanner.clear()

        await returnRental(rental)

      },

      () => {}
    )

    return () => {
      scanner.clear().catch(() => {})
    }

  }, [scannerOpen, rentals])

  async function loadRentals() {

    setLoading(true)

    const { data, error } = await supabase
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
      .eq('returned', false)
      .order('start_date', {
        ascending: false
      })

    if (error) {

      console.log(error)

      showStatus(
        'error',
        'Chyba načítání půjček'
      )

      setLoading(false)

      return
    }

    setRentals(data || [])

    setLoading(false)
  }

  async function returnRental(
    rental: Rental
  ) {

    const { error: rentalError } =
      await supabase
        .from('rentals')
        .update({
          returned: true,
          returned_at:
            new Date().toISOString()
        })
        .eq('id', rental.id)

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

  const overdueRentals =
    useMemo(() => {

      return rentals.filter(
        rental =>
          new Date(rental.end_date) <
          new Date()
      )

    }, [rentals])

  const filteredRentals =
    useMemo(() => {

      return rentals.filter(
        rental => {

          const value =
            search.toLowerCase()

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

    }, [rentals, search])

  return (

    <main className="
      min-h-screen
      bg-gray-100
      p-4
      lg:p-8
    ">

      <div className="
        max-w-5xl
        mx-auto
      ">

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

            <h1 className="
              text-4xl
              lg:text-5xl
              font-bold
              mb-2
            ">

              Vrácení strojů

            </h1>

            <p className="text-gray-500">

              Express vrácení půjček

            </p>

          </div>

          <button
            onClick={() =>
              setScannerOpen(!scannerOpen)
            }
            className="
              bg-black
              hover:bg-gray-800
              transition
              text-white
              px-6
              py-5
              rounded-2xl
              flex
              items-center
              justify-center
              gap-3
              text-lg
              font-semibold
            "
          >

            <QrCode size={24} />

            {scannerOpen
              ? 'Zavřít skener'
              : 'QR vrácení'}

          </button>

        </div>

        {scannerOpen && (

          <div className="
            bg-white
            rounded-3xl
            shadow-lg
            p-5
            mb-6
          ">

            <div
              id="return-reader"
              className="
                overflow-hidden
                rounded-2xl
              "
            />

          </div>

        )}

        <div className="
          grid
          grid-cols-1
          md:grid-cols-2
          gap-4
          mb-8
        ">

          <div className="
            bg-white
            rounded-3xl
            shadow-lg
            p-6
          ">

            <div className="
              flex
              items-center
              gap-3
              mb-3
            ">

              <Undo2 size={22} />

              <h2 className="
                text-xl
                font-bold
              ">

                Aktivní půjčky

              </h2>

            </div>

            <p className="
              text-4xl
              font-bold
            ">

              {rentals.length}

            </p>

          </div>

          <div className="
            bg-white
            rounded-3xl
            shadow-lg
            p-6
          ">

            <div className="
              flex
              items-center
              gap-3
              mb-3
            ">

              <Clock3 size={22} />

              <h2 className="
                text-xl
                font-bold
              ">

                Po termínu

              </h2>

            </div>

            <p className="
              text-4xl
              font-bold
              text-red-600
            ">

              {overdueRentals.length}

            </p>

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
              placeholder="
                Vyhledat stroj, zákazníka nebo telefon...
              "
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

              Načítám půjčky...

            </div>

          )}

          {!loading &&
            filteredRentals.length === 0 && (

            <div className="
              bg-white
              rounded-3xl
              shadow-lg
              p-8
              text-center
              text-gray-500
            ">

              Žádné aktivní půjčky

            </div>

          )}

          {filteredRentals.map(
            (rental) => {

              const overdue =
                new Date(
                  rental.end_date
                ) < new Date()

              return (

                <div
                  key={rental.id}
                  className={`
                    rounded-3xl
                    shadow-lg
                    p-6
                    border-2
                    bg-white

                    ${overdue
                      ? 'border-red-300'
                      : 'border-transparent'}
                  `}
                >

                  <div className="
                    flex
                    flex-col
                    xl:flex-row
                    xl:items-center
                    xl:justify-between
                    gap-5
                  ">

                    <div>

                      <div className="
                        flex
                        items-center
                        gap-3
                        mb-2
                        flex-wrap
                      ">

                        <h2 className="
                          text-2xl
                          font-bold
                        ">

                          {rental.machine.name}

                        </h2>

                        <div className="
                          bg-red-100
                          text-red-700
                          px-3
                          py-1
                          rounded-xl
                          text-sm
                          font-semibold
                        ">

                          {overdue
                            ? 'Po termínu'
                            : 'Aktivní'}
                        </div>

                      </div>

                      <p className="
                        text-gray-700
                        text-lg
                      ">

                        {rental.customer.first_name}{' '}
                        {rental.customer.last_name}

                      </p>

                      <p className="
                        text-gray-500
                        mt-1
                      ">

                        {rental.customer.phone}

                      </p>

                      <p className="
                        text-gray-500
                        mt-3
                      ">

                        Vrátit:
                        {' '}
                        {new Date(
                          rental.end_date
                        ).toLocaleString('cs-CZ')}
                      </p>

                    </div>

                    <button
                      onClick={() =>
                        returnRental(rental)
                      }
                      className="
                        bg-black
                        hover:bg-gray-800
                        active:scale-[0.98]
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