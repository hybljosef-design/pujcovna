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
  returned_deposit?: number | null
  return_note?: string | null
  returned_at?: string | null
  contract_number?: string | null
  note?: string | null

  customers: {
    first_name: string
    last_name: string
    phone: string
  }

  machines: {
    id?: string
    name: string
    daily_price?: number
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

  const [returnRental, setReturnRental] =
    useState<Rental | null>(null)

  const [returnedDeposit, setReturnedDeposit] =
    useState('')

  const [returnNote, setReturnNote] =
    useState('')

  const [returnLoading, setReturnLoading] =
    useState(false)

  const [editRental, setEditRental] =
    useState<Rental | null>(null)

  const [editStartDate, setEditStartDate] =
    useState('')

  const [editEndDate, setEditEndDate] =
    useState('')

  const [editRentalPrice, setEditRentalPrice] =
    useState('')

  const [editDeposit, setEditDeposit] =
    useState('')

  const [editNote, setEditNote] =
    useState('')

  const [editLoading, setEditLoading] =
    useState(false)

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
          name,
          daily_price
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

  function formatDateTimeLocal(value: string) {

    const date =
      new Date(value)

    const offset =
      date.getTimezoneOffset()

    const local =
      new Date(
        date.getTime() -
        offset * 60 * 1000
      )

    return local
      .toISOString()
      .slice(0, 16)
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

  function openEditModal(rental: Rental) {

    setEditRental(rental)

    setEditStartDate(
      formatDateTimeLocal(
        rental.start_date
      )
    )

    setEditEndDate(
      formatDateTimeLocal(
        rental.end_date
      )
    )

    setEditRentalPrice(
      String(rental.rental_price || 0)
    )

    setEditDeposit(
      String(rental.deposit || 0)
    )

    setEditNote(
      rental.note || ''
    )
  }

  function closeEditModal() {

    setEditRental(null)

    setEditStartDate('')
    setEditEndDate('')
    setEditRentalPrice('')
    setEditDeposit('')
    setEditNote('')
  }

  function recalculateEditPrice() {

    if (!editRental) return

    const dailyPrice =
      Number(
        editRental.machines.daily_price || 0
      )

    const days =
      getRentalDays(
        editStartDate,
        editEndDate
      )

    setEditRentalPrice(
      String(days * dailyPrice)
    )
  }

  async function updateRental() {

    if (!editRental) return

    const priceValue =
      Number(editRentalPrice || 0)

    const depositValue =
      Number(editDeposit || 0)

    if (
      !editStartDate ||
      !editEndDate
    ) {

      alert(
        'Vyplňte datum od a datum do'
      )

      return
    }

    if (
      new Date(editEndDate) <
      new Date(editStartDate)
    ) {

      alert(
        'Datum do nesmí být před datem od'
      )

      return
    }

    if (
      Number.isNaN(priceValue) ||
      Number.isNaN(depositValue) ||
      priceValue < 0 ||
      depositValue < 0
    ) {

      alert(
        'Cena a kauce musí být platná čísla'
      )

      return
    }

    setEditLoading(true)

    const { error } = await supabase
      .from('rentals')
      .update({
        start_date: editStartDate,
        end_date: editEndDate,
        rental_price: priceValue,
        deposit: depositValue,
        note: editNote.trim()
      })
      .eq(
        'id',
        editRental.id
      )

    if (error) {

      console.log(error)

      alert(
        'Půjčku se nepodařilo upravit'
      )

      setEditLoading(false)

      return
    }

    closeEditModal()

    await loadRentals()

    alert(
      'Půjčka upravena'
    )

    setEditLoading(false)
  }

  function openReturnModal(rental: Rental) {

    setReturnRental(rental)

    setReturnedDeposit(
      String(rental.deposit || 0)
    )

    setReturnNote('')
  }

  function closeReturnModal() {

    setReturnRental(null)

    setReturnedDeposit('')

    setReturnNote('')
  }

  async function markReturned() {

    if (!returnRental) return

    const depositValue =
      Number(returnedDeposit || 0)

    if (
      Number.isNaN(depositValue) ||
      depositValue < 0
    ) {

      alert(
        'Vrácená kauce musí být platné číslo'
      )

      return
    }

    setReturnLoading(true)

    const { error } = await supabase
      .from('rentals')
      .update({
        returned: true,
        returned_at: new Date().toISOString(),
        returned_deposit: depositValue,
        return_note: returnNote.trim()
      })
      .eq('id', returnRental.id)

    if (error) {

      console.log(error)

      alert('Chyba při vrácení')

      setReturnLoading(false)

      return
    }

    if (returnRental.machines.id) {

      await supabase
        .from('machines')
        .update({
          status: 'available'
        })
        .eq('id', returnRental.machines.id)
    }

    closeReturnModal()

    await loadRentals()

    alert('Půjčka uzavřena')

    setReturnLoading(false)
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
                  Kauce
                </p>

                <p className="font-semibold">
                  {rental.deposit} Kč
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

            {(rental.note || rental.return_note || rental.returned_deposit !== null && rental.returned_deposit !== undefined) && (

              <div className="mt-5 grid md:grid-cols-2 gap-4">

                {rental.returned_deposit !== null &&
                  rental.returned_deposit !== undefined && (

                  <div className="bg-gray-50 rounded-2xl p-4">

                    <p className="text-gray-500 mb-1">
                      Vrácená kauce
                    </p>

                    <p className="font-semibold">
                      {rental.returned_deposit} Kč
                    </p>

                  </div>

                )}

                {rental.note && (

                  <div className="bg-blue-50 rounded-2xl p-4">

                    <p className="text-blue-700 font-semibold mb-1">
                      Poznámka k půjčce
                    </p>

                    <p className="text-blue-800">
                      {rental.note}
                    </p>

                  </div>

                )}

                {rental.return_note && (

                  <div className="bg-orange-50 rounded-2xl p-4">

                    <p className="text-orange-700 font-semibold mb-1">
                      Poznámka k vrácení
                    </p>

                    <p className="text-orange-800">
                      {rental.return_note}
                    </p>

                  </div>

                )}

              </div>

            )}

            {getRentalStatus(rental) === 'overdue' && (

              <div className="mt-6 bg-red-100 border border-red-300 rounded-2xl p-4">

                <p className="font-bold text-red-700">
                  Tato půjčka je po termínu
                </p>

              </div>

            )}

            {!rental.returned && (

              <div className="mt-6 grid sm:grid-cols-2 gap-3">

                <button
                  onClick={() => openEditModal(rental)}
                  className="w-full bg-gray-900 hover:bg-black text-white rounded-2xl p-4 font-semibold transition"
                >
                  Upravit půjčku
                </button>

                <button
                  onClick={() => openReturnModal(rental)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl p-4 font-semibold transition"
                >
                  Označit jako vrácené
                </button>

              </div>

            )}

          </div>

        ))}

      </div>

      {editRental && (

        <div className="
          fixed
          inset-0
          z-50
          bg-black/50
          flex
          items-center
          justify-center
          p-4
        ">

          <div className="
            bg-white
            rounded-3xl
            shadow-2xl
            w-full
            max-w-3xl
            max-h-[90vh]
            overflow-y-auto
            p-6
            lg:p-8
          ">

            <div className="
              flex
              items-start
              justify-between
              gap-4
              mb-6
            ">

              <div>

                <h2 className="text-3xl font-bold mb-2">
                  Upravit půjčku
                </h2>

                <p className="text-gray-500">
                  {editRental.customers.first_name}
                  {' '}
                  {editRental.customers.last_name}
                  {' – '}
                  {editRental.machines.name}
                </p>

              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="
                  bg-gray-100
                  hover:bg-gray-200
                  transition
                  rounded-2xl
                  px-4
                  py-3
                  font-semibold
                "
              >
                Zavřít
              </button>

            </div>

            <div className="grid md:grid-cols-2 gap-5">

              <div>

                <label className="block mb-2 font-semibold">
                  Datum od
                </label>

                <input
                  type="datetime-local"
                  value={editStartDate}
                  onChange={(e) =>
                    setEditStartDate(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    border
                    rounded-2xl
                    p-4
                    text-lg
                  "
                />

              </div>

              <div>

                <label className="block mb-2 font-semibold">
                  Datum do
                </label>

                <input
                  type="datetime-local"
                  value={editEndDate}
                  onChange={(e) =>
                    setEditEndDate(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    border
                    rounded-2xl
                    p-4
                    text-lg
                  "
                />

              </div>

              <div>

                <label className="block mb-2 font-semibold">
                  Cena půjčovného
                </label>

                <input
                  type="number"
                  min="0"
                  value={editRentalPrice}
                  onChange={(e) =>
                    setEditRentalPrice(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    border
                    rounded-2xl
                    p-4
                    text-lg
                  "
                />

                <p className="text-sm text-gray-500 mt-2">
                  Cena stroje / den: {editRental.machines.daily_price || 0} Kč
                </p>

              </div>

              <div>

                <label className="block mb-2 font-semibold">
                  Kauce
                </label>

                <input
                  type="number"
                  min="0"
                  value={editDeposit}
                  onChange={(e) =>
                    setEditDeposit(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    border
                    rounded-2xl
                    p-4
                    text-lg
                  "
                />

              </div>

            </div>

            <div className="mt-5">

              <button
                type="button"
                onClick={recalculateEditPrice}
                className="
                  bg-gray-100
                  hover:bg-gray-200
                  transition
                  rounded-2xl
                  px-5
                  py-3
                  font-semibold
                "
              >
                Přepočítat cenu podle data
              </button>

            </div>

            <div className="mt-5">

              <label className="block mb-2 font-semibold">
                Poznámka k půjčce
              </label>

              <textarea
                value={editNote}
                onChange={(e) =>
                  setEditNote(
                    e.target.value
                  )
                }
                rows={4}
                className="
                  w-full
                  border
                  rounded-2xl
                  p-4
                "
              />

            </div>

            <div className="
              flex
              flex-col
              sm:flex-row
              gap-3
              mt-8
            ">

              <button
                type="button"
                onClick={updateRental}
                disabled={editLoading}
                className="
                  bg-black
                  hover:bg-gray-800
                  disabled:bg-gray-400
                  transition
                  text-white
                  rounded-2xl
                  px-6
                  py-4
                  font-semibold
                  text-lg
                "
              >

                {editLoading
                  ? 'Ukládám změny...'
                  : 'Uložit změny'}

              </button>

              <button
                type="button"
                onClick={closeEditModal}
                className="
                  bg-gray-100
                  hover:bg-gray-200
                  transition
                  rounded-2xl
                  px-6
                  py-4
                  font-semibold
                  text-lg
                "
              >
                Zrušit
              </button>

            </div>

          </div>

        </div>

      )}


      {returnRental && (

        <div className="
          fixed
          inset-0
          z-50
          bg-black/50
          flex
          items-center
          justify-center
          p-4
        ">

          <div className="
            bg-white
            rounded-3xl
            shadow-2xl
            w-full
            max-w-2xl
            p-6
            lg:p-8
          ">

            <div className="mb-6">

              <h2 className="text-3xl font-bold mb-2">
                Vrácení stroje
              </h2>

              <p className="text-gray-500">
                {returnRental.machines.name}
              </p>

            </div>

            <div className="grid gap-5">

              <div>

                <label className="block mb-2 font-semibold">
                  Vrácená kauce
                </label>

                <input
                  type="number"
                  min="0"
                  value={returnedDeposit}
                  onChange={(e) =>
                    setReturnedDeposit(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    border
                    rounded-2xl
                    p-4
                    text-lg
                  "
                />

                <p className="text-sm text-gray-500 mt-2">
                  Původní kauce: {returnRental.deposit} Kč
                </p>

              </div>

              <div>

                <label className="block mb-2 font-semibold">
                  Poznámka k vrácení
                </label>

                <textarea
                  value={returnNote}
                  onChange={(e) =>
                    setReturnNote(
                      e.target.value
                    )
                  }
                  rows={4}
                  placeholder="Např. vráceno v pořádku, poškozený kabel, zadržena část kauce..."
                  className="
                    w-full
                    border
                    rounded-2xl
                    p-4
                  "
                />

              </div>

            </div>

            <div className="
              flex
              flex-col
              sm:flex-row
              gap-3
              mt-8
            ">

              <button
                type="button"
                onClick={markReturned}
                disabled={returnLoading}
                className="
                  bg-green-600
                  hover:bg-green-700
                  disabled:bg-gray-400
                  transition
                  text-white
                  rounded-2xl
                  px-6
                  py-4
                  font-semibold
                  text-lg
                "
              >

                {returnLoading
                  ? 'Ukládám vrácení...'
                  : 'Uložit vrácení'}

              </button>

              <button
                type="button"
                onClick={closeReturnModal}
                className="
                  bg-gray-100
                  hover:bg-gray-200
                  transition
                  rounded-2xl
                  px-6
                  py-4
                  font-semibold
                  text-lg
                "
              >
                Zrušit
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  )
}