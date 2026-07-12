'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  X
} from 'lucide-react'

import { supabase } from '../lib/supabase'

type MachineImage = {
  id: string
  machine_id: string
  image_url: string
  is_primary: boolean
  sort_order: number
  created_at?: string
}

type MachineImagesProps = {
  machineId: string
  machineName?: string
  onClose?: () => void
}

const BUCKET_NAME = 'machine-images'

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
}

function getStoragePathFromPublicUrl(imageUrl: string) {
  const marker =
    `/storage/v1/object/public/${BUCKET_NAME}/`

  const markerIndex =
    imageUrl.indexOf(marker)

  if (markerIndex === -1) {
    return null
  }

  return decodeURIComponent(
    imageUrl.slice(
      markerIndex + marker.length
    )
  )
}

export default function MachineImages({
  machineId,
  machineName,
  onClose
}: MachineImagesProps) {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null)

  const cameraInputRef =
    useRef<HTMLInputElement | null>(null)

  const [images, setImages] =
    useState<MachineImage[]>([])

  const [loading, setLoading] =
    useState(true)

  const [uploading, setUploading] =
    useState(false)

  const [actionId, setActionId] =
    useState<string | null>(null)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [successMessage, setSuccessMessage] =
    useState('')

  useEffect(() => {
    loadImages()
  }, [machineId])

  async function loadImages() {
    setLoading(true)
    setErrorMessage('')

    const { data, error } =
      await supabase
        .from('machine_images')
        .select(`
          id,
          machine_id,
          image_url,
          is_primary,
          sort_order,
          created_at
        `)
        .eq('machine_id', machineId)
        .order('is_primary', {
          ascending: false
        })
        .order('sort_order', {
          ascending: true
        })
        .order('created_at', {
          ascending: true
        })

    if (error) {
      console.log(error)
      setErrorMessage(
        'Fotografie se nepodařilo načíst.'
      )
      setLoading(false)
      return
    }

    setImages(
      (data || []) as MachineImage[]
    )
    setLoading(false)
  }

  async function uploadFiles(
    fileList: FileList | null
  ) {
    if (!fileList || fileList.length === 0) {
      return
    }

    setUploading(true)
    setErrorMessage('')
    setSuccessMessage('')

    const files = Array.from(fileList)

    const currentMaximumOrder =
      images.reduce(
        (maximum, image) =>
          Math.max(
            maximum,
            image.sort_order || 0
          ),
        -1
      )

    let uploadedCount = 0

    for (
      let index = 0;
      index < files.length;
      index++
    ) {
      const file = files[index]

      if (!file.type.startsWith('image/')) {
        setErrorMessage(
          `Soubor ${file.name} není fotografie.`
        )
        continue
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage(
          `Fotografie ${file.name} je větší než 5 MB.`
        )
        continue
      }

      const safeFileName =
        sanitizeFileName(
          file.name || 'fotografie.jpg'
        )

      const storagePath =
        `${machineId}/${Date.now()}-${index}-${safeFileName}`

      const { error: uploadError } =
        await supabase
          .storage
          .from(BUCKET_NAME)
          .upload(
            storagePath,
            file,
            {
              cacheControl: '3600',
              upsert: false,
              contentType: file.type
            }
          )

      if (uploadError) {
        console.log(uploadError)
        setErrorMessage(
          `Fotografii ${file.name} se nepodařilo nahrát.`
        )
        continue
      }

      const { data: publicUrlData } =
        supabase
          .storage
          .from(BUCKET_NAME)
          .getPublicUrl(storagePath)

      const imageUrl =
        publicUrlData.publicUrl

      const shouldBePrimary =
        images.length === 0 &&
        uploadedCount === 0

      const { error: insertError } =
        await supabase
          .from('machine_images')
          .insert([
            {
              machine_id: machineId,
              image_url: imageUrl,
              is_primary: shouldBePrimary,
              sort_order:
                currentMaximumOrder +
                uploadedCount +
                1
            }
          ])

      if (insertError) {
        console.log(insertError)

        await supabase
          .storage
          .from(BUCKET_NAME)
          .remove([storagePath])

        setErrorMessage(
          `Fotografii ${file.name} se nepodařilo uložit do galerie.`
        )
        continue
      }

      uploadedCount++
    }

    if (uploadedCount > 0) {
      setSuccessMessage(
        uploadedCount === 1
          ? 'Fotografie byla nahrána.'
          : `Bylo nahráno ${uploadedCount} fotografií.`
      )
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }

    await loadImages()
    setUploading(false)
  }

  async function setPrimaryImage(
    image: MachineImage
  ) {
    if (image.is_primary) return

    setActionId(image.id)
    setErrorMessage('')
    setSuccessMessage('')

    const { error: resetError } =
      await supabase
        .from('machine_images')
        .update({
          is_primary: false
        })
        .eq(
          'machine_id',
          machineId
        )

    if (resetError) {
      console.log(resetError)
      setErrorMessage(
        'Hlavní fotografii se nepodařilo změnit.'
      )
      setActionId(null)
      return
    }

    const { error: primaryError } =
      await supabase
        .from('machine_images')
        .update({
          is_primary: true
        })
        .eq('id', image.id)

    if (primaryError) {
      console.log(primaryError)
      setErrorMessage(
        'Hlavní fotografii se nepodařilo změnit.'
      )
      setActionId(null)
      return
    }

    setSuccessMessage(
      'Hlavní fotografie byla změněna.'
    )

    await loadImages()
    setActionId(null)
  }

  async function deleteImage(
    image: MachineImage
  ) {
    const confirmed =
      window.confirm(
        'Opravdu chcete tuto fotografii smazat?'
      )

    if (!confirmed) return

    setActionId(image.id)
    setErrorMessage('')
    setSuccessMessage('')

    const storagePath =
      getStoragePathFromPublicUrl(
        image.image_url
      )

    const { error: deleteRowError } =
      await supabase
        .from('machine_images')
        .delete()
        .eq('id', image.id)

    if (deleteRowError) {
      console.log(deleteRowError)
      setErrorMessage(
        'Fotografii se nepodařilo smazat.'
      )
      setActionId(null)
      return
    }

    if (storagePath) {
      const { error: storageError } =
        await supabase
          .storage
          .from(BUCKET_NAME)
          .remove([storagePath])

      if (storageError) {
        console.log(storageError)
      }
    }

    const remainingImages =
      images.filter(
        item => item.id !== image.id
      )

    if (
      image.is_primary &&
      remainingImages.length > 0
    ) {
      await supabase
        .from('machine_images')
        .update({
          is_primary: true
        })
        .eq(
          'id',
          remainingImages[0].id
        )
    }

    setSuccessMessage(
      'Fotografie byla smazána.'
    )

    await loadImages()
    setActionId(null)
  }

  return (
    <div className="
      bg-white
      rounded-3xl
      shadow-2xl
      w-full
      max-w-5xl
      max-h-[92vh]
      overflow-y-auto
    ">

      <div className="
        sticky
        top-0
        z-10
        bg-white
        border-b
        p-5
        lg:p-6
        flex
        items-start
        justify-between
        gap-4
      ">

        <div>
          <h2 className="
            text-3xl
            font-black
            mb-1
          ">
            Fotografie stroje
          </h2>

          <p className="text-gray-500">
            {machineName ||
              'Správa fotografií'}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="
              bg-gray-100
              hover:bg-gray-200
              rounded-2xl
              p-3
              transition
            "
            title="Zavřít"
          >
            <X size={22} />
          </button>
        )}

      </div>

      <div className="p-5 lg:p-6">

        {errorMessage && (
          <div className="
            bg-red-50
            text-red-700
            rounded-2xl
            p-4
            mb-5
            font-semibold
          ">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="
            bg-green-50
            text-green-700
            rounded-2xl
            p-4
            mb-5
            font-semibold
          ">
            {successMessage}
          </div>
        )}

        <div className="
          grid
          sm:grid-cols-2
          gap-3
          mb-7
        ">

          <button
            type="button"
            onClick={() =>
              cameraInputRef.current?.click()
            }
            disabled={uploading}
            className="
              bg-black
              hover:bg-gray-800
              disabled:bg-gray-400
              text-white
              rounded-2xl
              p-4
              font-bold
              text-lg
              flex
              items-center
              justify-center
              gap-3
              transition
            "
          >
            {uploading ? (
              <Loader2
                size={22}
                className="animate-spin"
              />
            ) : (
              <Camera size={22} />
            )}

            Vyfotit mobilem
          </button>

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={uploading}
            className="
              bg-gray-100
              hover:bg-gray-200
              disabled:bg-gray-200
              rounded-2xl
              p-4
              font-bold
              text-lg
              flex
              items-center
              justify-center
              gap-3
              transition
            "
          >
            {uploading ? (
              <Loader2
                size={22}
                className="animate-spin"
              />
            ) : (
              <ImagePlus size={22} />
            )}

            Vybrat z galerie
          </button>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) =>
              uploadFiles(
                event.target.files
              )
            }
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(event) =>
              uploadFiles(
                event.target.files
              )
            }
          />

        </div>

        {loading ? (
          <div className="
            min-h-52
            flex
            items-center
            justify-center
            text-gray-500
          ">
            <Loader2
              size={30}
              className="
                animate-spin
                mr-3
              "
            />
            Načítám fotografie...
          </div>
        ) : images.length === 0 ? (
          <div className="
            border-2
            border-dashed
            rounded-3xl
            p-10
            text-center
            text-gray-500
          ">
            <Camera
              size={44}
              className="
                mx-auto
                mb-4
              "
            />

            <h3 className="
              text-xl
              font-bold
              text-gray-800
              mb-2
            ">
              Zatím bez fotografie
            </h3>

            <p>
              Vyfoťte stroj mobilem nebo vyberte fotografii z galerie.
            </p>
          </div>
        ) : (
          <div className="
            grid
            sm:grid-cols-2
            lg:grid-cols-3
            gap-5
          ">

            {images.map(
              image => (
                <div
                  key={image.id}
                  className="
                    border
                    rounded-3xl
                    overflow-hidden
                    bg-gray-50
                  "
                >

                  <div className="
                    aspect-[4/3]
                    bg-gray-200
                    relative
                  ">

                    <img
                      src={image.image_url}
                      alt={
                        machineName ||
                        'Fotografie stroje'
                      }
                      className="
                        w-full
                        h-full
                        object-cover
                      "
                    />

                    {image.is_primary && (
                      <div className="
                        absolute
                        top-3
                        left-3
                        bg-black
                        text-white
                        rounded-xl
                        px-3
                        py-2
                        text-sm
                        font-bold
                        flex
                        items-center
                        gap-2
                      ">
                        <Star
                          size={15}
                          fill="currentColor"
                        />
                        Hlavní
                      </div>
                    )}

                  </div>

                  <div className="p-4 grid gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        setPrimaryImage(image)
                      }
                      disabled={
                        image.is_primary ||
                        actionId === image.id
                      }
                      className="
                        bg-amber-100
                        hover:bg-amber-200
                        disabled:bg-green-100
                        disabled:text-green-700
                        rounded-2xl
                        p-3
                        font-semibold
                        flex
                        items-center
                        justify-center
                        gap-2
                        transition
                      "
                    >
                      {actionId === image.id ? (
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                      ) : image.is_primary ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <Star size={18} />
                      )}

                      {image.is_primary
                        ? 'Hlavní fotografie'
                        : 'Nastavit jako hlavní'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteImage(image)
                      }
                      disabled={
                        actionId === image.id
                      }
                      className="
                        bg-red-50
                        hover:bg-red-100
                        text-red-700
                        rounded-2xl
                        p-3
                        font-semibold
                        flex
                        items-center
                        justify-center
                        gap-2
                        transition
                      "
                    >
                      {actionId === image.id ? (
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2 size={18} />
                      )}

                      Smazat fotografii
                    </button>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>

    </div>
  )
}
