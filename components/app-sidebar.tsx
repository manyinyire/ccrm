"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  LayoutDashboard,
  DollarSign,
  Receipt,
  BookOpen,
  Wallet,
  Church,
  TrendingUp,
  Users,
  Package,
  FolderKanban,
  HandCoins,
  Store,
  LogOut,
  Activity,
  Settings,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCurrency } from "@/lib/currency-context"
import { usePermissions } from "@/lib/use-permissions"
import { roleLabels } from "@/lib/mock-data"
import type { Currency } from "@/lib/mock-data"

const mainNav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, perm: null },
  { title: "Income", href: "/income", icon: DollarSign, perm: "canManageIncome" },
  { title: "Receivables", href: "/receivables", icon: HandCoins, perm: "canManageReceivables" },
  { title: "Expenses", href: "/expenses", icon: Receipt, perm: "canManageExpenses" },
  { title: "Ventures", href: "/ventures", icon: Store, perm: "canManageVentures" },
  { title: "Projects", href: "/projects", icon: FolderKanban, perm: "canManageProjects" },
  { title: "Owed Ledger", href: "/ledger", icon: BookOpen, perm: "canManageExpenses" },
  { title: "Cash At Hand", href: "/cash", icon: Wallet, perm: "canManageIncome" },
  { title: "Assets", href: "/assets", icon: Package, perm: "canManageAssets" },
]

const adminNav = [
  { title: "Assemblies", href: "/assemblies", icon: Church, perm: "canManageAssemblies" },
  { title: "Users", href: "/users", icon: Users, perm: "canManageUsers" },
  { title: "Reports", href: "/reports", icon: TrendingUp, perm: "canViewReports" },
  { title: "Audit Logs", href: "/audit-logs", icon: Activity, perm: "canManageUsers" },
  { title: "Settings", href: "/settings", icon: Settings, perm: "canManageUsers" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { currency, setCurrency } = useCurrency()
  const [orgSettings, setOrgSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setOrgSettings).catch(() => {})
  }, [])

  const { permissions, isSuperAdmin } = usePermissions()
  const userName = session?.user?.name || "User"
  const userRole = (session?.user as any)?.role || "VIEWER"
  const initials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
  const roleLabel = roleLabels[userRole] || "User"

  const visibleMain = mainNav.filter((item) => !item.perm || isSuperAdmin || (permissions as any)[item.perm])
  const visibleAdmin = adminNav.filter((item) => !item.perm || isSuperAdmin || (permissions as any)[item.perm])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-hidden">
            {orgSettings.logoUrl ? (
              <img src={orgSettings.logoUrl} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <Church className="h-4 w-4" />
            )}
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-primary-foreground">
              {orgSettings.orgName || "Church CRM"}
            </span>
            <span className="text-xs text-sidebar-foreground/60">
              {orgSettings.orgTagline || "Finance Manager"}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Currency Switcher */}
      <div className="px-3 py-2 group-data-[collapsible=icon]:hidden">
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/50">
          Currency
        </label>
        <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
          <SelectTrigger className="h-8 border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD - US Dollar</SelectItem>
            <SelectItem value="ZWL">ZWL - Zim Dollar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMain.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleAdmin.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex w-full items-center gap-2 rounded-md px-2 py-1.5">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 items-center justify-between group-data-[collapsible=icon]:hidden">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-sidebar-primary-foreground">{userName}</span>
                  <span className="text-[10px] text-sidebar-foreground/60">{roleLabel}</span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="rounded-md p-1.5 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="sr-only">Sign out</span>
                </button>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
