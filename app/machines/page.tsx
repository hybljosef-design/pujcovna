'use client'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import { supabase } from '../../lib/supabase'

import QRCode from 'qrcode'

import { generateQrLabelPdf } from '../../lib/generateQrLabelPdf'

import {
  Plus,
  Trash2,
  Wrench,
  CheckCircle,
  QrCode,
  Shield,
  Search
} from 'lucide-react'

type Machine = {
  id: string
  name: string
  daily_price: number
  deposit: number
  barcode?: string
  active?: boolean
  status?: string
  qr?: string
}

export default function MachinesPage() {

  const [machines, setMachines] =
    useState<Machine[]>([])

  const [name, setName] =
    useState('')

  const [dailyPrice, setDailyPrice] =
    useState('')

  const [deposit, setDeposit] =
    useState('')

  const [barcode, setBarcode] =
    useState('')

  const [search, setSearch] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const [role, setRole] =
    useState('employee')

  useEffect(() => {

    loadProfile()

    loadMachines()

  }, [])

  async function loadProfile() {

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (data?.role) {

      setRole(data.role)
    }
  }

  async function loadMachines() {

    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .order('created_at', {
        ascending: false
      })

    if (error) {

      console.log(error)

      alert(error.message)

      return
    }

    const preparedMachines =
      await Promise.all(

        (data || []).map(
          async (machine) => {

            let qr = ''

            try {

              qr =
                await QRCode.toDataURL(
                  machine.barcode ||
                  machine.id
                )

            } catch (error) {

              console.log(error)
            }

            return {
              ...machine,
              qr
            }
          }
        )
      )

    setMachines(preparedMachines)
  }

  async function createMachine() {

    if (
      !name ||
      !dailyPrice ||
      !deposit
    ) {

      alert(
        'Vyplňte všechna pole'
      )

      return
    }

    setLoading(true)

    const machineBarcode =
      barcode.trim() ||
      `M-${Date.now()}`

    const { error } = await supabase
      .from('machines')
      .insert([
        {
          name,
          daily_price:
            Number(dailyPrice),
          deposit:
            Number(deposit),
          barcode:
            machineBarcode,
          active: true,
          status: 'available'
        }
      ])

    if (error) {

      console.log(error)

      alert(error.message)

      setLoading(false)

      return
    }

    setName('')
    setDailyPrice('')
    setDeposit('')
    setBarcode('')

    await loadMachines()

    alert('Stroj vytvořen')

    setLoading(false)
  }

  async function deleteMachine(
    id: string
  ) {

    if (role !== 'admin') {

      alert(
        'Mazání může provádět pouze admin'
      )

      return
    }

    const confirmDelete =
      confirm(
        'Opravdu smazat stroj?'
      )

    if (!confirmDelete) return

    const { error } = await supabase
      .from('machines')
      .delete()
      .eq('id', id)

    if (error) {

      console.log(error)

      alert(error.message)

      return
    }

    await loadMachines()
  }

  async function toggleActive(
    machine: Machine
  ) {

    if (role !== 'admin') {

      alert(
        'Tuto akci může provádět pouze admin'
      )

      return
    }

    const { error } = await supabase
      .from('machines')
      .update({
        active:
          !machine.active
      })
      .eq('id', machine.id)

    if (error) {

      console.log(error)

      alert(error.message)

      return
    }

    await loadMachines()
  }

  async function changeStatus(
    machine: Machine,
    status: string
  ) {

    if (role !== 'admin') {

      alert(
        'Status může měnit pouze admin'
      )

      return
    }

    const { error } = await supabase
      .from('machines')
      .update({
        status
      })
      .eq('id', machine.id)

    if (error) {

      console.log(error)

      alert(error.message)

      return
    }

    await loadMachines()
  }

  const filteredMachines =
    useMemo(() => {

      return machines.filter(
        machine => {

          const value =
            search.toLowerCase()

          return (

            machine.name
              .toLowerCase()
              .includes(value) ||

            machine.barcode
              ?.toLowerCase()
              .includes(value)

          )
        }
      )

    }, [machines, search])

  function getStatusInfo(
    status?: string
  ) {

    switch (status) {

      case 'available':

        return {
          label: 'Dostupný',
          color:
            'bg-green-100 text-green-700 border-green-200',
          dot: 'bg-green-500'
        }

      case 'rented':

        return {
          label: 'Půjčený',
          color:
            'bg-red-100 text-red-700 border-red-200',
          dot: 'bg-red-500'
        }

      case 'service':

        return {
          label: 'Servis',
          color:
            'bg-orange-100 text-orange-700 border-orange-200',
          dot: 'bg-orange-500'
        }

      default:

        return {
          label: 'Neznámý',
          color:
            'bg-gray-100 text-gray-700 border-gray-200',
          dot: 'bg-gray-500'
        }
    }
  }

  const availableCount =
    machines.filter(
      machine =>
        machine.status ===
        'available'
    ).length

  const rentedCount =
    machines.filter(
      machine =>
        machine.status ===
        'rented'
    ).length

  const serviceCount =
    machines.filter(
      machine =>
        machine.status ===
        'service'
    ).length

  return (

    <main className="
      min-h-screen
      bg-gray-100
      p-4
      lg:p-10
    ">

      <div className="
        max-w-7xl
        mx-auto
      ">

        <div className="
          flex
          flex-col
          xl:flex-row
          xl:items-center
          xl:justify-between
          gap-5
          mb-10
        ">

          <div>

            <h1 className="
              text-4xl
              lg:text-5xl
              font-bold
              mb-3
            ">

              Správa strojů

            </h1>

            <p className="
              text-gray-500
              text-lg
            ">

              Evidence a správa půjčovaných strojů

            </p>

          </div>

          <div className="
            bg-black
            text-white
            px-5
            py-4
            rounded-2xl
            flex
            items-center
            gap-3
            w-fit
          ">

            <Shield size={20} />

            {role === 'admin'
              ? 'ADMIN'
              : 'ZAMĚSTNANEC'}

          </div>

        </div>

        <div className="
          grid
          grid-cols-2
          lg:grid-cols-4
          gap-4
          mb-8
        ">

          <div className="
            bg-white
            rounded-3xl
            shadow-lg
            p-6
          ">

            <p className="
              text-gray-500
              mb-3
            ">

              Celkem strojů

            </p>

            <h2 className="
              text-4xl
              font-bold
            ">

              {machines.length}

            </h2>

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
              gap-2
              mb-3
            ">

              <div className="
                w-3
                h-3
                rounded-full
                bg-green-500
              " />

              <p className="
                text-gray-500
              ">

                Dostupné

              </p>

            </div>

            <h2 className="
              text-4xl
              font-bold
              text-green-600
            ">

              {availableCount}

            </h2>

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
              gap-2
              mb-3
            ">

              <div className="
                w-3
                h-3
                rounded-full
                bg-red-500
              " />

              <p className="
                text-gray-500
              ">

                Půjčené

              </p>

            </div>

            <h2 className="
              text-4xl
              font-bold
              text-red-600
            ">

              {rentedCount}

            </h2>

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
              gap-2
              mb-3
            ">

              <div className="
                w-3
                h-3
                rounded-full
                bg-orange-500
              " />

              <p className="
                text-gray-500
              ">

                Servis

              </p>

            </div>

            <h2 className="
              text-4xl
              font-bold
              text-orange-600
            ">

              {serviceCount}

            </h2>

          </div>

        </div>

        <div className="
          bg-white
          rounded-3xl
          shadow-lg
          p-8
          mb-8
        ">

          <div className="
            grid
            md:grid-cols-2
            xl:grid-cols-4
            gap-4
          ">

            <input
              type="text"
              placeholder="Název stroje"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              className="
                border
                rounded-2xl
                p-4
                text-lg
              "
            />

            <input
              type="number"
              placeholder="Cena / den"
              value={dailyPrice}
              onChange={(e) =>
                setDailyPrice(
                  e.target.value
                )
              }
              className="
                border
                rounded-2xl
                p-4
                text-lg
              "
            />

            <input
              type="number"
              placeholder="Kauce"
              value={deposit}
              onChange={(e) =>
                setDeposit(
                  e.target.value
                )
              }
              className="
                border
                rounded-2xl
                p-4
                text-lg
              "
            />

            <input
              type="text"
              placeholder="Barcode (volitelné)"
              value={barcode}
              onChange={(e) =>
                setBarcode(
                  e.target.value
                )
              }
              className="
                border
                rounded-2xl
                p-4
                text-lg
              "
            />

          </div>

          <button
            onClick={createMachine}
            disabled={loading}
            className="
              mt-6
              bg-black
              hover:bg-gray-800
              transition
              text-white
              px-6
              py-4
              rounded-2xl
              flex
              items-center
              gap-3
              text-lg
              font-semibold
            "
          >

            <Plus size={22} />

            {loading
              ? 'Vytvářím...'
              : 'Přidat stroj'}

          </button>

        </div>

        <div className="
          bg-white
          rounded-3xl
          shadow-lg
          p-5
          mb-8
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
                Vyhledat stroj nebo barcode...
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

        <div className="
          grid
          md:grid-cols-2
          xl:grid-cols-3
          gap-6
        ">

          {filteredMachines.map(
            (machine) => {

              const status =
                getStatusInfo(
                  machine.status
                )

              return (

                <div
                  key={machine.id}
                  className="
                    bg-white
                    rounded-3xl
                    shadow-lg
                    overflow-hidden
                  "
                >

                  <div className={`
                    px-6
                    py-4
                    border-b

                    ${status.color}
                  `}>

                    <div className="
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

                        <div className={`
                          w-3
                          h-3
                          rounded-full
                          ${status.dot}
                        `} />

                        <span className="
                          font-bold
                        ">

                          {status.label}

                        </span>

                      </div>

                      {!machine.active && (

                        <div className="
                          bg-gray-800
                          text-white
                          text-xs
                          font-bold
                          px-3
                          py-1
                          rounded-xl
                        ">

                          NEAKTIVNÍ

                        </div>

                      )}

                    </div>

                  </div>

                  <div className="p-6">

                    <div className="
                      flex
                      items-start
                      justify-between
                      gap-4
                      mb-6
                    ">

                      <div>

                        <h2 className="
                          text-2xl
                          font-bold
                          mb-2
                        ">

                          {machine.name}

                        </h2>

                        <p className="
                          text-gray-500
                          break-all
                        ">

                          Barcode:
                          {' '}
                          {machine.barcode || '-'}

                        </p>

                      </div>

                      {role === 'admin' && (

                        <button
                          onClick={() =>
                            deleteMachine(
                              machine.id
                            )
                          }
                          className="
                            text-red-500
                            hover:text-red-700
                            shrink-0
                          "
                        >

                          <Trash2
                            size={22}
                          />

                        </button>

                      )}

                    </div>

                    <div className="
                      space-y-4
                      mb-6
                    ">

                      <div className="
                        flex
                        items-center
                        justify-between
                      ">

                        <span className="
                          text-gray-500
                        ">

                          Cena / den

                        </span>

                        <span className="
                          font-bold
                          text-lg
                        ">

                          {machine.daily_price} Kč

                        </span>

                      </div>

                      <div className="
                        flex
                        items-center
                        justify-between
                      ">

                        <span className="
                          text-gray-500
                        ">

                          Kauce

                        </span>

                        <span className="
                          font-bold
                          text-lg
                        ">

                          {machine.deposit} Kč

                        </span>

                      </div>

                    </div>

                    {role === 'admin' && (

                      <div className="
                        grid
                        grid-cols-2
                        gap-3
                        mb-6
                      ">

                        <button
                          onClick={() =>
                            changeStatus(
                              machine,
                              'available'
                            )
                          }
                          className="
                            bg-green-100
                            text-green-700
                            hover:bg-green-200
                            transition
                            px-4
                            py-3
                            rounded-2xl
                            flex
                            items-center
                            justify-center
                            gap-2
                            font-semibold
                          "
                        >

                          <CheckCircle
                            size={18}
                          />

                          Dostupný

                        </button>

                        <button
                          onClick={() =>
                            changeStatus(
                              machine,
                              'service'
                            )
                          }
                          className="
                            bg-orange-100
                            text-orange-700
                            hover:bg-orange-200
                            transition
                            px-4
                            py-3
                            rounded-2xl
                            flex
                            items-center
                            justify-center
                            gap-2
                            font-semibold
                          "
                        >

                          <Wrench
                            size={18}
                          />

                          Servis

                        </button>

                        <button
                          onClick={() =>
                            toggleActive(
                              machine
                            )
                          }
                          className={`
                            col-span-2
                            px-4
                            py-4
                            rounded-2xl
                            font-semibold
                            transition

                            ${machine.active
                              ? 'bg-black text-white hover:bg-gray-800'
                              : 'bg-gray-300 hover:bg-gray-400'}
                          `}
                        >

                          {machine.active
                            ? 'Aktivní'
                            : 'Neaktivní'}

                        </button>

                      </div>

                    )}

                    <div className="
                      bg-gray-100
                      rounded-3xl
                      p-5
                    ">

                      <div className="
                        flex
                        items-center
                        gap-2
                        mb-4
                      ">

                        <QrCode
                          size={18}
                        />

                        <span className="
                          font-semibold
                        ">

                          QR štítek

                        </span>

                      </div>

                      {machine.qr && (

                        <img
                          src={machine.qr}
                          alt="QR"
                          className="
                            w-44
                            h-44
                            mx-auto
                          "
                        />

                      )}

                      <button
                        onClick={() =>
                          generateQrLabelPdf({
                            machineName:
                              machine.name,
                            barcode:
                              machine.barcode ||
                              machine.id
                          })
                        }
                        className="
                          mt-5
                          w-full
                          bg-black
                          hover:bg-gray-800
                          transition
                          text-white
                          py-4
                          rounded-2xl
                          font-semibold
                          text-lg
                        "
                      >

                        Tisk QR štítku

                      </button>

                    </div>

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