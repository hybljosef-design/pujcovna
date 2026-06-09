'use client'

import {
  useState
} from 'react'

import Link from 'next/link'

import { usePathname } from 'next/navigation'

import {
  LayoutDashboard,
  Wrench,
  PlusCircle,
  History,
  AlertTriangle,
  CalendarDays,
  Undo2,
  ClipboardList,
  Menu,
  X
} from 'lucide-react'

const links = [

  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard
  },

  {
    href: '/rentals/new',
    label: 'Nová půjčka',
    icon: PlusCircle
  },

  {
    href: '/returns',
    label: 'Vrácení strojů',
    icon: Undo2
  },

  {
    href: '/reservations',
    label: 'Rezervace',
    icon: ClipboardList
  },

  {
    href: '/machines',
    label: 'Stroje',
    icon: Wrench
  },

  {
    href: '/calendar',
    label: 'Kalendář',
    icon: CalendarDays
  },

  {
    href: '/history',
    label: 'Historie půjček',
    icon: History
  },

  {
    href: '/overdue',
    label: 'Po termínu',
    icon: AlertTriangle
  }

]

export default function Sidebar() {

  const pathname =
    usePathname()

  const [mobileOpen, setMobileOpen] =
    useState(false)

  function closeMobileMenu() {

    setMobileOpen(false)
  }

  return (

    <>

      <div className="
        lg:hidden
        sticky
        top-0
        z-50
        bg-white
        border-b
        border-gray-200
        px-4
        py-3
        flex
        items-center
        justify-between
      ">

        <div>

          <div className="
            text-xl
            font-bold
          ">

            NAPP-MB

          </div>

          <div className="
            text-xs
            text-gray-500
          ">

            Půjčovna strojů

          </div>

        </div>

        <button
          type="button"
          onClick={() =>
            setMobileOpen(
              !mobileOpen
            )
          }
          className="
            bg-black
            text-white
            rounded-2xl
            px-4
            py-3
            flex
            items-center
            gap-2
            font-semibold
          "
        >

          {mobileOpen
            ? <X size={20} />
            : <Menu size={20} />}

          {mobileOpen
            ? 'Zavřít'
            : 'Menu'}

        </button>

      </div>

      {mobileOpen && (

        <div className="
          lg:hidden
          fixed
          inset-0
          z-40
          bg-black/40
        ">

          <div className="
            bg-white
            w-[84%]
            max-w-[340px]
            min-h-screen
            p-5
            shadow-2xl
          ">

            <div className="
              mb-8
              pt-16
            ">

              <h1 className="
                text-2xl
                font-bold
              ">

                NAPP-MB

              </h1>

              <p className="
                text-sm
                text-gray-500
                mt-1
              ">

                Půjčovna strojů

              </p>

            </div>

            <nav className="
              flex
              flex-col
              gap-2
            ">

              {links.map((link) => {

                const Icon =
                  link.icon

                const active =
                  pathname === link.href

                return (

                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={`
                      flex
                      items-center
                      gap-4
                      px-5
                      py-4
                      rounded-2xl
                      transition
                      text-lg
                      font-medium

                      ${active
                        ? 'bg-black text-white'
                        : 'text-gray-700 hover:bg-gray-100'}
                    `}
                  >

                    <Icon size={22} />

                    {link.label}

                  </Link>

                )
              })}

            </nav>

          </div>

        </div>

      )}

      <aside className="
        hidden
        lg:block
        lg:w-[280px]
        bg-white
        border-r
        border-gray-200
        min-h-screen
        p-5
        shrink-0
      ">

        <div className="mb-8">

          <h1 className="
            text-2xl
            font-bold
          ">

            NAPP-MB

          </h1>

          <p className="
            text-sm
            text-gray-500
            mt-1
          ">

            Půjčovna strojů

          </p>

        </div>

        <nav className="
          flex
          flex-col
          gap-2
        ">

          {links.map((link) => {

            const Icon =
              link.icon

            const active =
              pathname === link.href

            return (

              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex
                  items-center
                  gap-4
                  px-5
                  py-4
                  rounded-2xl
                  transition
                  text-lg
                  font-medium

                  ${active
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
              >

                <Icon size={22} />

                {link.label}

              </Link>

            )
          })}

        </nav>

      </aside>

    </>

  )
}
