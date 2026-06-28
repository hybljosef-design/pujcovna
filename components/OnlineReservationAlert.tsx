"use client"

import {
  useEffect,
  useRef,
  useState
} from 'react'

import {
  BellRing,
  CalendarDays,
  Phone,
  User,
  Wrench,
  X
} from 'lucide-react'

import { supabase } from '../lib/supabase'

type OnlineReservation = {
  id: string
  start_date: string
  end_date: string
  note?: string | null
  status?: string | null
  source?: string | null
  customers:
    | {
        first_name: string
        last_name: string
        phone: string
      }
    | {
        first_name: string
        last_name: string
        phone: string
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('cs-CZ')
}

function getCustomer(
  reservation: OnlineReservation
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
  reservation: OnlineReservation
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

export default function OnlineReservationAlert() {
  const [reservation, setReservation] =
    useState<OnlineReservation | null>(null)

  const [pendingCount, setPendingCount] =
    useState(0)

  const knownIdsRef =
    useRef<Set<string>>(new Set())

  useEffect(() => {
    loadPendingReservations()

    const channel =
      supabase
        .channel('online-reservation-alerts')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'reservations',
            filter: 'source=eq.online'
          },
          async (payload) => {
            const id =
              String(
                payload.new.id || ''
              )

            if (!id) return

            if (
              knownIdsRef.current.has(id)
            ) {
              return
            }

            await loadReservationById(id)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'reservations',
            filter: 'source=eq.online'
          },
          async () => {
            await loadPendingReservations(false)
          }
        )
        .subscribe()

    const interval =
      window.setInterval(
        () => {
          loadPendingReservations(false)
        },
        30000
      )

    return () => {
      window.clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadPendingReservations(
    showExisting = true
  ) {
    const { data, error } =
      await supabase
        .from('reservations')
        .select(`
          id,
          start_date,
          end_date,
          note,
          status,
          source,
          customers (
            first_name,
            last_name,
            phone
          ),
          machines (
            name
          )
        `)
        .eq('source', 'online')
        .eq('status', 'pending')
        .order(
          'created_at',
          {
            ascending: false
          }
        )

    if (error) {
      console.log(error)
      return
    }

    const pending =
      (data || []) as unknown as OnlineReservation[]

    setPendingCount(
      pending.length
    )

    pending.forEach(item => {
      knownIdsRef.current.add(item.id)
    })

    if (
      showExisting &&
      pending.length > 0 &&
      !reservation
    ) {
      setReservation(pending[0])
    }
  }

  async function loadReservationById(
    id: string
  ) {
    const { data, error } =
      await supabase
        .from('reservations')
        .select(`
          id,
          start_date,
          end_date,
          note,
          status,
          source,
          customers (
            first_name,
            last_name,
            phone
          ),
          machines (
            name
          )
        `)
        .eq('id', id)
        .single()

    if (error) {
      console.log(error)
      return
    }

    const loaded =
      data as unknown as OnlineReservation

    knownIdsRef.current.add(id)

    if (
      loaded.source === 'online' &&
      loaded.status === 'pending'
    ) {
      setReservation(loaded)
      setPendingCount(
        value => Math.max(
          value + 1,
          1
        )
      )
    }
  }

  function openReservations() {
    window.location.href = '/reservations'
  }

  if (!reservation) {
    return null
  }

  const customer =
    getCustomer(reservation)

  const machine =
    getMachine(reservation)

  const customerName =
    customer
      ? `${customer.first_name} ${customer.last_name}`
      : 'Neznámý zákazník'

  const phone =
    customer?.phone || ''

  return (
    <div className="
      fixed
      inset-0
      z-[100]
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
        max-w-xl
        overflow-hidden
      ">

        <div className="
          bg-orange-600
          text-white
          p-5
          flex
          items-center
          justify-between
          gap-4
        ">

          <div className="
            flex
            items-center
            gap-3
          ">

            <BellRing size={30} />

            <div>

              <h2 className="
                text-2xl
                font-black
              ">
                Nová online rezervace
              </h2>

              {pendingCount > 1 && (

                <p className="text-orange-100">
                  Celkem čeká na potvrzení: {pendingCount}
                </p>

              )}

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              setReservation(null)
            }
            className="
              bg-white/20
              hover:bg-white/30
              rounded-2xl
              p-3
              transition
            "
          >
            <X size={22} />
          </button>

        </div>

        <div className="p-6 space-y-5">

          <div className="
            flex
            items-start
            gap-4
          ">

            <User
              size={24}
              className="text-gray-500 mt-1"
            />

            <div>

              <div className="text-sm text-gray-500">
                Zákazník
              </div>

              <div className="text-2xl font-bold">
                {customerName}
              </div>

            </div>

          </div>

          <div className="
            flex
            items-start
            gap-4
          ">

            <Wrench
              size={24}
              className="text-gray-500 mt-1"
            />

            <div>

              <div className="text-sm text-gray-500">
                Stroj
              </div>

              <div className="text-xl font-bold">
                {machine?.name || '-'}
              </div>

            </div>

          </div>

          <div className="
            flex
            items-start
            gap-4
          ">

            <CalendarDays
              size={24}
              className="text-gray-500 mt-1"
            />

            <div>

              <div className="text-sm text-gray-500">
                Termín
              </div>

              <div className="text-xl font-bold">
                {formatDate(reservation.start_date)}
                {' '}
                –
                {' '}
                {formatDate(reservation.end_date)}
              </div>

            </div>

          </div>

          {phone && (

            <a
              href={`tel:${phone}`}
              className="
                flex
                items-center
                gap-3
                bg-black
                text-white
                rounded-2xl
                p-4
                font-bold
              "
            >

              <Phone size={22} />

              {phone}

            </a>

          )}

          <div className="
            grid
            sm:grid-cols-2
            gap-3
            pt-2
          ">

            <button
              type="button"
              onClick={openReservations}
              className="
                bg-orange-600
                hover:bg-orange-700
                transition
                text-white
                rounded-2xl
                p-4
                font-bold
                text-lg
              "
            >
              Otevřít rezervace
            </button>

            <button
              type="button"
              onClick={() =>
                setReservation(null)
              }
              className="
                bg-gray-100
                hover:bg-gray-200
                transition
                rounded-2xl
                p-4
                font-bold
                text-lg
              "
            >
              Zavřít
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}
