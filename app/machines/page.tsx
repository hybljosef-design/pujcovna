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
  Pencil,
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
  purchase_price?: number
  purchase_date?: string
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

  const [purchasePrice, setPurchasePrice] =
    useState('')

  const [purchaseDate, setPurchaseDate] =
    useState('')

  const [editingMachine, setEditingMachine] =
    useState<Machine | null>(null)

  const [editName, setEditName] =
    useState('')

  const [editDailyPrice, setEditDailyPrice] =
    useState('')

  const [editDeposit, setEditDeposit] =
    useState('')

  const [editBarcode, setEditBarcode] =
    useState('')

  const [editPurchasePrice, setEditPurchasePrice] =
    useState('')

  const [editPurchaseDate, setEditPurchaseDate] =
    useState('')

  const [editLoading, setEditLoading] =
    useState(false)

  const [createOpen, setCreateOpen] =
    useState(false)

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

  function closeCreateMachine() {

    setCreateOpen(false)

    setName('')
    setDailyPrice('')
    setDeposit('')
    setBarcode('')
    setPurchasePrice('')
    setPurchaseDate('')
  }

  async function createMachine() {

    if (role !== 'admin') {

      alert(
        'Stroj může přidat pouze admin'
      )

      return
    }

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
          purchase_price:
            Number(purchasePrice || 0),
          purchase_date:
            purchaseDate || null,
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

    closeCreateMachine()

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

  function openEditMachine(
    machine: Machine
  ) {

    if (role !== 'admin') {

      alert(
        'Úpravy může provádět pouze admin'
      )

      return
    }

    setEditingMachine(machine)

    setEditName(
      machine.name || ''
    )

    setEditDailyPrice(
      String(machine.daily_price || '')
    )

    setEditDeposit(
      String(machine.deposit || '')
    )

    setEditBarcode(
      machine.barcode || ''
    )

    setEditPurchasePrice(
      String(machine.purchase_price || '')
    )

    setEditPurchaseDate(
      machine.purchase_date || ''
    )
  }

  function closeEditMachine() {

    setEditingMachine(null)

    setEditName('')
    setEditDailyPrice('')
    setEditDeposit('')
    setEditBarcode('')
    setEditPurchasePrice('')
    setEditPurchaseDate('')
  }

  async function updateMachine() {

    if (!editingMachine) return

    if (
      !editName.trim() ||
      !editDailyPrice ||
      !editDeposit
    ) {

      alert(
        'Vyplňte název, cenu za den a kauci'
      )

      return
    }

    setEditLoading(true)

    const { error } = await supabase
      .from('machines')
      .update({
        name:
          editName.trim(),
        daily_price:
          Number(editDailyPrice),
        deposit:
          Number(editDeposit),
        barcode:
          editBarcode.trim() ||
          editingMachine.barcode ||
          editingMachine.id,
        purchase_price:
          Number(editPurchasePrice || 0),
        purchase_date:
          editPurchaseDate || null
      })
      .eq(
        'id',
        editingMachine.id
      )

    if (error) {

      console.log(error)

      alert(error.message)

      setEditLoading(false)

      return
    }

    closeEditMachine()

    await loadMachines()

    alert(
      'Stroj upraven'
    )

    setEditLoading(false)
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

        <div className="mb-6">

          <button
            type="button"
            onClick={() =>
              window.location.href = '/dashboard'
            }
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

        {role === 'admin' && (

        <div className="
          bg-white
          rounded-3xl
          shadow-lg
          p-5
          mb-8
          flex
          flex-col
          sm:flex-row
          sm:items-center
          sm:justify-between
          gap-4
        ">

          <div>

            <h2 className="
              text-2xl
              font-bold
              mb-1
            ">

              Stroje

            </h2>

            <p className="
              text-gray-500
            ">

              Přidání nového stroje otevře samostatný formulář.

            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              setCreateOpen(true)
            }
            className="
              bg-black
              hover:bg-gray-800
              transition
              text-white
              px-6
              py-4
              rounded-2xl
              flex
              items-center
              justify-center
              gap-3
              text-lg
              font-semibold
            "
          >

            <Plus size={22} />

            Přidat stroj

          </button>

        </div>


        )}

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

                        <div className="
                          flex
                          items-center
                          gap-3
                          shrink-0
                        ">

                          <button
                            onClick={() =>
                              openEditMachine(
                                machine
                              )
                            }
                            className="
                              text-gray-500
                              hover:text-black
                            "
                            title="Upravit stroj"
                          >

                            <Pencil
                              size={22}
                            />

                          </button>

                          <button
                            onClick={() =>
                              deleteMachine(
                                machine.id
                              )
                            }
                            className="
                              text-red-500
                              hover:text-red-700
                            "
                            title="Smazat stroj"
                          >

                            <Trash2
                              size={22}
                            />

                          </button>

                        </div>

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

{role === 'admin' && (

                      <div className="
                        flex
                        items-center
                        justify-between
                      ">

                        <span className="
                          text-gray-500
                        ">

                          Pořizovací cena

                        </span>

                        <span className="
                          font-bold
                          text-lg
                        ">

                          {machine.purchase_price || 0} Kč

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

                          Datum pořízení

                        </span>

                        <span className="
                          font-bold
                          text-lg
                        ">

                          {machine.purchase_date
                            ? new Date(machine.purchase_date).toLocaleDateString('cs-CZ')
                            : '-'}

                        </span>

                      </div>

                      )}

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

      {createOpen && role === 'admin' && (

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

                <h2 className="
                  text-3xl
                  font-bold
                  mb-2
                ">

                  Přidat nový stroj

                </h2>

                <p className="
                  text-gray-500
                ">

                  Vyplň základní údaje stroje. Barcode můžeš zadat ručně, nebo se vygeneruje automaticky.

                </p>

              </div>

              <button
                type="button"
                onClick={closeCreateMachine}
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

            <div className="
              grid
              md:grid-cols-2
              gap-5
            ">

              <div>

                <label className="
                  block
                  mb-2
                  font-semibold
                ">

                  Název stroje

                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  placeholder="Např. Vibrační pěch Ammann"
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

                <label className="
                  block
                  mb-2
                  font-semibold
                ">

                  Barcode

                </label>

                <input
                  type="text"
                  value={barcode}
                  onChange={(e) =>
                    setBarcode(
                      e.target.value
                    )
                  }
                  placeholder="Volitelné"
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

                <label className="
                  block
                  mb-2
                  font-semibold
                ">

                  Cena / den

                </label>

                <input
                  type="number"
                  value={dailyPrice}
                  onChange={(e) =>
                    setDailyPrice(
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

                <label className="
                  block
                  mb-2
                  font-semibold
                ">

                  Kauce

                </label>

                <input
                  type="number"
                  value={deposit}
                  onChange={(e) =>
                    setDeposit(
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

                <label className="
                  block
                  mb-2
                  font-semibold
                ">

                  Pořizovací cena

                </label>

                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) =>
                    setPurchasePrice(
                      e.target.value
                    )
                  }
                  placeholder="Volitelné"
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

                <label className="
                  block
                  mb-2
                  font-semibold
                ">

                  Datum pořízení

                </label>

                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) =>
                    setPurchaseDate(
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

            <div className="
              flex
              flex-col
              sm:flex-row
              gap-3
              mt-8
            ">

              <button
                type="button"
                onClick={createMachine}
                disabled={loading}
                className="
                  bg-black
                  hover:bg-gray-800
                  disabled:bg-gray-400
                  transition
                  text-white
                  px-6
                  py-4
                  rounded-2xl
                  font-semibold
                  text-lg
                  flex
                  items-center
                  justify-center
                  gap-3
                "
              >

                <Plus size={22} />

                {loading
                  ? 'Vytvářím...'
                  : 'Uložit stroj'}

              </button>

              <button
                type="button"
                onClick={closeCreateMachine}
                className="
                  bg-gray-100
                  hover:bg-gray-200
                  transition
                  px-6
                  py-4
                  rounded-2xl
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


      {editingMachine && (

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

                <h2 className="
                  text-3xl
                  font-bold
                  mb-2
                ">

                  Upravit stroj

                </h2>

                <p className="
                  text-gray-500
                ">

                  Změny se projeví v půjčkách, QR štítcích i statistikách.

                </p>

              </div>

              <button
                type="button"
                onClick={closeEditMachine}
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

            <div className="
              grid
              md:grid-cols-2
              gap-5
            ">

              <div>

                <label className="
                  block
                  mb-2
                  font-semibold
                ">

                  Název stroje

                </label>

                <input
                  type="text"
                  value={editName}
                  onChange={(e) =>
                    setEditName(
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

                <label className="
                  block
                  mb-2
                  font-semibold
                ">

                  Barcode

                </label>

                <input
                  type="text"
                  value={editBarcode}
                  onChange={(e) =>
                    setEditBarcode(
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

                <label className="
                  block
                  mb-2
                  font-semibold
                ">

                  Cena / den

                </label>

                <input
                  type="number"
                  value={editDailyPrice}
                  onChange={(e) =>
                    setEditDailyPrice(
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

                <label className="
                  block
                  mb-2
                  font-semibold
                ">

                  Kauce

                </label>

                <input
                  type="number"
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

              <div>

                <label className="
                  block
                  mb-2
                  font-semibold
                ">

                  Pořizovací cena

                </label>

                <input
                  type="number"
                  value={editPurchasePrice}
                  onChange={(e) =>
                    setEditPurchasePrice(
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

                <label className="
                  block
                  mb-2
                  font-semibold
                ">

                  Datum pořízení

                </label>

                <input
                  type="date"
                  value={editPurchaseDate}
                  onChange={(e) =>
                    setEditPurchaseDate(
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

            <div className="
              flex
              flex-col
              sm:flex-row
              gap-3
              mt-8
            ">

              <button
                type="button"
                onClick={updateMachine}
                disabled={editLoading}
                className="
                  bg-black
                  hover:bg-gray-800
                  disabled:bg-gray-400
                  transition
                  text-white
                  px-6
                  py-4
                  rounded-2xl
                  font-semibold
                  text-lg
                "
              >

                {editLoading
                  ? 'Ukládám...'
                  : 'Uložit změny'}

              </button>

              <button
                type="button"
                onClick={closeEditMachine}
                className="
                  bg-gray-100
                  hover:bg-gray-200
                  transition
                  px-6
                  py-4
                  rounded-2xl
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
