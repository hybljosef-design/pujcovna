import jsPDF from 'jspdf'

import QRCode from 'qrcode'

type Props = {
  machineName: string
  barcode: string
}

function removeDiacritics(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export async function generateQrLabelPdf({
  machineName,
  barcode
}: Props) {
  const labelWidth = 50
  const labelHeight = 35

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [
      labelWidth,
      labelHeight
    ]
  })

  const qr =
    await QRCode.toDataURL(
      barcode,
      {
        margin: 1,
        width: 280,
        errorCorrectionLevel: 'H'
      }
    )

  const cleanName =
    removeDiacritics(machineName)

  pdf.setFillColor(255, 255, 255)

  pdf.rect(
    0,
    0,
    labelWidth,
    labelHeight,
    'F'
  )

  pdf.setDrawColor(0)

  pdf.setLineWidth(0.4)

  pdf.roundedRect(
    1,
    1,
    labelWidth - 2,
    labelHeight - 2,
    2,
    2,
    'S'
  )

  pdf.setFont(
    'helvetica',
    'bold'
  )

  pdf.setFontSize(8)

  pdf.text(
    'NAPP-MB',
    3,
    5.5
  )

  pdf.setFontSize(7)

  pdf.text(
    cleanName,
    3,
    10,
    {
      maxWidth: 28
    }
  )

  pdf.setFont(
    'helvetica',
    'normal'
  )

  pdf.setFontSize(6)

  pdf.text(
    `ID: ${barcode}`,
    3,
    31
  )

  pdf.addImage(
    qr,
    'PNG',
    30,
    5,
    17,
    17
  )

  pdf.setFont(
    'helvetica',
    'bold'
  )

  pdf.setFontSize(6)

  pdf.text(
    barcode,
    30,
    27,
    {
      maxWidth: 17,
      align: 'center'
    }
  )

  pdf.autoPrint()

  window.open(
    pdf.output('bloburl'),
    '_blank'
  )
}
