'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

type Reservation = {
  id: string
  customer_id: string
  machine_id: string
  start_date: string
  end_date: string
  note: string

  customers: {
    first_name: string
    last_name: string
  } | null

  machines: {
    name: string
  } | null
}

export default function ReservationsPage() {

  const [reservations, setReservations] =
    useState<Reservation[]>([])

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {

    loadReservations()

  }, [])

  async function loadReservations() {

    const { data, error } =
      await supabase
        .from('reservations')
        .select(`
          *,
          customers (
            first_name,
            last_name
          ),
          machines (
            name
          )
        `)
        .order(
          'start_date',
          {
            ascending: true
          }
        )

    if (error) {

      console.log(error)

      alert(error.message)

      return
    }

    setReservations(data || [])

    setLoading(false)
  }

  async function deleteReservation(
    id: string
  ) {

    const confirmed =
      confirm(
        'Opravdu smazat rezervaci?'
      )

    if (!confirmed) return

    const { error } =
      await supabase
        .from('reservations')
        .delete()
        .eq('id', id)

    if (error) {

      alert(error.message)

      return
    }

    await loadReservations()
  }

  return (

    <main className="min-h-screen bg-gray-100 p-4 lg:p-8">

      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-8">

          <div>

            <h1 className="text-4xl font-bold mb-2">

              Rezervace

            </h1>

            <p className="text-gray-500">

              Přehled všech rezervací

            </p>

          </div>

          <Link
            href="/reservations/new"
            className="
              bg-black
              text-white
              px-6
              py-4
              rounded-2xl
              font-semibold
            "
          >

            Nová rezervace

          </Link>

        </div>

        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

          {loading ? (

            <div className="p-10 text-center">

              Načítám...

            </div>

          ) : reservations.length === 0 ? (

            <div className="p-10 text-center">

              Žádné rezervace

            </div>

          ) : (

            <table className="w-full">

              <thead className="bg-gray-50">

                <tr>

                  <th className="p-4 text-left">
                    Zákazník
                  </th>

                  <th className="p-4 text-left">
                    Stroj
                  </th>

                  <th className="p-4 text-left">
                    Od
                  </th>

                  <th className="p-4 text-left">
                    Do
                  </th>

                  <th className="p-4 text-left">
                    Poznámka
                  </th>

                  <th className="p-4 text-left">
                    Akce
                  </th>

                </tr>

              </thead>

              <tbody>

                {reservations.map(
                  reservation => (

                    <tr
                      key={reservation.id}
                      className="border-t"
                    >

                      <td className="p-4">

                        {reservation.customers
                          ? `${reservation.customers.first_name} ${reservation.customers.last_name}`
                          : '-'}

                      </td>

                      <td className="p-4">

                        {reservation.machines?.name || '-'}

                      </td>

                      <td className="p-4">

                        {new Date(
                          reservation.start_date
                        ).toLocaleDateString('cs-CZ')}

                      </td>

                      <td className="p-4">

                        {new Date(
                          reservation.end_date
                        ).toLocaleDateString('cs-CZ')}

                      </td>

                      <td className="p-4">

                        {reservation.note || '-'}

                      </td>

                      <td className="p-4">

                        <div className="flex flex-wrap gap-2">

                          <Link
                            href={`/rentals/new?reservation=${reservation.id}`}
                            className="
                              bg-black
                              text-white
                              px-4
                              py-2
                              rounded-xl
                              text-sm
                              font-medium
                            "
                          >

                            Převést

                          </Link>

                          <Link
                            href={`/reservations/edit/${reservation.id}`}
                            className="
                              bg-blue-600
                              text-white
                              px-4
                              py-2
                              rounded-xl
                              text-sm
                              font-medium
                            "
                          >

                            Upravit

                          </Link>

                          <button
                            onClick={() =>
                              deleteReservation(
                                reservation.id
                              )
                            }
                            className="
                              bg-red-600
                              text-white
                              px-4
                              py-2
                              rounded-xl
                              text-sm
                              font-medium
                            "
                          >

                            Smazat

                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          )}

        </div>

      </div>

    </main>
  )
}