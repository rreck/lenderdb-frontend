import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Database, Zap, BarChart3, Star, Bell, MessageSquare, X, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Lender Database", path: "/lenders", icon: Database },
  { name: "Deal Matcher", path: "/match", icon: Zap },
  { name: "Market Intel", path: "/market", icon: BarChart3 },
  { name: "Watchlist", path: "/watchlist", icon: Star },
  { name: "Crawler", path: "/crawler", icon: Bot },
]

export function Header() {
  const location = useLocation()
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black text-white">
      <div className="flex h-14 items-center px-6">
        {/* Logo */}
        <div className="flex items-center gap-3 mr-8">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold tracking-tight">LenderDB</span>
          </div>
          <span className="text-[11px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
            Equipment Finance Intelligence
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path === "/lenders" && location.pathname === "/") ||
              location.pathname.startsWith(item.path)
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setChatOpen(o => !o)}
            className={cn(
              "relative h-8 w-8 flex items-center justify-center rounded-lg transition-colors",
              chatOpen ? "bg-primary text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
            )}
            title="Chat"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button className="relative h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
          </button>
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
            B
          </div>
        </div>
      </div>

      {/* Chat panel — floats below header, does not affect layout */}
      {chatOpen && (
        <div className="absolute right-4 top-[57px] z-50 w-80 h-96 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="text-sm font-semibold text-white">Chat</span>
            <button onClick={() => setChatOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1" />
        </div>
      )}
    </header>
  )
}
