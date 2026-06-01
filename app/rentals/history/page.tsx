'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Rental = {
  id: string
  rental_price: number
  deposit: number
  start_date: string
  end_date: string
  returned: boolean

  customers: {
    first_name: string
    last_name: string
    phone: string
  }

  machines: {
    id?: string
    name: string
  }
}

export default function RentalHistoryPage() {

  const [rentals, setRentals] = useState<Rental[]>([])

  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')

  const [filter, setFilter] = useState<
    'all' |
    'active' |
    'returned' |
    'overdue'
  >('all')

  useEffect(() => {

    loadRentals()

  }, [])

  async function loadRentals() {

    const { data, error } = await supabase
      .from('rentals')
      .select(`
        *,
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
      .order('created_at', {
        ascending: false
      })

    if (error) {

      console.log(error)

      alert('Chyba načítání půjček')

      setLoading(false)

      return
    }

    setRentals(data as Rental[])

    setLoading(false)
  }

  function getRentalStatus(rental: Rental) {

    if (rental.returned) {
      return 'returned'
    }

    const now = new Date()

    const end = new Date(rental.end_date)

    if (end < now) {
      return 'overdue'
    }

    return 'active'
  }

  async function markReturned(rental: Rental) {

    const confirmReturn = confirm(
      `Opravdu vrátit stroj "${rental.machines.name}"?`
    )

    if (!confirmReturn) return

    const { error } = await supabase
      .from('rentals')
      .update({
        returned: true,
        returned_at: new Date().toISOString()
      })
      .eq('id', rental.id)

    if (error) {

      console.log(error)

      alert('Chyba při vrácení')

      return
    }

    if (rental.machines.id) {

      await supabase
        .from('machines')
        .update({
          status: 'available'
        })
        .eq('id', rental.machines.id)
    }

    await loadRentals()

    alert('Půjčka uzavřena')
  }

  const filteredRentals = useMemo(() => {

    return rentals.filter((rental) => {

      const fullName =
        `${rental.customers.first_name} ${rental.customers.last_name}`

      const matchesSearch =

        fullName
          .toLowerCase()
          .includes(search.toLowerCase())

        ||

        rental.customers.phone
          .toLowerCase()
          .includes(search.toLowerCase())

        ||

        rental.machines.name
          .toLowerCase()
          .includes(search.toLowerCase())

      const status = getRentalStatus(rental)

      const matchesFilter =

        filter === 'all'
          ? true
          : status === filter

      return matchesSearch && matchesFilter
    })

  }, [rentals, search, filter])

  const activeCount = rentals.filter(
    (r) => getRentalStatus(r) === 'active'
  ).length

  const overdueCount = rentals.filter(
    (r) => getRentalStatus(r) === 'overdue'
  ).length

  const returnedCount = rentals.filter(
    (r) => getRentalStatus(r) === 'returned'
  ).length

  const totalRevenue = rentals.reduce(
    (sum, rental) => sum + rental.rental_price,
    0
  )

  if (loading) {

    return (

      <main className="min-h-screen bg-gray-100 p-10">

        <div className="bg-white rounded-3xl p-10 shadow-lg">

          <h1 className="text-3xl font-bold">
            Načítám půjčky...
          </h1>

        </div>

      </main>
    )
  }

  return (

    <main className="min-h-screen bg-gray-100 p-10">

      <h1 className="text-4xl font-bold mb-10">
        Historie půjček
      </h1>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

        <div className="bg-white rounded-3xl shadow-lg p-6">

          <p className="text-gray-500 mb-2">
            Aktivní půjčky
          </p>

          <h2 className="text-5xl font-bold text-blue-600">
            {activeCount}
          </h2>

        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">

          <p className="text-gray-500 mb-2">
            Po termínu
          </p>

          <h2 className="text-5xl font-bold text-red-600">
            {overdueCount}
          </h2>

        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">

          <p className="text-gray-500 mb-2">
            Vrácené
          </p>

          <h2 className="text-5xl font-bold text-green-600">
            {returnedCount}
          </h2>

        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">

          <p className="text-gray-500 mb-2">
            Celkový obrat
          </p>

          <h2 className="text-4xl font-bold">
            {totalRevenue} Kč
          </h2>

        </div>

      </div>

      <div className="bg-white rounded-3xl shadow-lg p-6 mb-8 space-y-4">

        <input
          type="text"
          placeholder="Hledat zákazníka, telefon nebo stroj..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-2xl p-4 text-lg"
        />

        <div className="flex flex-wrap gap-3">

          <button
            onClick={() => setFilter('all')}
            className={`
              px-5 py-2 rounded-2xl font-semibold
              ${
                filter === 'all'
                  ? 'bg-black text-white'
                  : 'bg-gray-200'
              }
            `}
          >
            Vše
          </button>

          <button
            onClick={() => setFilter('active')}
            className={`
              px-5 py-2 rounded-2xl font-semibold
              ${
                filter === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200'
              }
            `}
          >
            Aktivní
          </button>

          <button
            onClick={() => setFilter('returned')}
            className={`
              px-5 py-2 rounded-2xl font-semibold
              ${
                filter === 'returned'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200'
              }
            `}
          >
            Vrácené
          </button>

          <button
            onClick={() => setFilter('overdue')}
            className={`
              px-5 py-2 rounded-2xl font-semibold
              ${
                filter === 'overdue'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200'
              }
            `}
          >
            Po termínu
          </button>

        </div>

      </div>

      <div className="grid gap-6">

        {filteredRentals.map((rental) => (

          <div
            key={rental.id}
            className={`
              rounded-3xl shadow-lg p-6 border-2 bg-white
              ${
                getRentalStatus(rental) === 'overdue'
                  ? 'border-red-500'
                  : 'border-transparent'
              }
            `}
          >

            <div className="flex items-center justify-between mb-4">

              <div>

                <h2 className="text-2xl font-bold">

                  {rental.customers.first_name}
                  {' '}
                  {rental.customers.last_name}

                </h2>

                <p className="text-gray-500">

                  {rental.machines.name}

                </p>

              </div>

              <div>

                {getRentalStatus(rental) === 'returned' && (

                  <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                    Vráceno
                  </div>

                )}

                {getRentalStatus(rental) === 'active' && (

                  <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                    Aktivní
                  </div>

                )}

                {getRentalStatus(rental) === 'overdue' && (

                  <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold">
                    Po termínu
                  </div>

                )}

              </div>

            </div>

            <div className="grid md:grid-cols-2 gap-4">

              <div>

                <p className="text-gray-500 mb-1">
                  Telefon
                </p>

                <p className="font-semibold">
                  {rental.customers.phone}
                </p>

              </div>

              <div>

                <p className="text-gray-500 mb-1">
                  Cena
                </p>

                <p className="font-semibold">
                  {rental.rental_price} Kč
                </p>

              </div>

              <div>

                <p className="text-gray-500 mb-1">
                  Od
                </p>

                <p className="font-semibold">
                  {new Date(
                    rental.start_date
                  ).toLocaleString()}
                </p>

              </div>

              <div>

                <p className="text-gray-500 mb-1">
                  Do
                </p>

                <p className="font-semibold">
                  {new Date(
                    rental.end_date
                  ).toLocaleString()}
                </p>

              </div>

            </div>

            {getRentalStatus(rental) === 'overdue' && (

              <div className="mt-6 bg-red-100 border border-red-300 rounded-2xl p-4">

                <p className="font-bold text-red-700">
                  Tato půjčka je po termínu
                </p>

              </div>

            )}

            {!rental.returned && (

              <button
                onClick={() => markReturned(rental)}
                className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl p-4 font-semibold transition"
              >
                Označit jako vrácené
              </button>

            )}

          </div>

        ))}

      </div>

    </main>
  )
}