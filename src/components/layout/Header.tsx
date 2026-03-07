import { Link, useLocation } from "react-router-dom"
import { Database, Zap, BarChart3, Star, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Lender Database", path: "/lenders", icon: Database },
  { name: "Deal Matcher", path: "/match", icon: Zap },
  { name: "Market Intel", path: "/market", icon: BarChart3 },
  { name: "Watchlist", path: "/watchlist", icon: Star },
]

export function Header() {
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gray-950 text-white">
      <div className="flex h-14 items-center px-6">
        {/* Logo */}
        <div className="flex items-center gap-3 mr-8">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <Database className="h-4 w-4 text-white" />
            </div>
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
          <button className="relative h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
          </button>
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
            B
          </div>
        </div>
      </div>
    </header>
  )
}
