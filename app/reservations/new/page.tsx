'use client'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import { useRouter } from 'next/navigation'

import { supabase } from '../../../lib/supabase'

import {
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Search,
  User,
  Wrench,
  FileText
} from 'lucide-react'

type Customer = {
  id: string
  first_name: string
  last_name: string
  phone: string
  id_card?: string
  street?: string
  house_number?: string
  zip?: string
  city?: string
}

type Machine = {
  id: string
  name: string
  daily_price?: number
  deposit?: number
  barcode?: string
  active?: boolean
  status?: string
}

function createDefaultDates() {

  const today =
    new Date()

  const tomorrow =
    new Date()

  tomorrow.setDate(
    tomorrow.getDate() + 1
  )

  const formatDate =
    (date: Date) => {

      const offset =
        date.getTimezoneOffset()

      const local =
        new Date(
          date.getTime() -
          offset * 60 * 1000
        )

      return local
        .toISOString()
        .slice(0, 10)
    }

  return {
    start: formatDate(today),
    end: formatDate(tomorrow)
  }
}

function normalizePhone(
  value: string
) {

  return value.replace(
    /\D/g,
    ''
  )
}

export default function NewReservationPage() {

  const router =
    useRouter()

  const defaultDates =
    createDefaultDates()

  const [machines, setMachines] =
    useState<Machine[]>([])

  const [machineSearch, setMachineSearch] =
    useState('')

  const [machineId, setMachineId] =
    useState('')

  const [customerId, setCustomerId] =
    useState('')

  const [firstName, setFirstName] =
    useState('')

  const [lastName, setLastName] =
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

  const [note, setNote] =
    useState('')

  const [saving, setSaving] =
    useState(false)

  const [statusMessage, setStatusMessage] =
    useState('')

  const [statusType, setStatusType] =
    useState<'success' | 'error' | ''>('')

  useEffect(() => {

    loadMachines()

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

  async function loadMachines() {

    const { data, error } =
      await supabase
        .from('machines')
        .select('*')
        .eq('active', true)
        .order('name')

    if (error) {

      console.log(error)

      showStatus(
        'error',
        'Chyba načítání strojů'
      )

      return
    }

    setMachines(
      data || []
    )
  }

  async function findCustomerByPhone(
    phoneValue: string
  ) {

    const wantedPhone =
      normalizePhone(
        phoneValue
      )

    if (!wantedPhone) {

      return null
    }

    const { data, error } =
      await supabase
        .from('customers')
        .select('*')
        .order('first_name')

    if (error) {

      throw new Error(
        error.message
      )
    }

    const customer =
      (data || []).find(
        item =>
          normalizePhone(
            item.phone || ''
          ) === wantedPhone
      )

    return customer || null
  }

  async function searchCustomerByPhone() {

    const normalizedPhone =
      phone.trim()

    if (!normalizedPhone) return

    try {

      const customer =
        await findCustomerByPhone(
          normalizedPhone
        )

      if (!customer) {

        setCustomerId('')

        showStatus(
          'success',
          'Nový zákazník – doplň údaje ručně'
        )

        return
      }

      const existingCustomer =
        customer as Customer

      setCustomerId(
        existingCustomer.id
      )

      setFirstName(
        existingCustomer.first_name || ''
      )

      setLastName(
        existingCustomer.last_name || ''
      )

      setPhone(
        existingCustomer.phone || normalizedPhone
      )

      setIdCard(
        existingCustomer.id_card || ''
      )

      setStreet(
        existingCustomer.street || ''
      )

      setHouseNumber(
        existingCustomer.house_number || ''
      )

      setZip(
        existingCustomer.zip || ''
      )

      setCity(
        existingCustomer.city || ''
      )

      showStatus(
        'success',
        'Zákazník načten podle telefonu'
      )

    } catch (error: any) {

      console.log(error)

      showStatus(
        'error',
        error.message ||
        'Chyba při hledání zákazníka'
      )
    }
  }

  const filteredMachines =
    useMemo(() => {

      const search =
        machineSearch
          .toLowerCase()
          .trim()

      return machines.filter(
        machine => {

          if (
            machine.status &&
            machine.status !== 'available'
          ) {
            return false
          }

          if (!search) return true

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
      machines,
      machineSearch
    ])

  const selectedMachine =
    machines.find(
      machine =>
        machine.id === machineId
    )

  async function getOrCreateCustomer() {

    const normalizedPhone =
      phone.trim()

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !normalizedPhone
    ) {
      throw new Error(
        'Vyplň jméno, příjmení a telefon zákazníka'
      )
    }

    if (customerId) {

      const { error } =
        await supabase
          .from('customers')
          .update({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: normalizedPhone,
            id_card: idCard.trim(),
            street: street.trim(),
            house_number: houseNumber.trim(),
            zip: zip.trim(),
            city: city.trim()
          })
          .eq(
            'id',
            customerId
          )

      if (error) {

        throw new Error(
          error.message
        )
      }

      return customerId
    }

    const existingCustomer =
      await findCustomerByPhone(
        normalizedPhone
      )

    if (existingCustomer) {

      const { error } =
        await supabase
          .from('customers')
          .update({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: normalizedPhone,
            id_card: idCard.trim(),
            street: street.trim(),
            house_number: houseNumber.trim(),
            zip: zip.trim(),
            city: city.trim()
          })
          .eq(
            'id',
            existingCustomer.id
          )

      if (error) {

        throw new Error(
          error.message
        )
      }

      return existingCustomer.id
    }

    const {
      data: newCustomer,
      error: customerError
    } =
      await supabase
        .from('customers')
        .insert([
          {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: normalizedPhone,
            id_card: idCard.trim(),
            street: street.trim(),
            house_number: houseNumber.trim(),
            zip: zip.trim(),
            city: city.trim()
          }
        ])
        .select()
        .single()

    if (customerError) {

      throw new Error(
        customerError.message
      )
    }

    return newCustomer.id
  }

  async function checkCollisions() {

    const {
      data: reservationCollisions,
      error: reservationError
    } =
      await supabase
        .from('reservations')
        .select('id')
        .eq(
          'machine_id',
          machineId
        )
        .lte(
          'start_date',
          endDate
        )
        .gte(
          'end_date',
          startDate
        )

    if (reservationError) {

      throw new Error(
        reservationError.message
      )
    }

    if (
      reservationCollisions &&
      reservationCollisions.length > 0
    ) {

      throw new Error(
        'Stroj je v tomto termínu již rezervován.'
      )
    }

    const {
      data: rentalCollisions,
      error: rentalError
    } =
      await supabase
        .from('rentals')
        .select('id')
        .eq(
          'machine_id',
          machineId
        )
        .eq(
          'returned',
          false
        )
        .lte(
          'start_date',
          endDate
        )
        .gte(
          'end_date',
          startDate
        )

    if (rentalError) {

      throw new Error(
        rentalError.message
      )
    }

    if (
      rentalCollisions &&
      rentalCollisions.length > 0
    ) {

      throw new Error(
        'Stroj je v tomto termínu již půjčený.'
      )
    }
  }

  async function saveReservation() {

    if (!machineId) {

      showStatus(
        'error',
        'Vyber stroj'
      )

      return
    }

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !phone.trim()
    ) {

      showStatus(
        'error',
        'Vyplň zákazníka'
      )

      return
    }

    if (
      !startDate ||
      !endDate
    ) {

      showStatus(
        'error',
        'Vyplň datum od a datum do'
      )

      return
    }

    if (
      new Date(endDate) <
      new Date(startDate)
    ) {

      showStatus(
        'error',
        'Datum do nesmí být před datem od'
      )

      return
    }

    setSaving(true)

    try {

      await checkCollisions()

      const finalCustomerId =
        await getOrCreateCustomer()

      const { error } =
        await supabase
          .from('reservations')
          .insert([
            {
              customer_id: finalCustomerId,
              machine_id: machineId,
              start_date: startDate,
              end_date: endDate,
              note: note.trim()
            }
          ])

      if (error) {

        throw new Error(
          error.message
        )
      }

      showStatus(
        'success',
        'Rezervace vytvořena'
      )

      setTimeout(() => {

        router.push(
          '/reservations'
        )

      }, 500)

    } catch (error: any) {

      console.log(error)

      showStatus(
        'error',
        error.message ||
        'Rezervaci se nepodařilo vytvořit'
      )

      setSaving(false)
    }
  }

  return (

    <main className="min-h-screen bg-gray-100 p-4 lg:p-8">

      <div className="max-w-4xl mx-auto">

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

        <div className="bg-white rounded-3xl shadow-lg p-6 lg:p-8">

          <div className="mb-8">

            <h1 className="text-4xl font-bold mb-2">

              Nová rezervace

            </h1>

            <p className="text-gray-500">

              Zákazníka vyplň ručně. Pokud už existuje, načte se podle telefonu.

            </p>

          </div>

          <div className="grid gap-6">

            <section className="bg-gray-50 rounded-3xl p-5 border border-gray-200">

              <div className="flex items-center gap-3 mb-5">

                <User size={22} />

                <h2 className="text-2xl font-bold">

                  Zákazník

                </h2>

              </div>

              <div className="grid gap-5">

                <div>

                  <label className="block mb-2 font-semibold">

                    Telefon

                  </label>

                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">

                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => {

                        setPhone(
                          e.target.value
                        )

                        setCustomerId('')
                      }}
                      onBlur={searchCustomerByPhone}
                      placeholder="Telefon zákazníka"
                      className="
                        w-full
                        border
                        rounded-2xl
                        p-4
                        text-lg
                        bg-white
                      "
                    />

                    <button
                      type="button"
                      onClick={searchCustomerByPhone}
                      className="
                        bg-black
                        hover:bg-gray-800
                        transition
                        text-white
                        rounded-2xl
                        px-5
                        py-4
                        font-semibold
                      "
                    >

                      Načíst

                    </button>

                  </div>

                  <p className="text-sm text-gray-500 mt-2">

                    Telefon se porovnává i bez mezer a pomlček.

                  </p>

                </div>

                <div className="grid md:grid-cols-2 gap-5">

                  <div>

                    <label className="block mb-2 font-semibold">

                      Jméno

                    </label>

                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) =>
                        setFirstName(
                          e.target.value
                        )
                      }
                      className="
                        w-full
                        border
                        rounded-2xl
                        p-4
                        bg-white
                      "
                    />

                  </div>

                  <div>

                    <label className="block mb-2 font-semibold">

                      Příjmení

                    </label>

                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) =>
                        setLastName(
                          e.target.value
                        )
                      }
                      className="
                        w-full
                        border
                        rounded-2xl
                        p-4
                        bg-white
                      "
                    />

                  </div>

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
                    placeholder="Volitelné"
                    className="
                      w-full
                      border
                      rounded-2xl
                      p-4
                      bg-white
                    "
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
                      placeholder="Volitelné"
                      className="
                        w-full
                        border
                        rounded-2xl
                        p-4
                        bg-white
                      "
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
                      placeholder="Volitelné"
                      className="
                        w-full
                        border
                        rounded-2xl
                        p-4
                        bg-white
                      "
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
                      placeholder="Volitelné"
                      className="
                        w-full
                        border
                        rounded-2xl
                        p-4
                        bg-white
                      "
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
                      placeholder="Volitelné"
                      className="
                        w-full
                        border
                        rounded-2xl
                        p-4
                        bg-white
                      "
                    />

                  </div>

                </div>

              </div>

            </section>

            <section className="bg-gray-50 rounded-3xl p-5 border border-gray-200">

              <div className="flex items-center gap-3 mb-5">

                <Wrench size={22} />

                <h2 className="text-2xl font-bold">

                  Stroj

                </h2>

              </div>

              <div className="grid gap-4">

                <div>

                  <label className="block mb-2 font-semibold">

                    Vyhledat stroj

                  </label>

                  <div className="relative">

                    <Search
                      size={18}
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
                      value={machineSearch}
                      onChange={(e) =>
                        setMachineSearch(
                          e.target.value
                        )
                      }
                      placeholder="Napište název stroje..."
                      className="
                        w-full
                        border
                        rounded-2xl
                        p-4
                        pl-11
                        text-lg
                        bg-white
                      "
                    />

                  </div>

                </div>

                <div className="grid gap-3 max-h-[320px] overflow-y-auto">

                  {filteredMachines.length === 0 ? (

                    <div className="bg-white rounded-2xl border p-4 text-gray-500">

                      Žádný stroj nenalezen

                    </div>

                  ) : (

                    filteredMachines.map(
                      machine => (

                        <button
                          key={machine.id}
                          type="button"
                          onClick={() => {

                            setMachineId(
                              machine.id
                            )

                            setMachineSearch(
                              machine.name
                            )
                          }}
                          className={`
                            border
                            rounded-2xl
                            p-4
                            text-left
                            transition
                            ${machineId === machine.id
                              ? 'border-black bg-black text-white'
                              : 'bg-white hover:bg-gray-50'}
                          `}
                        >

                          <div className="font-semibold text-lg">

                            {machine.name}

                          </div>

                          {machine.daily_price !== undefined && (

                            <div
                              className={`
                                text-sm
                                mt-1
                                ${machineId === machine.id
                                  ? 'text-gray-300'
                                  : 'text-gray-500'}
                              `}
                            >

                              {machine.daily_price} Kč / den

                            </div>

                          )}

                        </button>

                      )
                    )

                  )}

                </div>

                {selectedMachine && (

                  <div className="bg-white border rounded-2xl p-4 text-sm text-gray-600">

                    Vybraný stroj: <strong>{selectedMachine.name}</strong>

                  </div>

                )}

              </div>

            </section>

            <section className="bg-gray-50 rounded-3xl p-5 border border-gray-200">

              <div className="flex items-center gap-3 mb-5">

                <CalendarDays size={22} />

                <h2 className="text-2xl font-bold">

                  Termín

                </h2>

              </div>

              <div className="grid md:grid-cols-2 gap-5">

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
                      bg-white
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
                      bg-white
                    "
                  />

                </div>

              </div>

            </section>

            <section className="bg-gray-50 rounded-3xl p-5 border border-gray-200">

              <div className="flex items-center gap-3 mb-5">

                <FileText size={22} />

                <h2 className="text-2xl font-bold">

                  Poznámka

                </h2>

              </div>

              <textarea
                value={note}
                onChange={(e) =>
                  setNote(
                    e.target.value
                  )
                }
                rows={4}
                placeholder="Poznámka k rezervaci"
                className="
                  w-full
                  border
                  rounded-2xl
                  p-4
                  bg-white
                "
              />

            </section>

            <button
              onClick={saveReservation}
              disabled={saving}
              className="
                bg-black
                hover:bg-gray-800
                disabled:bg-gray-400
                transition
                text-white
                p-5
                rounded-2xl
                font-semibold
                text-lg
              "
            >

              {saving
                ? 'Ukládám rezervaci...'
                : 'Vytvořit rezervaci'}

            </button>

          </div>

        </div>

      </div>

    </main>
  )
}
