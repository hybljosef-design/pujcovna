'use client'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import Link from 'next/link'

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ImageIcon,
  Wrench
} from 'lucide-react'

import { supabase } from '../../lib/supabase'

type Machine = {
  id: string
  name: string
  daily_price: number
  deposit: number
  active?: boolean
  status?: string
  barcode?: string
  primary_image_url?: string | null
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

type MachineImage = {
  machine_id: string
  image_url: string
  is_primary: boolean
  sort_order: number
}

function startOfDay(date: Date) {
  const value = new Date(date)

  value.setHours(0, 0, 0, 0)

  return value
}

function formatDate(date: Date) {
  return date.toLocaleDateString('cs-CZ')
}

function isDateInRange(
  date: Date,
  start: string,
  end: string
) {
  const day =
    startOfDay(date).getTime()

  const rangeStart =
    startOfDay(new Date(start)).getTime()

  const rangeEnd =
    startOfDay(new Date(end)).getTime()

  return (
    day >= rangeStart &&
    day <= rangeEnd
  )
}

export default function PublicRentalCatalogPage() {
  const [machines, setMachines] =
    useState<Machine[]>([])

  const [rentals, setRentals] =
    useState<Rental[]>([])

  const [reservations, setReservations] =
    useState<Reservation[]>([])

  const [loading, setLoading] =
    useState(true)

  const [search, setSearch] =
    useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    const [
      machinesResult,
      rentalsResult,
      reservationsResult,
      machineImagesResult
    ] = await Promise.all([
      supabase
        .from('machines')
        .select(`
          id,
          name,
          daily_price,
          deposit,
          active,
          status,
          barcode
        `)
        .eq('active', true)
        .order('name'),

      supabase
        .from('rentals')
        .select(`
          machine_id,
          start_date,
          end_date,
          returned
        `)
        .eq('returned', false),

      supabase
        .from('reservations')
        .select(`
          machine_id,
          start_date,
          end_date,
          cancelled
        `)
        .eq('cancelled', false),

      supabase
        .from('machine_images')
        .select(`
          machine_id,
          image_url,
          is_primary,
          sort_order
        `)
        .order('is_primary', {
          ascending: false
        })
        .order('sort_order', {
          ascending: true
        })
    ])

    if (machinesResult.error) {
      console.log(machinesResult.error)
    }

    if (rentalsResult.error) {
      console.log(rentalsResult.error)
    }

    if (reservationsResult.error) {
      console.log(reservationsResult.error)
    }

    if (machineImagesResult.error) {
      console.log(machineImagesResult.error)
    }

    const machineImages =
      (machineImagesResult.data || [])
        as MachineImage[]

    const imageMap =
      new Map<string, string>()

    machineImages.forEach(
      image => {
        if (
          !imageMap.has(
            image.machine_id
          )
        ) {
          imageMap.set(
            image.machine_id,
            image.image_url
          )
        }
      }
    )

    const preparedMachines =
      (machinesResult.data || [])
        .map(
          machine => ({
            ...machine,
            primary_image_url:
              imageMap.get(
                machine.id
              ) || null
          })
        )

    setMachines(preparedMachines)
    setRentals(rentalsResult.data || [])
    setReservations(reservationsResult.data || [])

    setLoading(false)
  }

  function isMachineBlockedOnDate(
    machineId: string,
    date: Date
  ) {
    const rentalBlocked =
      rentals.some(
        rental =>
          rental.machine_id === machineId &&
          isDateInRange(
            date,
            rental.start_date,
            rental.end_date
          )
      )

    const reservationBlocked =
      reservations.some(
        reservation =>
          reservation.machine_id === machineId &&
          isDateInRange(
            date,
            reservation.start_date,
            reservation.end_date
          )
      )

    return rentalBlocked || reservationBlocked
  }

  function getMachineAvailability(
    machineId: string
  ) {
    const today =
      startOfDay(new Date())

    if (!isMachineBlockedOnDate(machineId, today)) {
      return {
        availableToday: true,
        label: 'Volné dnes'
      }
    }

    for (let i = 1; i <= 90; i++) {
      const date =
        new Date(today)

      date.setDate(today.getDate() + i)

      if (!isMachineBlockedOnDate(machineId, date)) {
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
  }

  const filteredMachines =
    useMemo(() => {
      const value =
        search.toLowerCase().trim()

      return machines.filter(
        machine =>
          machine.name
            .toLowerCase()
            .includes(value)
      )
    }, [
      machines,
      search
    ])

  return (
    <main className="min-h-screen bg-gray-100">

      <section className="bg-black text-white">

        <div className="max-w-7xl mx-auto px-4 py-10 lg:py-16">

          <div className="max-w-3xl">

            <div className="inline-flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-2 mb-6">

              <Wrench size={18} />

              Půjčovna strojů NAPP-MB

            </div>

            <h1 className="text-4xl lg:text-6xl font-black mb-4">

              Rezervace strojů online

            </h1>

            <p className="text-gray-300 text-lg lg:text-xl">

              Vyberte si stroj, zkontrolujte dostupnost a připravte si rezervaci předem.

            </p>

          </div>

        </div>

      </section>

      <section className="max-w-7xl mx-auto px-4 py-8">

        <div className="bg-white rounded-3xl shadow-lg p-5 mb-8">

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Hledat stroj..."
            className="w-full border rounded-2xl p-4 text-lg"
          />

        </div>

        {loading ? (

          <div className="bg-white rounded-3xl shadow-lg p-8 text-center text-gray-500">

            Načítám stroje...

          </div>

        ) : filteredMachines.length === 0 ? (

          <div className="bg-white rounded-3xl shadow-lg p-8 text-center text-gray-500">

            Žádný stroj nebyl nalezen.

          </div>

        ) : (

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

            {filteredMachines.map(
              machine => {
                const availability =
                  getMachineAvailability(machine.id)

                return (

                  <article
                    key={machine.id}
                    className="
                      bg-white
                      rounded-3xl
                      shadow-lg
                      overflow-hidden
                      flex
                      flex-col
                    "
                  >

                    <Link
                      href={`/pujcovna/stroj/${machine.id}`}
                      className="
                        block
                        aspect-[4/3]
                        bg-gray-200
                        overflow-hidden
                      "
                    >

                      {machine.primary_image_url ? (

                        <img
                          src={machine.primary_image_url}
                          alt={machine.name}
                          className="
                            w-full
                            h-full
                            object-cover
                            hover:scale-105
                            transition
                            duration-300
                          "
                        />

                      ) : (

                        <div className="
                          w-full
                          h-full
                          flex
                          flex-col
                          items-center
                          justify-center
                          gap-3
                          text-gray-400
                          bg-gray-100
                        ">

                          <ImageIcon size={52} />

                          <span className="font-semibold">
                            Fotografie se připravuje
                          </span>

                        </div>

                      )}

                    </Link>

                    <div className="
                      p-6
                      flex
                      flex-col
                      flex-1
                    ">

                      <div className="flex items-start justify-between gap-4 mb-5">

                        <div>

                          <h2 className="text-2xl font-black mb-2">

                            {machine.name}

                          </h2>

                          <p className="text-gray-500">

                            Půjčovna strojů NAPP-MB

                          </p>

                        </div>

                        <div className={`
                          shrink-0
                          rounded-2xl
                          px-3
                          py-2
                          text-sm
                          font-bold
                          flex
                          items-center
                          gap-2

                          ${availability.availableToday
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'}
                        `}>

                          {availability.availableToday
                            ? <CheckCircle2 size={16} />
                            : <Clock3 size={16} />}

                          {availability.availableToday
                            ? 'Volné'
                            : 'Obsazeno'}

                        </div>

                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-5">

                        <div className="bg-gray-100 rounded-2xl p-4">

                          <p className="text-gray-500 text-sm mb-1">
                            Cena / den
                          </p>

                          <p className="text-2xl font-black">
                            {machine.daily_price} Kč
                          </p>

                        </div>

                        <div className="bg-gray-100 rounded-2xl p-4">

                          <p className="text-gray-500 text-sm mb-1">
                            Kauce
                          </p>

                          <p className="text-2xl font-black">
                            {machine.deposit} Kč
                          </p>

                        </div>

                      </div>

                      <div className="bg-gray-50 rounded-2xl p-4 mb-5 flex items-center gap-3">

                        <CalendarDays size={20} />

                        <div>

                          <p className="font-bold">
                            Dostupnost
                          </p>

                          <p className="text-gray-500">
                            {availability.label}
                          </p>

                        </div>

                      </div>

                      <Link
                        href={`/pujcovna/stroj/${machine.id}`}
                        className="
                          block
                          w-full
                          mt-auto
                          bg-black
                          hover:bg-gray-800
                          transition
                          text-white
                          text-center
                          rounded-2xl
                          p-4
                          font-bold
                          text-lg
                        "
                      >

                        Detail a rezervace

                      </Link>

                    </div>

                  </article>

                )
              }
            )}

          </div>

        )}

      </section>

    </main>
  )
}
