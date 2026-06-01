'use client'

import {
  useEffect,
  useRef,
  useState
} from 'react'

import SignatureCanvas from 'react-signature-canvas'

import {
  RotateCcw,
  PenTool,
  Check
} from 'lucide-react'

type Props = {
  onSave: (signature: string) => void
}

export default function SignaturePad({
  onSave
}: Props) {

  const signatureRef =
    useRef<SignatureCanvas | null>(null)

  const [saved, setSaved] =
    useState(false)

  const [hasDrawn, setHasDrawn] =
    useState(false)

  function clearSignature() {

    signatureRef.current?.clear()

    onSave('')

    setSaved(false)

    setHasDrawn(false)
  }

  function saveSignature() {

    if (
      !signatureRef.current ||
      signatureRef.current.isEmpty()
    ) {
      return
    }

    const signature =
      signatureRef.current
        .toDataURL('image/png')

    onSave(signature)

    setSaved(true)
  }

  useEffect(() => {

    const canvas =
      signatureRef.current

    if (!canvas) return

    const resizeCanvas = () => {

      const ratio =
        Math.max(
          window.devicePixelRatio || 1,
          1
        )

      const canvasElement =
        canvas.getCanvas()

      const parent =
        canvasElement.parentElement

      if (!parent) return

      canvasElement.width =
        parent.offsetWidth * ratio

      canvasElement.height =
        300 * ratio

      canvasElement
        .getContext('2d')
        ?.scale(ratio, ratio)

      canvas.clear()
    }

    resizeCanvas()

    window.addEventListener(
      'resize',
      resizeCanvas
    )

    return () => {

      window.removeEventListener(
        'resize',
        resizeCanvas
      )
    }

  }, [])

  return (

    <div className="
      bg-white
      rounded-3xl
      shadow-lg
      border
      border-gray-200
      p-6
      lg:p-8
    ">

      <div className="
        flex
        flex-col
        lg:flex-row
        lg:items-center
        lg:justify-between
        gap-4
        mb-6
      ">

        <div className="flex items-center gap-4">

          <div className="
            w-14
            h-14
            rounded-3xl
            bg-black
            text-white
            flex
            items-center
            justify-center
            shrink-0
          ">

            <PenTool size={24} />

          </div>

          <div>

            <h2 className="text-2xl lg:text-3xl font-bold">

              Podpis zákazníka

            </h2>

            <p className="text-gray-500 mt-1">

              Podepište se prstem nebo stylusem

            </p>

          </div>

        </div>

        {saved && (

          <div className="
            flex
            items-center
            justify-center
            gap-2
            bg-green-100
            text-green-700
            px-5
            py-3
            rounded-2xl
            text-sm
            font-semibold
            whitespace-nowrap
          ">

            <Check size={18} />

            Podpis uložen

          </div>

        )}

      </div>

      <div className="
        relative
        border-2
        border-dashed
        border-gray-300
        rounded-3xl
        overflow-hidden
        bg-white
        shadow-inner
      ">

        {!hasDrawn && (

          <div className="
            absolute
            inset-0
            flex
            flex-col
            items-center
            justify-center
            pointer-events-none
            text-gray-400
          ">

            <PenTool
              size={42}
              className="mb-4 opacity-30"
            />

            <p className="text-2xl font-medium">

              Podepište se zde

            </p>

          </div>

        )}

        <SignatureCanvas
          ref={signatureRef}
          penColor="black"
          minWidth={1.5}
          maxWidth={2.8}
          onBegin={() => {

            setHasDrawn(true)

            setSaved(false)
          }}
          canvasProps={{
            className:
              'w-full h-[300px] touch-none bg-white'
          }}
        />

      </div>

      <div className="
        grid
        grid-cols-1
        md:grid-cols-2
        gap-4
        mt-6
      ">

        <button
          type="button"
          onClick={clearSignature}
          className="
            flex
            items-center
            justify-center
            gap-3
            bg-gray-200
            hover:bg-gray-300
            active:scale-[0.98]
            transition
            px-6
            py-5
            rounded-2xl
            text-xl
            font-medium
            min-h-[72px]
          "
        >

          <RotateCcw size={24} />

          Vymazat podpis

        </button>

        <button
          type="button"
          onClick={saveSignature}
          className="
            flex
            items-center
            justify-center
            gap-3
            bg-black
            hover:bg-gray-800
            active:scale-[0.98]
            transition
            text-white
            px-6
            py-5
            rounded-2xl
            text-xl
            font-semibold
            min-h-[72px]
          "
        >

          <Check size={24} />

          Uložit podpis

        </button>

      </div>

      <div className="
        mt-6
        bg-gray-50
        border
        border-gray-200
        rounded-2xl
        p-5
      ">

        <div className="
          flex
          flex-col
          sm:flex-row
          sm:items-center
          gap-3
          text-sm
          text-gray-600
        ">

          <div className="
            flex
            items-center
            gap-2
          ">

            <div className="
              w-2
              h-2
              rounded-full
              bg-green-500
            " />

            Prst

          </div>

          <div className="
            flex
            items-center
            gap-2
          ">

            <div className="
              w-2
              h-2
              rounded-full
              bg-blue-500
            " />

            Stylus

          </div>

          <div className="
            flex
            items-center
            gap-2
          ">

            <div className="
              w-2
              h-2
              rounded-full
              bg-black
            " />

            Apple Pencil

          </div>

        </div>

      </div>

    </div>
  )
}