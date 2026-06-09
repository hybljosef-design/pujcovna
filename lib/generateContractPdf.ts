import jsPDF from 'jspdf'

import { CONTRACT_TEMPLATE } from './contractTemplate'

type GenerateContractParams = {

  contractNumber: string

  customerName: string

  customerLastName: string

  phone: string

  idCard: string

  street?: string

  houseNumber?: string

  zip?: string

  city?: string

  machineName: string

  startDate: string

  endDate: string

  totalDays: number

  totalPrice: number

  deposit: number

  signature?: string
}

async function loadFont(
  path: string
): Promise<string> {

  const response = await fetch(path)

  const font = await response.arrayBuffer()

  let binary = ''

  const bytes = new Uint8Array(font)

  const len = bytes.byteLength

  for (let i = 0; i < len; i++) {

    binary += String.fromCharCode(bytes[i])
  }

  return btoa(binary)
}

async function loadLogo(): Promise<string> {

  const response = await fetch('/logo.png')

  const blob = await response.blob()

  return await new Promise((resolve) => {

    const reader = new FileReader()

    reader.onloadend = () => {

      resolve(reader.result as string)
    }

    reader.readAsDataURL(blob)
  })
}

export async function generateContractPdf({
  contractNumber,
  customerName,
  customerLastName,
  phone,
  idCard,
  street,
  houseNumber,
  zip,
  city,
  machineName,
  startDate,
  endDate,
  totalDays,
  totalPrice,
  deposit,
  signature
}: GenerateContractParams) {

  const regularFont =
    await loadFont('/fonts/Roboto-Regular.ttf')

  const mediumFont =
    await loadFont('/fonts/Roboto-Medium.ttf')

  const boldFont =
    await loadFont('/fonts/Roboto-Bold.ttf')

  const logoBase64 =
    await loadLogo()

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  doc.setFillColor(255, 255, 255)

  doc.rect(
    0,
    0,
    210,
    297,
    'F'
  )

  doc.addFileToVFS(
    'Roboto-Regular.ttf',
    regularFont
  )

  doc.addFont(
    'Roboto-Regular.ttf',
    'Roboto',
    'normal'
  )

  doc.addFileToVFS(
    'Roboto-Medium.ttf',
    mediumFont
  )

  doc.addFont(
    'Roboto-Medium.ttf',
    'Roboto',
    'medium'
  )

  doc.addFileToVFS(
    'Roboto-Bold.ttf',
    boldFont
  )

  doc.addFont(
    'Roboto-Bold.ttf',
    'Roboto',
    'bold'
  )

  const black = 25

  const gray = 95

  const lightGray = 225

  const left = 16

  const right = 194

  let y = 16

  doc.addImage(
    logoBase64,
    'PNG',
    left,
    y,
    11,
    11
  )

  doc.setFont('Roboto', 'bold')

  doc.setFontSize(15)

  doc.setTextColor(black)

  doc.text(
    'NAPP-MB s.r.o.',
    32,
    21
  )

  doc.setFont('Roboto', 'normal')

  doc.setFontSize(8.5)

  doc.setTextColor(gray)

  doc.text(
    'Palackého náměstí 8, Dobrovice 294 41',
    32,
    26
  )

  doc.text(
    'IČO: 04493737',
    148,
    21
  )

  doc.text(
    'Tel: 601 337 805',
    148,
    26
  )

  y = 34

  doc.setDrawColor(lightGray)

  doc.line(
    left,
    y,
    right,
    y
  )

  y += 10

  doc.setFont(
    'Roboto',
    'bold'
  )

  doc.setFontSize(17)

  doc.setTextColor(black)

  doc.text(
    CONTRACT_TEMPLATE.contractTitle,
    left,
    y
  )

  doc.setFont(
    'Roboto',
    'normal'
  )

  doc.setFontSize(8.5)

  doc.setTextColor(gray)

  doc.text(
    `Číslo smlouvy: ${contractNumber}`,
    148,
    y
  )

  y += 10

  doc.setFont(
    'Roboto',
    'medium'
  )

  doc.setFontSize(8)

  doc.setTextColor(gray)

  doc.text(
    'PRONAJÍMATEL',
    left,
    y
  )

  doc.text(
    'NÁJEMCE',
    110,
    y
  )

  y += 5

  doc.setFont(
    'Roboto',
    'normal'
  )

  doc.setFontSize(9.5)

  doc.setTextColor(black)

  doc.text(
    CONTRACT_TEMPLATE.company.name,
    left,
    y
  )

  doc.text(
    `${customerName} ${customerLastName}`,
    110,
    y
  )

  y += 5

  doc.text(
    `IČO: ${CONTRACT_TEMPLATE.company.ico}`,
    left,
    y
  )

  doc.text(
    `Telefon: ${phone}`,
    110,
    y
  )

  y += 5

  doc.text(
    `DIČ: ${CONTRACT_TEMPLATE.company.dic}`,
    left,
    y
  )

  doc.text(
    `Číslo OP: ${idCard}`,
    110,
    y
  )

  y += 5

  doc.text(
    CONTRACT_TEMPLATE.company.address,
    left,
    y
  )

  const streetLine =
    [street, houseNumber]
      .filter(Boolean)
      .join(' ')

  const cityLine =
    [zip, city]
      .filter(Boolean)
      .join(' ')

  if (streetLine) {

    doc.text(
      streetLine,
      110,
      y
    )
  }

  y += 5

  doc.text(
    CONTRACT_TEMPLATE.company.city,
    left,
    y
  )

  if (cityLine) {

    doc.text(
      cityLine,
      110,
      y
    )
  }

  y += 12

  doc.setDrawColor(lightGray)

  doc.rect(
    left,
    y,
    178,
    38
  )

  doc.line(left, y + 9.5, right, y + 9.5)
  doc.line(left, y + 19, right, y + 19)
  doc.line(left, y + 28.5, right, y + 28.5)

  doc.line(72, y, 72, y + 38)

  doc.setFont(
    'Roboto',
    'medium'
  )

  doc.setFontSize(8.3)

  doc.setTextColor(gray)

  doc.text('Stroj', 20, y + 6)
  doc.text('Začátek půjčky', 20, y + 15.5)
  doc.text('Konec půjčky', 20, y + 25)
  doc.text('Cena / Kauce / Dny', 20, y + 34)

  doc.setFont(
    'Roboto',
    'normal'
  )

  doc.setFontSize(8.7)

  doc.setTextColor(black)

  doc.text(
    machineName,
    76,
    y + 6
  )

  doc.text(
    new Date(startDate).toLocaleString('cs-CZ'),
    76,
    y + 15.5
  )

  doc.text(
    new Date(endDate).toLocaleString('cs-CZ'),
    76,
    y + 25
  )

  doc.text(
    `${totalPrice} Kč   |   ${deposit} Kč   |   ${totalDays} dnů`,
    76,
    y + 34
  )

  y += 50

  CONTRACT_TEMPLATE.legalText.forEach(
    (section) => {

      doc.setFont(
        'Roboto',
        'medium'
      )

      doc.setFontSize(8.2)

      doc.setTextColor(black)

      doc.text(
        section.title,
        left,
        y
      )

      y += 4

      doc.setFont(
        'Roboto',
        'normal'
      )

      doc.setFontSize(7.7)

      doc.setTextColor(gray)

      const splitText =
        doc.splitTextToSize(
          section.text
            .replace(/\n/g, ' ')
            .trim(),
          178
        )

      doc.text(
        splitText,
        left,
        y
      )

      y += splitText.length * 3.5 + 4
    }
  )

  y += 8

  doc.setDrawColor(lightGray)

  doc.line(
    22,
    y,
    82,
    y
  )

  doc.line(
    122,
    y,
    182,
    y
  )

  if (signature) {

    doc.addImage(
      signature,
      'PNG',
      128,
      y - 14,
      40,
      11
    )
  }

  y += 5

  doc.setFont(
    'Roboto',
    'normal'
  )

  doc.setFontSize(8)

  doc.setTextColor(gray)

  doc.text(
    'Pronajímatel',
    35,
    y
  )

  doc.text(
    'Nájemce',
    142,
    y
  )

  doc.setDrawColor(lightGray)

  doc.line(
    left,
    282,
    right,
    282
  )

  doc.setFont(
    'Roboto',
    'normal'
  )

  doc.setFontSize(7)

  doc.setTextColor(gray)

  doc.text(
    `Vygenerováno ${new Date().toLocaleString('cs-CZ')}`,
    left,
    287
  )

  doc.text(
    'NAPP-MB s.r.o.',
    166,
    287
  )

  doc.save(
    `smlouva-${contractNumber}-${customerLastName}.pdf`
  )
}