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

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #111; }
        h1 { font-size: 24px; margin-bottom: 8px; }
        h2 { font-size: 16px; margin-bottom: 16px; color: #555; font-weight: normal; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { padding: 8px 12px; border: 1px solid #ddd; text-align: left; font-size: 12px; }
        th { background: #f5f5f5; font-weight: 600; }
        .stat { display: inline-block; margin-right: 24px; margin-bottom: 16px; }
        .stat-label { font-size: 11px; color: #666; text-transform: uppercase; }
        .stat-value { font-size: 18px; font-weight: 700; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <h2>Generated on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</h2>
      <hr style="margin: 16px 0; border-color: #eee;" />
      ${printContent.innerHTML}
    </body>
    </html>
  `)
  printWindow.document.close()
  setTimeout(() => {
    printWindow.print()
  }, 300)
}
