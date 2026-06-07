'use client'

import { useEffect, useState } from 'react'
import {
  useParams,
  useRouter
} from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

type Customer = {
  id: string
  first_name: string
  last_name: string
}

type Machine = {
  id: string
  name: string
}

export default function EditReservationPage() {
  const router = useRouter()

  const params = useParams()

  const reservationId =
    params.id as string

  const [customers, setCustomers] =
    useState<Customer[]>([])

  const [machines, setMachines] =
    useState<Machine[]>([])

  const [customerId, setCustomerId] =
    useState('')

  const [machineId, setMachineId] =
    useState('')

  const [startDate, setStartDate] =
    useState('')

  const [endDate, setEndDate] =
    useState('')

  const [note, setNote] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: customersData } =
      await supabase
        .from('customers')
        .select('id, first_name, last_name')
        .order('first_name')

    const { data: machinesData } =
      await supabase
        .from('machines')
        .select('id, name')
        .eq('active', true)
        .order('name')

    const { data: reservation } =
      await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single()

    setCustomers(customersData || [])
    setMachines(machinesData || [])

    if (reservation) {
      setCustomerId(
        reservation.customer_id
      )

      setMachineId(
        reservation.machine_id
      )

      setStartDate(
        reservation.start_date
          ?.substring(0, 10) || ''
      )

      setEndDate(
        reservation.end_date
          ?.substring(0, 10) || ''
      )

      setNote(
        reservation.note || ''
      )
    }

    setLoading(false)
  }

  async function saveReservation() {
    if (
      !customerId ||
      !machineId ||
      !startDate ||
      !endDate
    ) {
      alert(
        'Vyplň všechna povinná pole'
      )
      return
    }

    setSaving(true)

    const { data: collisions } =
      await supabase
        .from('reservations')
        .select('id')
        .eq('machine_id', machineId)
        .neq('id', reservationId)
        .lte('start_date', endDate)
        .gte('end_date', startDate)

    if (
      collisions &&
      collisions.length > 0
    ) {
      alert(
        'Stroj je v tomto termínu již rezervován.'
      )

      setSaving(false)
      return
    }

    const { error } =
      await supabase
        .from('reservations')
        .update({
          customer_id: customerId,
          machine_id: machineId,
          start_date: startDate,
          end_date: endDate,
          note
        })
        .eq('id', reservationId)

    if (error) {
      alert(error.message)
      setSaving(false)
      return
    }

    alert(
      'Rezervace upravena'
    )

    router.push(
      '/reservations'
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Načítám...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 lg:p-8">

      <div className="max-w-4xl mx-auto">

        <div className="bg-white rounded-3xl shadow-lg p-8">

          <h1 className="text-4xl font-bold mb-8">
            Upravit rezervaci
          </h1>

          <div className="grid gap-6">

            <div>

              <label className="block mb-2 font-semibold">
                Zákazník
              </label>

              <select
                value={customerId}
                onChange={(e) =>
                  setCustomerId(
                    e.target.value
                  )
                }
                className="
                  w-full
                  border
                  rounded-2xl
                  p-4
                "
              >
                <option value="">
                  Vyber zákazníka
                </option>

                {customers.map(
                  (customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.first_name}{' '}
                      {customer.last_name}
                    </option>
                  )
                )}
              </select>

            </div>

            <div>

              <label className="block mb-2 font-semibold">
                Stroj
              </label>

              <select
                value={machineId}
                onChange={(e) =>
                  setMachineId(
                    e.target.value
                  )
                }
                className="
                  w-full
                  border
                  rounded-2xl
                  p-4
                "
              >
                <option value="">
                  Vyber stroj
                </option>

                {machines.map(
                  (machine) => (
                    <option
                      key={machine.id}
                      value={machine.id}
                    >
                      {machine.name}
                    </option>
                  )
                )}
              </select>

            </div>

            <div>

              <label className="block mb-2 font-semibold">
                Datum od
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(
                    e.target.value
                  )
                }
                className="
                  w-full
                  border
                  rounded-2xl
                  p-4
                "
              />

            </div>

            <div>

              <label className="block mb-2 font-semibold">
                Datum do
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(e) =>
                  setEndDate(
                    e.target.value
                  )
                }
                className="
                  w-full
                  border
                  rounded-2xl
                  p-4
                "
              />

            </div>

            <div>

              <label className="block mb-2 font-semibold">
                Poznámka
              </label>

              <textarea
                value={note}
                onChange={(e) =>
                  setNote(
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

            <button
              onClick={saveReservation}
              disabled={saving}
              className="
                bg-black
                text-white
                p-4
                rounded-2xl
                font-semibold
              "
            >
              {saving
                ? 'Ukládám...'
                : 'Uložit změny'}
            </button>

          </div>

        </div>

      </div>

    </main>
  )
}