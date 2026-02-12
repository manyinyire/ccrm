export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h]
          const str = String(val ?? "")
          return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
        })
        .join(",")
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function exportToPDF(title: string, elementId: string) {
  const printContent = document.getElementById(elementId)
  if (!printContent) return

  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  // Build the logo URL (works both in dev and production)
  const logoUrl = `${window.location.origin}/placeholder-logo.png`
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        /* ── Reset ── */
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 32px 40px;
          color: #111;
          font-size: 12px;
          line-height: 1.5;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* ── Logo Header ── */
        .pdf-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 2px solid #222;
          margin-bottom: 20px;
        }
        .pdf-header img {
          height: 44px;
          width: auto;
          object-fit: contain;
        }
        .pdf-header-text h1 {
          font-size: 20px;
          font-weight: 700;
          line-height: 1.2;
        }
        .pdf-header-text p {
          font-size: 11px;
          color: #666;
          margin-top: 2px;
        }

        /* ── Section spacing ── */
        hr { border: none; border-top: 1px solid #ddd; margin: 16px 0; }

        /* ── Tables ── */
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0 16px 0;
          font-size: 11px;
          page-break-inside: auto;
        }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        th, td {
          padding: 6px 10px;
          border: 1px solid #d0d0d0;
          text-align: left;
          vertical-align: middle;
          white-space: nowrap;
        }
        th {
          background: #f0f0f0 !important;
          font-weight: 600;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: #333;
        }
        tfoot td, tfoot th {
          background: #f5f5f5 !important;
          font-weight: 700;
          border-top: 2px solid #999;
        }

        /* ── Tailwind utility class mappings ── */
        .text-right, [class*="text-right"] { text-align: right !important; }
        .text-center, [class*="text-center"] { text-align: center !important; }
        .text-left { text-align: left !important; }
        .font-bold, [class*="font-bold"] { font-weight: 700 !important; }
        .font-semibold, [class*="font-semibold"] { font-weight: 600 !important; }
        .font-medium, [class*="font-medium"] { font-weight: 500 !important; }
        .tabular-nums, [class*="tabular-nums"] { font-variant-numeric: tabular-nums; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }
        .uppercase, [class*="uppercase"] { text-transform: uppercase; }
        .tracking-wider { letter-spacing: 0.05em; }

        /* ── Color mappings ── */
        .text-primary, [class*="text-primary"] { color: #1a56db !important; }
        .text-destructive, [class*="text-destructive"] { color: #dc2626 !important; }
        .text-success, [class*="text-success"] { color: #16a34a !important; }
        .text-warning, [class*="text-warning"] { color: #d97706 !important; }
        .text-muted-foreground, [class*="text-muted-foreground"] { color: #888 !important; }
        [class*="text-green-600"] { color: #16a34a !important; }
        [class*="text-emerald-600"] { color: #059669 !important; }
        [class*="text-amber-600"] { color: #d97706 !important; }
        [class*="text-orange-500"] { color: #f97316 !important; }

        /* ── Background row stripes ── */
        [class*="bg-muted"] { background: #f8f8f8 !important; }

        /* ── Cards → simple bordered boxes in print ── */
        [class*="rounded-lg"], [class*="rounded-xl"],
        [class*="border"] {
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        /* ── Stat cards grid ── */
        .grid {
          display: grid;
          gap: 12px;
          margin-bottom: 16px;
        }
        [class*="grid-cols-2"] { grid-template-columns: repeat(2, 1fr); }
        [class*="grid-cols-3"] { grid-template-columns: repeat(3, 1fr); }
        [class*="sm:grid-cols-3"] { grid-template-columns: repeat(3, 1fr); }
        [class*="sm:grid-cols-4"] { grid-template-columns: repeat(4, 1fr); }
        [class*="sm:grid-cols-5"] { grid-template-columns: repeat(5, 1fr); }
        [class*="md:grid-cols-4"] { grid-template-columns: repeat(4, 1fr); }
        [class*="lg:grid-cols-6"] { grid-template-columns: repeat(6, 1fr); }

        /* ── Stat card content ── */
        [class*="p-4"] { padding: 10px !important; }
        [class*="p-0"] { padding: 0 !important; }

        /* ── Stat label + value ── */
        .text-xs, [class*="text-xs"] { font-size: 9px; }
        .text-sm, [class*="text-sm"] { font-size: 11px; }
        .text-base, [class*="text-base"] { font-size: 12px; }
        .text-lg, [class*="text-lg"] { font-size: 14px; }
        .text-xl, [class*="text-xl"] { font-size: 16px; font-weight: 700; }
        .text-2xl, [class*="text-2xl"] { font-size: 18px; font-weight: 700; }
        .mt-1, [class*="mt-1"] { margin-top: 4px; }

        /* ── Badges ── */
        [class*="inline-flex"][class*="rounded"] {
          display: inline-block;
          padding: 1px 6px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 600;
          border: 1px solid #ccc;
          background: #f5f5f5;
        }

        /* ── Progress bars ── */
        [class*="h-2"][class*="rounded-full"],
        [class*="h-3"][class*="rounded-full"] {
          height: 6px;
          border-radius: 3px;
          background: #e5e5e5;
          overflow: hidden;
        }
        [class*="h-2"][class*="rounded-full"] > div,
        [class*="h-3"][class*="rounded-full"] > div {
          height: 100%;
          border-radius: 3px;
        }
        [class*="bg-primary"] { background: #1a56db !important; }
        [class*="bg-destructive"] { background: #dc2626 !important; }
        [class*="bg-success"] { background: #16a34a !important; }

        /* ── Flex helpers ── */
        .flex, [class*="flex"] { display: flex; }
        [class*="flex-col"] { flex-direction: column; }
        [class*="items-center"] { align-items: center; }
        [class*="justify-between"] { justify-content: space-between; }
        [class*="gap-1"] { gap: 4px; }
        [class*="gap-2"] { gap: 8px; }
        [class*="gap-3"] { gap: 12px; }
        [class*="gap-4"] { gap: 16px; }
        [class*="gap-6"] { gap: 20px; }

        /* ── Card headers ── */
        [class*="pb-2"] { padding-bottom: 8px; }
        [class*="pb-3"] { padding-bottom: 12px; }

        /* ── Hide interactive elements / charts / buttons / SVGs ── */
        button, svg, [class*="recharts"], canvas,
        input, select, [role="combobox"],
        [class*="h-[300px]"], [class*="h-[250px]"] {
          display: none !important;
        }

        /* ── Spacing between sections ── */
        [class*="flex-col"][class*="gap-4"] > * + * { margin-top: 12px; }
        [class*="flex-col"][class*="gap-6"] > * + * { margin-top: 16px; }

        /* ── Print-specific ── */
        @media print {
          body { padding: 16px 20px; }
          .pdf-header { margin-bottom: 16px; }
          table { font-size: 10px; }
          th, td { padding: 4px 8px; }
          @page { margin: 12mm 10mm; size: A4 landscape; }
        }

        /* ── Ensure page breaks work ── */
        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>
      <div class="pdf-header">
        <img src="${logoUrl}" alt="Logo" onerror="this.style.display='none'" />
        <div class="pdf-header-text">
          <h1>${title}</h1>
          <p>Generated on ${dateStr}</p>
        </div>
      </div>
      ${printContent.innerHTML}
    </body>
    </html>
  `)
  printWindow.document.close()
  setTimeout(() => {
    printWindow.print()
  }, 500)
}
