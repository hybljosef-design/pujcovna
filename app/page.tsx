'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Tesseract from 'tesseract.js'
import jsPDF from 'jspdf'

type Machine = {
  id: string
  name: string
  daily_price: number
  deposit: number
}

type Customer = {
  id: string
  first_name: string
  phone: string
  id_card: string
}

type Rental = {
  id: string
  rental_price: number
  deposit: number
  start_date: string
  end_date: string
  returned: boolean
  customers: {
    first_name: string
    phone: string
  }
  machines: {
    name: string
  }
}

export default function Home() {

  const [user, setUser] = useState<any>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [machines, setMachines] = useState<Machine[]>([])
  const [rentals, setRentals] = useState<Rental[]>([])

  const [selectedMachine, setSelectedMachine] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [idCard, setIdCard] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loadingOCR, setLoadingOCR] = useState(false)

  useEffect(() => {

    checkUser()

    const {
      data: authListener
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {

        setUser(session?.user || null)

        if (session?.user) {
          loadMachines()
          loadRentals()
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }

  }, [])

  async function checkUser() {

    const {
      data: { session }
    } = await supabase.auth.getSession()

    setUser(session?.user || null)

    if (session?.user) {
      loadMachines()
      loadRentals()
    }
  }

  async function login() {

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
    }
  }

  async function logout() {

    await supabase.auth.signOut()
  }

  async function loadMachines() {

    const { data, error } = await supabase
      .from('machines')
      .select('*')

    if (data) {
      setMachines(data)
    }

    if (error) {
      console.log(error)
    }
  }

  async function loadRentals() {

    const { data, error } = await supabase
      .from('rentals')
      .select(`
        *,
        customers (
          first_name,
          phone
        ),
        machines (
          name
        )
      `)
      .eq('returned', false)
      .order('created_at', { ascending: false })

    if (data) {
      setRentals(data as Rental[])
    }

    if (error) {
      console.log(error)
    }
  }

  async function markReturned(id: string) {

    const { error } = await supabase
      .from('rentals')
      .update({
        returned: true
      })
      .eq('id', id)

    if (error) {
      console.log(error)
      return
    }

    loadRentals()
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
      setIdCard(customer.id_card)

      alert('Zákazník nalezen')
    }
  }

  async function handleOCR(
    event: React.ChangeEvent<HTMLInputElement>
  ) {

    const file = event.target.files?.[0]

    if (!file) return

    setLoadingOCR(true)

    try {

      const result = await Tesseract.recognize(
        file,
        'eng'
      )

      const text = result.data.text

      const lines = text
        .split('\n')
        .filter(line => line.trim() !== '')

      if (lines.length > 0) {
        setCustomerName(lines[0])
      }

      const idMatch = text.match(/[A-Z0-9]{6,20}/)

      if (idMatch) {
        setIdCard(idMatch[0])
      }

      alert('OCR dokončeno')

    } catch (error) {

      console.log(error)

      alert('OCR chyba')

    } finally {

      setLoadingOCR(false)
    }
  }

  function generatePDF(
    machineName: string,
    deposit: number
  ) {

    const doc = new jsPDF()

    doc.setFontSize(20)

    doc.text('SMLOUVA O ZAPUJČENI', 20, 20)

    doc.setFontSize(12)

    doc.text(`Zakaznik: ${customerName}`, 20, 40)
    doc.text(`Telefon: ${phone}`, 20, 50)
    doc.text(`Cislo OP: ${idCard}`, 20, 60)

    doc.text(`Stroj: ${machineName}`, 20, 80)

    doc.text(`Od: ${startDate}`, 20, 90)
    doc.text(`Do: ${endDate}`, 20, 100)

    doc.text(`Cena: ${totalPrice} Kc`, 20, 120)
    doc.text(`Kauce: ${deposit} Kc`, 20, 130)

    doc.text(
      'Zakaznik odpovida za poskozeni stroje.',
      20,
      160
    )

    doc.text('Podpis zakaznika: ______________', 20, 220)

    doc.save('smlouva.pdf')
  }

  const selectedMachineData = machines.find(
    (m) => m.id === selectedMachine
  )

  const totalDays =
    startDate && endDate
      ? Math.ceil(
          (
            new Date(endDate).getTime() -
            new Date(startDate).getTime()
          ) / (1000 * 60 * 60 * 24)
        )
      : 0

  const totalPrice =
    selectedMachineData
      ? totalDays * selectedMachineData.daily_price
      : 0

  async function createRental() {

    let customerId = ''

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .maybeSingle()

    if (existingCustomer) {

      customerId = existingCustomer.id

    } else {

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert([
          {
            first_name: customerName,
            phone: phone,
            id_card: idCard
          }
        ])
        .select()
        .single()

      if (customerError) {
        console.log(customerError)
        return
      }

      customerId = customer.id
    }

    const machine = machines.find(
      (m) => m.id === selectedMachine
    )

    if (!machine) {
      alert('Vyberte stroj')
      return
    }

    const { error: rentalError } = await supabase
      .from('rentals')
      .insert([
        {
          customer_id: customerId,
          machine_id: machine.id,
          rental_price: totalPrice,
          deposit: machine.deposit,
          start_date: startDate,
          end_date: endDate,
          returned: false
        }
      ])

    if (rentalError) {
      console.log(rentalError)
      return
    }

    generatePDF(
      machine.name,
      machine.deposit
    )

    alert('Půjčka vytvořena')

    loadRentals()

    setCustomerName('')
    setPhone('')
    setIdCard('')
    setSelectedMachine('')
    setStartDate('')
    setEndDate('')
  }

  if (!user) {

    return (

      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">

        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

          <h1 className="text-3xl font-bold mb-6 text-center">
            Přihlášení
          </h1>

          <div className="space-y-4">

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-xl p-3"
            />

            <input
              type="password"
              placeholder="Heslo"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-xl p-3"
            />

            <button
              onClick={login}
              className="w-full bg-black text-white rounded-xl p-4 text-lg"
            >
              Přihlásit se
            </button>

          </div>

        </div>

      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4">

      <div className="max-w-6xl mx-auto">

        <div className="flex justify-between items-center mb-6">

          <h1 className="text-3xl font-bold">
            Systém půjčovny
          </h1>

          <button
            onClick={logout}
            className="bg-red-600 text-white rounded-xl px-4 py-2"
          >
            Odhlásit
          </button>

        </div>

        <div className="grid md:grid-cols-2 gap-6">

          <div className="bg-white rounded-2xl shadow-lg p-6">

            <h2 className="text-3xl font-bold mb-6">
              Nová půjčka
            </h2>

            <div className="space-y-4">

              <select
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
                className="w-full border rounded-xl p-3"
              >
                <option value="">
                  Vyberte stroj
                </option>

                {machines.map((machine) => (
                  <option
                    key={machine.id}
                    value={machine.id}
                  >
                    {machine.name} — {machine.daily_price} Kč / den
                  </option>
                ))}
              </select>

              <div className="border rounded-xl p-4 bg-gray-50">

                <p className="mb-2 font-semibold">
                  Nahrát doklad
                </p>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleOCR}
                />

                {loadingOCR && (
                  <p className="mt-2">
                    Načítám text...
                  </p>
                )}

              </div>

              <input
                type="text"
                placeholder="Telefon"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={searchCustomer}
                className="w-full border rounded-xl p-3"
              />

              <input
                type="text"
                placeholder="Jméno zákazníka"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border rounded-xl p-3"
              />

              <input
                type="text"
                placeholder="Číslo OP"
                value={idCard}
                onChange={(e) => setIdCard(e.target.value)}
                className="w-full border rounded-xl p-3"
              />

              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded-xl p-3"
              />

              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded-xl p-3"
              />

              <div className="bg-gray-100 rounded-xl p-4 space-y-2">

                <div className="flex justify-between">
                  <span>Počet dní:</span>
                  <span>{totalDays}</span>
                </div>

                <div className="flex justify-between">
                  <span>Cena půjčovného:</span>
                  <span>{totalPrice} Kč</span>
                </div>

                <div className="flex justify-between">
                  <span>Kauce:</span>
                  <span>
                    {selectedMachineData?.deposit || 0} Kč
                  </span>
                </div>

              </div>

              <button
                onClick={createRental}
                className="w-full bg-black text-white rounded-xl p-4 text-lg"
              >
                Vytvořit smlouvu
              </button>

            </div>

          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">

            <h2 className="text-3xl font-bold mb-6">
              Aktivní půjčky
            </h2>

            <div className="space-y-4">

              {rentals.length === 0 && (
                <p>Žádné aktivní půjčky</p>
              )}

              {rentals.map((rental) => (

                <div
                  key={rental.id}
                  className="border rounded-xl p-4"
                >

                  <div className="space-y-1">

                    <p className="font-bold text-lg">
                      {rental.customers.first_name}
                    </p>

                    <p>
                      {rental.machines.name}
                    </p>

                    <p>
                      {rental.customers.phone}
                    </p>

                    <p>
                      Cena: {rental.rental_price} Kč
                    </p>

                    <p>
                      Kauce: {rental.deposit} Kč
                    </p>

                    <p>
                      Do:
                      {' '}
                      {new Date(
                        rental.end_date
                      ).toLocaleString()}
                    </p>

                  </div>

                  <button
                    onClick={() => markReturned(rental.id)}
                    className="mt-4 w-full bg-green-600 text-white rounded-xl p-3"
                  >
                    Vráceno
                  </button>

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

    </main>
  )
}