import jsPDF from 'jspdf'

import QRCode from 'qrcode'

type Props = {
  machineName: string
  barcode: string
}

export async function generateQrLabelPdf({
  machineName,
  barcode
}: Props) {

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const qr =
    await QRCode.toDataURL(barcode)

  const labels = []

  for (let i = 0; i < 8; i++) {

    labels.push({

      x:
        i % 2 === 0
          ? 10
          : 105,

      y:
        10 + Math.floor(i / 2) * 69
    })
  }

  labels.forEach((label) => {

    pdf.setDrawColor(230)

    pdf.setFillColor(255, 255, 255)

    pdf.roundedRect(
      label.x,
      label.y,
      90,
      62,
      4,
      4,
      'FD'
    )

    pdf.setFont(
      'helvetica',
      'bold'
    )

    pdf.setFontSize(11)

    pdf.text(
      'NAPP-MB',
      label.x + 6,
      label.y + 8
    )

    pdf.setFont(
      'helvetica',
      'normal'
    )

    pdf.setFontSize(10)

    const cleanName =
      machineName
        .replace(/á/g, 'a')
        .replace(/č/g, 'c')
        .replace(/ď/g, 'd')
        .replace(/é/g, 'e')
        .replace(/ě/g, 'e')
        .replace(/í/g, 'i')
        .replace(/ň/g, 'n')
        .replace(/ó/g, 'o')
        .replace(/ř/g, 'r')
        .replace(/š/g, 's')
        .replace(/ť/g, 't')
        .replace(/ú/g, 'u')
        .replace(/ů/g, 'u')
        .replace(/ý/g, 'y')
        .replace(/ž/g, 'z')
        .replace(/Á/g, 'A')
        .replace(/Č/g, 'C')
        .replace(/Ď/g, 'D')
        .replace(/É/g, 'E')
        .replace(/Ě/g, 'E')
        .replace(/Í/g, 'I')
        .replace(/Ň/g, 'N')
        .replace(/Ó/g, 'O')
        .replace(/Ř/g, 'R')
        .replace(/Š/g, 'S')
        .replace(/Ť/g, 'T')
        .replace(/Ú/g, 'U')
        .replace(/Ů/g, 'U')
        .replace(/Ý/g, 'Y')
        .replace(/Ž/g, 'Z')

    pdf.setFont(
      'helvetica',
      'bold'
    )

    pdf.setFontSize(13)

    pdf.text(
      cleanName,
      label.x + 6,
      label.y + 16,
      {
        maxWidth: 78
      }
    )

    pdf.setFont(
      'helvetica',
      'normal'
    )

    pdf.setFontSize(10)

    pdf.text(
      `ID: ${barcode}`,
      label.x + 6,
      label.y + 24
    )

    pdf.addImage(
      qr,
      'PNG',
      label.x + 20,
      label.y + 27,
      50,
      50
    )

  })

  pdf.autoPrint()

  window.open(
    pdf.output('bloburl'),
    '_blank'
  )
}