"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Save,
  Upload,
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Image as ImageIcon,
  Clock,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const DEFAULT_SETTINGS: Record<string, string> = {
  orgName: "Church CRM",
  orgTagline: "Finance Manager",
  orgEmail: "",
  orgPhone: "",
  orgAddress: "",
  orgWebsite: "",
  logoUrl: "",
  sessionTimeout: "8",
  defaultCurrency: "USD",
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/settings")
    const data = await res.json()
    setSettings((prev) => ({ ...prev, ...data }))
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const set = (key: string, value: string) => setSettings((prev) => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append("logo", file)
    const res = await fetch("/api/settings/logo", { method: "POST", body: formData })
    const data = await res.json()
    if (data.url) {
      set("logoUrl", data.url)
    }
    setUploading(false)
  }

  return (
    <>
      <PageHeader
        title="System Settings"
        description="Configure organization details, branding, and system preferences"
        breadcrumb="Settings"
      >
        <div className="flex items-center gap-2">
          {saved && <Badge className="bg-green-600 text-white">Saved successfully</Badge>}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-6 p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Organization Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Organization Details
              </CardTitle>
              <CardDescription>Basic information about your organization</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="e.g. My Church"
                  value={settings.orgName}
                  onChange={(e) => set("orgName", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="orgTagline">Tagline / Subtitle</Label>
                <Input
                  id="orgTagline"
                  placeholder="e.g. Finance Manager"
                  value={settings.orgTagline}
                  onChange={(e) => set("orgTagline", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="orgAddress">Address</Label>
                <Textarea
                  id="orgAddress"
                  placeholder="Physical address"
                  value={settings.orgAddress}
                  onChange={(e) => set("orgAddress", e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo & Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-4 w-4" />
                Logo & Branding
              </CardTitle>
              <CardDescription>Upload your organization logo</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-6">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/50 overflow-hidden">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt="Logo"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="mr-2 h-3.5 w-3.5" />
                    {uploading ? "Uploading..." : "Upload Logo"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, or SVG. Max 500KB. Recommended 200×200px.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Logo URL (or enter manually)</Label>
                <Input
                  placeholder="Logo stored in database"
                  value={settings.logoUrl}
                  onChange={(e) => set("logoUrl", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="h-4 w-4" />
                Contact Information
              </CardTitle>
              <CardDescription>How people can reach your organization</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="orgEmail">
                    <Mail className="inline mr-1 h-3.5 w-3.5" />
                    Email
                  </Label>
                  <Input
                    id="orgEmail"
                    type="email"
                    placeholder="info@church.org"
                    value={settings.orgEmail}
                    onChange={(e) => set("orgEmail", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="orgPhone">
                    <Phone className="inline mr-1 h-3.5 w-3.5" />
                    Phone
                  </Label>
                  <Input
                    id="orgPhone"
                    placeholder="+263 77 123 4567"
                    value={settings.orgPhone}
                    onChange={(e) => set("orgPhone", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="orgWebsite">
                  <Globe className="inline mr-1 h-3.5 w-3.5" />
                  Website
                </Label>
                <Input
                  id="orgWebsite"
                  placeholder="https://www.church.org"
                  value={settings.orgWebsite}
                  onChange={(e) => set("orgWebsite", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                System Preferences
              </CardTitle>
              <CardDescription>Session timeout and default settings</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-col gap-2">
                <Label>Session Timeout (hours)</Label>
                <Select value={settings.sessionTimeout} onValueChange={(v) => set("sessionTimeout", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="8">8 hours (default)</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Users will be automatically logged out after this period of inactivity. Requires server restart to take effect.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Default Currency</Label>
                <Select value={settings.defaultCurrency} onValueChange={(v) => set("defaultCurrency", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="ZWL">ZWL - Zim Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
