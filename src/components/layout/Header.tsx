import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Database, Zap, BarChart3, Bell, MessageSquare, X, ClipboardList, Award, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

// The crawler, the leads and the submissions views now live behind /admin, which
// is deliberately absent from this bar and reached by address alone. Their own
// routes still answer, so an existing link keeps working.
const navItems = [
  { name: "Lender Database", path: "/lenders", icon: Database },
  { name: "Market Intel", path: "/market", icon: BarChart3 },
  { name: "Why Us?", path: "/why-us", icon: Award },
  { name: "Deal Matcher", path: "/match", icon: Zap },
]

export function Header() {
  const location = useLocation()
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black text-white">
      <div className="flex h-14 items-center px-6">
        {/* Masthead, worded as the printed material is */}
        <div className="flex items-center gap-3 mr-8">
          <Link to="/lenders" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <img src="/rrecktek-inv.png" alt="RRECKTEK" className="h-6" />
            <span className="text-lg font-bold tracking-wide text-white leading-none">FINANCE</span>
          </Link>
          <span className="hidden lg:block text-[10px] uppercase tracking-wide text-gray-500 leading-tight border-l border-zinc-700 pl-3">
            <span className="block whitespace-nowrap">A division of</span>
            <span className="block whitespace-nowrap">RCR International Finance</span>
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
              <div key={item.path} className="flex items-center">
                <Link
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

                {/* The one action a visitor is here to take. It is a button
                    rather than a link, and it sits immediately to the right of
                    the database rather than at the end of the bar. */}
                {item.path === "/lenders" && (
                  <Link to="/apply" className="mx-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-base font-extrabold tracking-wide",
                        "shadow-lg shadow-primary/30 transition-colors",
                        location.pathname.startsWith("/apply")
                          ? "bg-white text-black"
                          : "bg-primary text-white hover:bg-primary/85"
                      )}
                    >
                      <ClipboardList className="h-5 w-5" />
                      APPLY
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </Link>
                )}
              </div>
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
