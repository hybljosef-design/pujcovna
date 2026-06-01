'use client'

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
  ClipboardList
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

  return (

    <aside className="
      w-full
      lg:w-[280px]
      bg-white
      border-r
      border-gray-200
      min-h-screen
      p-5
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
  )
}