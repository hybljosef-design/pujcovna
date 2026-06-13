'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import {
  Phone,
  User,
  Wrench,
  CalendarDays,
  FileText,
  BellRing,
  CheckCircle
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

type Reservation = {
  id: string
  customer_id: string
  machine_id: string
  start_date: string
  end_date: string
  note: string
  status?: string | null
  source?: string | null

  customers:
    | {
        first_name: string
        last_name: string
        phone: string
        id_card?: string
      }
    | {
        first_name: string
        last_name: string
        phone: string
        id_card?: string
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

function getCustomer(
  reservation: Reservation
) {

  if (
    Array.isArray(
      reservation.customers
    )
  ) {

    return reservation.customers[0] || null
  }

  return reservation.customers
}

function getMachine(
  reservation: Reservation
) {

  if (
    Array.isArray(
      reservation.machines
    )
  ) {

    return reservation.machines[0] || null
  }

  return reservation.machines
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


function getSourceLabel(
  reservation: Reservation
) {

  return reservation.source === 'online'
    ? 'Online rezervace'
    : 'Rezervace pobočky'
}

function getStatusLabel(
  reservation: Reservation
) {

  if (reservation.status === 'pending') {

    return 'Čeká na potvrzení'
  }

  if (reservation.status === 'confirmed') {

    return 'Potvrzeno'
  }

  return 'Potvrzeno'
}

function isOnlinePending(
  reservation: Reservation
) {

  return (
    reservation.source === 'online' &&
    reservation.status === 'pending'
  )
}

export default function ReservationsPage() {

  const [reservations, setReservations] =
    useState<Reservation[]>([])

  const [loading, setLoading] =
    useState(true)

  const pendingOnlineCount =
    reservations.filter(
      reservation =>
        isOnlinePending(
          reservation
        )
    ).length

  useEffect(() => {

    loadReservations()

  }, [])

  async function loadReservations() {

    setLoading(true)

    const { data, error } =
      await supabase
        .from('reservations')
        .select(`
          *,
          customers (
            first_name,
            last_name,
            phone,
            id_card
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

      setLoading(false)

      return
    }

    setReservations(
      (data || []) as unknown as Reservation[]
    )

    setLoading(false)
  }


  async function confirmReservation(
    id: string
  ) {

    const { error } =
      await supabase
        .from('reservations')
        .update({
          status: 'confirmed'
        })
        .eq('id', id)

    if (error) {

      alert(error.message)

      return
    }

    await loadReservations()
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

        <div className="mb-6">

          <button
            type="button"
            onClick={() => {
              window.location.href = '/dashboard'
            }}
            className="
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

          </button>

        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">

          <div>

            <h1 className="text-4xl font-bold mb-2">

              Rezervace

            </h1>

            <p className="text-gray-500">

              Přehled rezervací včetně kontaktu na zákazníka

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
              text-center
            "
          >

            Nová rezervace

          </Link>

        </div>

        {pendingOnlineCount > 0 && (

          <div className="
            bg-orange-50
            border
            border-orange-200
            text-orange-800
            rounded-3xl
            p-5
            mb-6
            flex
            items-center
            gap-4
            shadow-sm
          ">

            <BellRing size={28} />

            <div>

              <div className="text-xl font-bold">
                Nové online rezervace
              </div>

              <div>
                Čeká na potvrzení:
                {' '}
                <strong>{pendingOnlineCount}</strong>
              </div>

            </div>

          </div>

        )}

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

            <div>

              <div className="hidden lg:block overflow-x-auto">

                <table className="w-full">

                  <thead className="bg-gray-50">

                    <tr>

                      <th className="p-4 text-left">
                        Zákazník
                      </th>

                      <th className="p-4 text-left">
                        Kontakt
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
                        Stav
                      </th>

                      <th className="p-4 text-left">
                        Zdroj
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
                      reservation => {

                        const customer =
                          getCustomer(
                            reservation
                          )

                        const machine =
                          getMachine(
                            reservation
                          )

                        const customerName =
                          customer
                            ? `${customer.first_name} ${customer.last_name}`
                            : '-'

                        const phone =
                          customer?.phone || ''

                        return (

                          <tr
                            key={reservation.id}
                            className="border-t"
                          >

                            <td className="p-4">

                              <div className="font-semibold">

                                {customerName}

                              </div>

                              {customer?.id_card && (

                                <div className="text-sm text-gray-500 mt-1">

                                  OP: {customer.id_card}

                                </div>

                              )}

                            </td>

                            <td className="p-4">

                              {phone ? (

                                <a
                                  href={`tel:${phone}`}
                                  className="
                                    inline-flex
                                    items-center
                                    gap-2
                                    bg-black
                                    text-white
                                    px-4
                                    py-2
                                    rounded-xl
                                    text-sm
                                    font-medium
                                  "
                                >

                                  <Phone size={16} />

                                  {phone}

                                </a>

                              ) : (

                                <span className="text-red-500">
                                  Telefon chybí
                                </span>

                              )}

                            </td>

                            <td className="p-4">

                              {machine?.name || '-'}

                            </td>

                            <td className="p-4">

                              {formatDate(
                                reservation.start_date
                              )}

                            </td>

                            <td className="p-4">

                              {formatDate(
                                reservation.end_date
                              )}

                            </td>

                            <td className="p-4">

                              <span className={`
                                inline-flex
                                items-center
                                gap-2
                                px-3
                                py-2
                                rounded-xl
                                text-sm
                                font-bold

                                ${isOnlinePending(reservation)
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-green-100 text-green-700'}
                              `}>

                                {isOnlinePending(reservation) && (
                                  <BellRing size={15} />
                                )}

                                {!isOnlinePending(reservation) && (
                                  <CheckCircle size={15} />
                                )}

                                {getStatusLabel(reservation)}

                              </span>

                            </td>

                            <td className="p-4">

                              <span className={`
                                inline-flex
                                px-3
                                py-2
                                rounded-xl
                                text-sm
                                font-bold

                                ${reservation.source === 'online'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'}
                              `}>

                                {getSourceLabel(reservation)}

                              </span>

                            </td>

                            <td className="p-4 max-w-xs">

                              <div className="line-clamp-2">

                                {reservation.note || '-'}

                              </div>

                            </td>

                            <td className="p-4">

                              <div className="flex flex-wrap gap-2">

                                {isOnlinePending(reservation) && (

                                  <button
                                    onClick={() =>
                                      confirmReservation(
                                        reservation.id
                                      )
                                    }
                                    className="
                                      bg-orange-600
                                      text-white
                                      px-4
                                      py-2
                                      rounded-xl
                                      text-sm
                                      font-medium
                                    "
                                  >

                                    Potvrdit

                                  </button>

                                )}

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
                      }
                    )}

                  </tbody>

                </table>

              </div>

              <div className="lg:hidden divide-y">

                {reservations.map(
                  reservation => {

                    const customer =
                      getCustomer(
                        reservation
                      )

                    const machine =
                      getMachine(
                        reservation
                      )

                    const customerName =
                      customer
                        ? `${customer.first_name} ${customer.last_name}`
                        : 'Neznámý zákazník'

                    const phone =
                      customer?.phone || ''

                    return (

                      <div
                        key={reservation.id}
                        className="p-5 space-y-4"
                      >

                        <div>

                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">

                            <User size={16} />

                            Zákazník

                          </div>

                          <div className="text-xl font-bold">

                            {customerName}

                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">

                            <span className={`
                              inline-flex
                              items-center
                              gap-2
                              px-3
                              py-2
                              rounded-xl
                              text-sm
                              font-bold

                              ${isOnlinePending(reservation)
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-green-100 text-green-700'}
                            `}>

                              {isOnlinePending(reservation) && (
                                <BellRing size={15} />
                              )}

                              {!isOnlinePending(reservation) && (
                                <CheckCircle size={15} />
                              )}

                              {getStatusLabel(reservation)}

                            </span>

                            <span className={`
                              inline-flex
                              px-3
                              py-2
                              rounded-xl
                              text-sm
                              font-bold

                              ${reservation.source === 'online'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'}
                            `}>

                              {getSourceLabel(reservation)}

                            </span>

                          </div>

                          {customer?.id_card && (

                            <div className="text-sm text-gray-500 mt-1">

                              OP: {customer.id_card}

                            </div>

                          )}

                          {phone ? (

                            <a
                              href={`tel:${phone}`}
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
                                font-medium
                              "
                            >

                              <Phone size={16} />

                              {phone}

                            </a>

                          ) : (

                            <div className="text-red-500 text-sm mt-2">

                              Telefon chybí

                            </div>

                          )}

                        </div>

                        <div>

                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">

                            <Wrench size={16} />

                            Stroj

                          </div>

                          <div className="font-semibold">

                            {machine?.name || '-'}

                          </div>

                        </div>

                        <div>

                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">

                            <CalendarDays size={16} />

                            Termín

                          </div>

                          <div className="font-semibold">

                            {formatDate(
                              reservation.start_date
                            )}
                            {' '}
                            –
                            {' '}
                            {formatDate(
                              reservation.end_date
                            )}

                          </div>

                        </div>

                        <div>

                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">

                            <FileText size={16} />

                            Poznámka

                          </div>

                          <div className="text-gray-700">

                            {reservation.note || '-'}

                          </div>

                        </div>

                        <div className="grid grid-cols-1 gap-2 pt-2">

                          {isOnlinePending(reservation) && (

                            <button
                              onClick={() =>
                                confirmReservation(
                                  reservation.id
                                )
                              }
                              className="
                                bg-orange-600
                                text-white
                                px-4
                                py-3
                                rounded-xl
                                text-sm
                                font-medium
                              "
                            >

                              Potvrdit rezervaci

                            </button>

                          )}

                          <Link
                            href={`/rentals/new?reservation=${reservation.id}`}
                            className="
                              bg-black
                              text-white
                              px-4
                              py-3
                              rounded-xl
                              text-sm
                              font-medium
                              text-center
                            "
                          >

                            Převést na půjčku

                          </Link>

                          <Link
                            href={`/reservations/edit/${reservation.id}`}
                            className="
                              bg-blue-600
                              text-white
                              px-4
                              py-3
                              rounded-xl
                              text-sm
                              font-medium
                              text-center
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
                              py-3
                              rounded-xl
                              text-sm
                              font-medium
                            "
                          >

                            Smazat

                          </button>

                        </div>

                      </div>

                    )
                  }
                )}

              </div>

            </div>

          )}

        </div>

      </div>

    </main>
  )
}
