'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import Link from 'next/link'

import { supabase } from '../../../lib/supabase'

import { Html5QrcodeScanner } from 'html5-qrcode'


import SignaturePad from '../../../components/SignaturePad'

import { generateContractPdf } from '../../../lib/generateContractPdf'

import {
  QrCode,
  FileText,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Search
} from 'lucide-react'

type Machine = {
  id: string
  name: string
  daily_price: number
  deposit: number
  barcode?: string
  status?: string
}

type Customer = {
  id: string
  first_name: string
  last_name: string
  phone: string
  id_card: string
  street?: string
  house_number?: string
  zip?: string
  city?: string
}

function createDefaultDates() {

  const now = new Date()

  const tomorrow = new Date()

  tomorrow.setDate(
    tomorrow.getDate() + 1
  )

  const format = (date: Date) => {

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

  return {
    start: format(now),
    end: format(tomorrow)
  }
}

export default function NewRentalPage() {

  const defaultDates =
    createDefaultDates()

  const phoneInputRef =
    useRef<HTMLInputElement | null>(null)

  const [reservationId, setReservationId] =
    useState('')

  const [machines, setMachines] =
    useState<Machine[]>([])

  const [machineSearch, setMachineSearch] =
    useState('')

  const [selectedMachine, setSelectedMachine] =
    useState('')

  const [customerName, setCustomerName] =
    useState('')

  const [customerLastName, setCustomerLastName] =
    useState('')

  const [phone, setPhone] =
    useState('')

  const [idCard, setIdCard] =
    useState('')

  const [street, setStreet] =
    useState('')

  const [houseNumber, setHouseNumber] =
    useState('')

  const [zip, setZip] =
    useState('')

  const [city, setCity] =
    useState('')

  const [startDate, setStartDate] =
    useState(defaultDates.start)

  const [endDate, setEndDate] =
    useState(defaultDates.end)

  const [loading, setLoading] =
    useState(false)

  const [scannerOpen, setScannerOpen] =
    useState(false)


  const [signature, setSignature] =
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

    loadMachines()

    const params =
      new URLSearchParams(
        window.location.search
      )

    const reservation =
      params.get('reservation') || ''

    setReservationId(
      reservation
    )

  }, [])

  useEffect(() => {

    if (!reservationId) return

    loadReservation(
      reservationId
    )

  }, [reservationId])

  useEffect(() => {

    if (!scannerOpen) return

    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250
        }
      },
      false
    )

    scanner.render(

      async (decodedText) => {

        const machine = machines.find(
          (m) =>
            m.barcode?.toLowerCase() === decodedText.toLowerCase()
        )

        if (machine) {

          setSelectedMachine(machine.id)

          setMachineSearch(machine.name)

          showStatus(
            'success',
            `Načten stroj: ${machine.name}`
          )

          setScannerOpen(false)

          scanner.clear()

          setTimeout(() => {

            phoneInputRef.current?.focus()

          }, 300)

        } else {

          showStatus(
            'error',
            'Stroj nenalezen'
          )
        }
      },

      () => {}
    )

    return () => {
      scanner.clear().catch(() => {})
    }

  }, [scannerOpen, machines])

  async function loadMachines() {

    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .order('name')

    if (error) {

      console.log(error)

      showStatus(
        'error',
        'Chyba načítání strojů'
      )

      return
    }

    setMachines(data || [])
  }

  async function loadReservation(
    id: string
  ) {

    const { data, error } =
      await supabase
        .from('reservations')
        .select(`
          *,
          customers (
            *
          ),
          machines (
            *
          )
        `)
        .eq('id', id)
        .single()

    if (error || !data) {

      console.log(error)

      showStatus(
        'error',
        'Rezervaci se nepodařilo načíst'
      )

      return
    }

    setSelectedMachine(
      data.machine_id || ''
    )

    setMachineSearch(
      data.machines?.name || ''
    )

    setCustomerName(
      data.customers?.first_name || ''
    )

    setCustomerLastName(
      data.customers?.last_name || ''
    )

    setPhone(
      data.customers?.phone || ''
    )

    setIdCard(
      data.customers?.id_card || ''
    )

    setStreet(
      data.customers?.street || ''
    )

    setHouseNumber(
      data.customers?.house_number || ''
    )

    setZip(
      data.customers?.zip || ''
    )

    setCity(
      data.customers?.city || ''
    )

    const formatDateTimeLocal =
      (value: string) => {

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

    if (data.start_date) {

      setStartDate(
        formatDateTimeLocal(
          data.start_date
        )
      )
    }

    if (data.end_date) {

      setEndDate(
        formatDateTimeLocal(
          data.end_date
        )
      )
    }

    showStatus(
      'success',
      'Rezervace načtena'
    )
  }

  async function searchCustomer() {

    if (!phone) return

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .maybeSingle()

    if (error) {

      console.log(error)

      return
    }

    if (data) {

      const customer = data as Customer

      setCustomerName(customer.first_name)

      setCustomerLastName(customer.last_name)

      setIdCard(customer.id_card)

      setStreet(
        customer.street || ''
      )

      setHouseNumber(
        customer.house_number || ''
      )

      setZip(
        customer.zip || ''
      )

      setCity(
        customer.city || ''
      )

      showStatus(
        'success',
        'Zákazník načten'
      )
    }
  }

  function setRentalDays(days: number) {

    const start =
      new Date(startDate)

    const end =
      new Date(start)

    end.setDate(
      end.getDate() + days
    )

    const offset =
      end.getTimezoneOffset()

    const local =
      new Date(
        end.getTime() -
        offset * 60 * 1000
      )

    setEndDate(
      local
        .toISOString()
        .slice(0, 16)
    )
  }

  const availableMachines =
    useMemo(() => {

      return machines.filter(
        (machine) =>
          machine.status === 'available'
      )

    }, [machines])

  const filteredMachines =
    useMemo(() => {

      return availableMachines.filter(
        machine => {

          const search =
            machineSearch.toLowerCase()

          return (
            machine.name
              .toLowerCase()
              .includes(search) ||

            machine.barcode
              ?.toLowerCase()
              .includes(search)
          )
        }
      )

    }, [
      availableMachines,
      machineSearch
    ])

  const selectedMachineData =
    machines.find(
      (m) =>
        m.id === selectedMachine
    )

  const totalDays =
    startDate && endDate

      ? Math.max(
          1,
          Math.ceil(
            (
              new Date(endDate).getTime() -
              new Date(startDate).getTime()
            ) / (
              1000 *
              60 *
              60 *
              24
            )
          )
        )

      : 0

  const totalPrice =
    selectedMachineData
      ? totalDays *
        selectedMachineData.daily_price
      : 0

  async function createContractNumber() {

    const currentYear =
      new Date().getFullYear()

    const { data, error } =
      await supabase
        .from('contract_counters')
        .select('*')
        .eq('id', 'main')
        .maybeSingle()

    if (error) {

      throw new Error(
        error.message
      )
    }

    if (!data) {

      const { error: insertError } =
        await supabase
          .from('contract_counters')
          .insert([
            {
              id: 'main',
              year: currentYear,
              last_number: 1
            }
          ])

      if (insertError) {

        throw new Error(
          insertError.message
        )
      }

      return `SML-${currentYear}-0001`
    }

    const nextNumber =
      data.year === currentYear
        ? Number(data.last_number || 0) + 1
        : 1

    const { error: updateError } =
      await supabase
        .from('contract_counters')
        .update({
          year: currentYear,
          last_number: nextNumber
        })
        .eq('id', 'main')

    if (updateError) {

      throw new Error(
        updateError.message
      )
    }

    return `SML-${currentYear}-${String(nextNumber).padStart(4, '0')}`
  }

  async function createRental() {

    if (!selectedMachine) {

      showStatus(
        'error',
        'Vyberte stroj'
      )

      return
    }

    if (
      !customerName ||
      !customerLastName ||
      !phone
    ) {

      showStatus(
        'error',
        'Vyplňte zákazníka'
      )

      return
    }

    if (!startDate || !endDate) {

      showStatus(
        'error',
        'Vyplňte datum'
      )

      return
    }

    setLoading(true)

    const machine =
      machines.find(
        (m) =>
          m.id === selectedMachine
      )

    if (!machine) {

      showStatus(
        'error',
        'Stroj nenalezen'
      )

      setLoading(false)

      return
    }

    const {
      data: existingRentals
    } = await supabase
      .from('rentals')
      .select('*')
      .eq('machine_id', machine.id)
      .eq('returned', false)

    const hasConflict =
      existingRentals?.some(
        (rental: any) => {

          const existingStart =
            new Date(rental.start_date)

          const existingEnd =
            new Date(rental.end_date)

          const newStart =
            new Date(startDate)

          const newEnd =
            new Date(endDate)

          return (
            newStart <= existingEnd &&
            newEnd >= existingStart
          )
        }
      )

    if (hasConflict) {

      showStatus(
        'error',
        'Stroj je již půjčen'
      )

      setLoading(false)

      return
    }

    let customerId = ''

    const {
      data: existingCustomer
    } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .maybeSingle()

    if (existingCustomer) {

      customerId =
        existingCustomer.id

      const { error: updateCustomerError } =
        await supabase
          .from('customers')
          .update({
            first_name: customerName,
            last_name: customerLastName,
            phone,
            id_card: idCard,
            street,
            house_number: houseNumber,
            zip,
            city
          })
          .eq('id', customerId)

      if (updateCustomerError) {

        showStatus(
          'error',
          'Chyba aktualizace zákazníka'
        )

        setLoading(false)

        return
      }

    } else {

      const {
        data: customer,
        error: customerError
      } = await supabase
        .from('customers')
        .insert([
          {
            first_name: customerName,
            last_name: customerLastName,
            phone,
            id_card: idCard,
            street,
            house_number: houseNumber,
            zip,
            city
          }
        ])
        .select()
        .single()

      if (customerError) {

        showStatus(
          'error',
          'Chyba zákazníka'
        )

        setLoading(false)

        return
      }

      customerId = customer.id
    }

    let contractNumber = ''

    try {

      contractNumber =
        await createContractNumber()

    } catch (error: any) {

      console.log(error)

      showStatus(
        'error',
        error.message ||
        'Chyba při vytváření čísla smlouvy'
      )

      setLoading(false)

      return
    }

    const {
      error: rentalError
    } = await supabase
      .from('rentals')
      .insert([
        {
          customer_id: customerId,
          machine_id: machine.id,
          rental_price: totalPrice,
          deposit: machine.deposit,
          start_date: startDate,
          end_date: endDate,
          returned: false,
          contract_number: contractNumber
        }
      ])

    if (rentalError) {

      showStatus(
        'error',
        'Chyba vytvoření půjčky'
      )

      setLoading(false)

      return
    }

    const { error: machineUpdateError } =
      await supabase
        .from('machines')
        .update({
          status: 'rented'
        })
        .eq('id', machine.id)

    if (machineUpdateError) {

      console.log(machineUpdateError)

      showStatus(
        'error',
        'Půjčka vznikla, ale nepodařilo se aktualizovat stav stroje'
      )

      setLoading(false)

      return
    }

    if (reservationId) {

      const { error: reservationDeleteError } =
        await supabase
          .from('reservations')
          .delete()
          .eq(
            'id',
            reservationId
          )

      if (reservationDeleteError) {

        console.log(reservationDeleteError)

        showStatus(
          'error',
          'Půjčka vznikla, ale rezervaci se nepodařilo smazat'
        )

        setLoading(false)

        return
      }
    }

    try {

      await generateContractPdf({
        contractNumber,
        customerName,
        customerLastName,
        phone,
        idCard,
        street,
        houseNumber,
        zip,
        city,
        machineName: machine.name,
        startDate,
        endDate,
        totalDays,
        totalPrice,
        deposit: machine.deposit,
        signature
      })

    } catch (error) {

      console.log(error)

      showStatus(
        'success',
        'Půjčka vytvořena. PDF se na tomto zařízení nepodařilo stáhnout.'
      )

      if (reservationId) {

        window.location.href =
          '/reservations'

        return
      }

      setLoading(false)

      return
    }

    showStatus(
      'success',
      'Půjčka vytvořena'
    )

    if (reservationId) {

      window.location.href =
        '/reservations'

      return
    }

    const newDates =
      createDefaultDates()

    setCustomerName('')
    setCustomerLastName('')
    setPhone('')
    setIdCard('')
    setStreet('')
    setHouseNumber('')
    setZip('')
    setCity('')
    setSelectedMachine('')
    setMachineSearch('')
    setStartDate(newDates.start)
    setEndDate(newDates.end)
    setSignature('')
    setScannerOpen(false)

    setLoading(false)

    setTimeout(() => {

      phoneInputRef.current?.focus()

    }, 200)
  }

  return (

    <main className="min-h-screen bg-gray-100 p-4 lg:p-8">

      <div className="max-w-4xl mx-auto">

        <div className="mb-6">

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border px-4 py-2 rounded-xl shadow-sm font-medium"
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

        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div>

            <h1 className="text-4xl lg:text-5xl font-bold mb-2">

              Nová půjčka

            </h1>

            <p className="text-gray-500">

              Express vytvoření půjčky

            </p>

          </div>

          <button
            onClick={() =>
              setScannerOpen(!scannerOpen)
            }
            className="bg-black hover:bg-gray-800 transition text-white px-5 py-4 rounded-2xl flex items-center justify-center gap-3"
          >

            <QrCode size={20} />

            {scannerOpen
              ? 'Zavřít skener'
              : 'QR skener'}

          </button>

        </div>

        {scannerOpen && (

          <div className="bg-white rounded-3xl shadow-lg p-5 mb-6">

            <div
              id="reader"
              className="overflow-hidden rounded-2xl"
            />

          </div>

        )}

        <div className="bg-white rounded-3xl shadow-lg p-6 lg:p-8 space-y-6">


          <div>

            <label className="block mb-2 font-semibold">

              Vyhledat stroj

            </label>

            <div className="relative">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={machineSearch}
                onChange={(e) =>
                  setMachineSearch(
                    e.target.value
                  )
                }
                placeholder="Napište název stroje..."
                className="w-full border rounded-2xl p-4 pl-11 text-lg"
              />

            </div>

          </div>

          <div className="grid gap-3 max-h-[320px] overflow-y-auto">

            {filteredMachines.map(
              (machine) => (

                <button
                  key={machine.id}
                  type="button"
                  onClick={() => {

                    setSelectedMachine(machine.id)

                    setMachineSearch(machine.name)
                  }}
                  className={`
                    border rounded-2xl p-4 text-left transition
                    ${selectedMachine === machine.id
                      ? 'border-black bg-black text-white'
                      : 'bg-white hover:bg-gray-50'}
                  `}
                >

                  <div className="font-semibold text-lg">

                    {machine.name}

                  </div>

                  <div className={`
                    text-sm mt-1
                    ${selectedMachine === machine.id
                      ? 'text-gray-300'
                      : 'text-gray-500'}
                  `}>

                    {machine.daily_price} Kč / den
                  </div>

                </button>

              )
            )}

          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5 text-blue-800">

            <div className="font-semibold mb-1">
              Údaje zákazníka
            </div>

            <p className="text-sm">
              Údaje vyplň ručně. Telefon slouží i pro vyhledání existujícího zákazníka.
            </p>

          </div>

          <div className="grid md:grid-cols-2 gap-5">

            <div>

              <label className="block mb-2 font-semibold">

                Jméno

              </label>

              <input
                type="text"
                value={customerName}
                onChange={(e) =>
                  setCustomerName(
                    e.target.value
                  )
                }
                className="w-full border rounded-2xl p-4"
              />

            </div>

            <div>

              <label className="block mb-2 font-semibold">

                Příjmení

              </label>

              <input
                type="text"
                value={customerLastName}
                onChange={(e) =>
                  setCustomerLastName(
                    e.target.value
                  )
                }
                className="w-full border rounded-2xl p-4"
              />

            </div>

          </div>

          <div>

            <label className="block mb-2 font-semibold">

              Telefon

            </label>

            <input
              ref={phoneInputRef}
              type="text"
              value={phone}
              onChange={(e) =>
                setPhone(
                  e.target.value
                )
              }
              onBlur={searchCustomer}
              className="w-full border rounded-2xl p-4 text-lg"
            />

          </div>

          <div>

            <label className="block mb-2 font-semibold">

              Číslo OP

            </label>

            <input
              type="text"
              value={idCard}
              onChange={(e) =>
                setIdCard(
                  e.target.value
                )
              }
              className="w-full border rounded-2xl p-4"
            />

          </div>

          <div className="grid md:grid-cols-2 gap-5">

            <div>

              <label className="block mb-2 font-semibold">

                Ulice

              </label>

              <input
                type="text"
                value={street}
                onChange={(e) =>
                  setStreet(
                    e.target.value
                  )
                }
                className="w-full border rounded-2xl p-4"
              />

            </div>

            <div>

              <label className="block mb-2 font-semibold">

                Číslo popisné

              </label>

              <input
                type="text"
                value={houseNumber}
                onChange={(e) =>
                  setHouseNumber(
                    e.target.value
                  )
                }
                className="w-full border rounded-2xl p-4"
              />

            </div>

          </div>

          <div className="grid md:grid-cols-2 gap-5">

            <div>

              <label className="block mb-2 font-semibold">

                PSČ

              </label>

              <input
                type="text"
                value={zip}
                onChange={(e) =>
                  setZip(
                    e.target.value
                  )
                }
                className="w-full border rounded-2xl p-4"
              />

            </div>

            <div>

              <label className="block mb-2 font-semibold">

                Město

              </label>

              <input
                type="text"
                value={city}
                onChange={(e) =>
                  setCity(
                    e.target.value
                  )
                }
                className="w-full border rounded-2xl p-4"
              />

            </div>

          </div>

          <div className="grid md:grid-cols-2 gap-5">

            <div>

              <label className="block mb-2 font-semibold">

                Začátek půjčky

              </label>

              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) =>
                  setStartDate(
                    e.target.value
                  )
                }
                className="w-full border rounded-2xl p-4"
              />

            </div>

            <div>

              <label className="block mb-2 font-semibold">

                Konec půjčky

              </label>

              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) =>
                  setEndDate(
                    e.target.value
                  )
                }
                className="w-full border rounded-2xl p-4"
              />

            </div>

          </div>

          <div className="flex flex-wrap gap-3">

            <button
              onClick={() =>
                setRentalDays(1)
              }
              className="bg-gray-200 hover:bg-gray-300 transition px-4 py-2 rounded-2xl text-sm font-medium"
            >

              +1 den

            </button>

            <button
              onClick={() =>
                setRentalDays(2)
              }
              className="bg-gray-200 hover:bg-gray-300 transition px-4 py-2 rounded-2xl text-sm font-medium"
            >

              +2 dny

            </button>

            <button
              onClick={() =>
                setRentalDays(7)
              }
              className="bg-gray-200 hover:bg-gray-300 transition px-4 py-2 rounded-2xl text-sm font-medium"
            >

              Týden

            </button>

          </div>

          <SignaturePad
            onSave={setSignature}
          />

          <div className="bg-gray-100 rounded-3xl p-6 space-y-4">

            <div className="flex items-center justify-between">

              <span className="flex items-center gap-2">

                <Clock3 size={18} />

                Počet dní

              </span>

              <span className="font-bold text-lg">

                {totalDays}

              </span>

            </div>

            <div className="flex justify-between">

              <span>Cena půjčovného</span>

              <span className="font-bold text-lg">

                {totalPrice} Kč

              </span>

            </div>

            <div className="flex justify-between">

              <span>Vratná kauce</span>

              <span className="font-bold text-lg">

                {selectedMachineData?.deposit || 0} Kč

              </span>

            </div>

          </div>

          <button
            onClick={createRental}
            disabled={loading}
            className="w-full bg-black hover:bg-gray-800 transition text-white rounded-2xl p-5 text-lg font-semibold flex items-center justify-center gap-3"
          >

            <FileText size={22} />

            {loading
              ? 'Vytvářím půjčku...'
              : 'Vytvořit půjčku + PDF'}

          </button>

        </div>

      </div>

    </main>
  )
}