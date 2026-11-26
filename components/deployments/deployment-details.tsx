'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, CheckCircle2, Download, FileSpreadsheet, FileText, MapPin, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDeployments } from '@/components/deployments-provider'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { DeploymentLocationMap } from '@/components/dashboard/deployment-location-map'
import { Panel } from '@/components/dashboard/panel'
import { formatDateTime, getCareProviderName, deviceTypeOptions, type Deployment, type EquipmentLineItem, type DeviceType, type Report } from '@/lib/dashboard-data'
import { sampleUsageRecords } from '@/lib/usage-record-data'
import type { Language } from '@/components/app-shell'

type DeploymentDetailsProps = {
  deploymentId?: string
  language?: Language
}

function createDeploymentRandom(seed: string) {
  let state = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    state = Math.imul(state ^ seed.charCodeAt(index), 16777619)
  }

  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function DeploymentMapCard({ deployment, language }: { deployment: Deployment; language: Language }) {
  const mapDeployment = useMemo(() => {
    if (typeof deployment.latitude === 'number' && typeof deployment.longitude === 'number') return deployment
    const random = createDeploymentRandom(`${deployment.id}-map`)
    return {
      ...deployment,
      latitude: 47 + random() * 7,
      longitude: 6 + random() * 9,
    }
  }, [deployment])

  return <DeploymentLocationMap deployments={[mapDeployment]} language={language} />
}

type ReportOptions = {
  showBatteryReadings: boolean
  showAccessories: boolean
  showDeviceMarkers: boolean
  showCommissioningGraphs: boolean
  showPerDeviceGraphs: boolean
  showPivotTable: boolean
  showTechnicianSignOff: boolean
  showCoolingFanGraphs: boolean
}

const defaultReportOptions: ReportOptions = {
  showBatteryReadings: false,
  showAccessories: false,
  showDeviceMarkers: false,
  showCommissioningGraphs: true,
  showPerDeviceGraphs: false,
  showPivotTable: false,
  showTechnicianSignOff: false,
  showCoolingFanGraphs: false,
}

function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character]
  })
}

function ReportDialog({
  deployment,
  lineItems,
  deviceTypes,
  medicalDevice,
  language,
  onCreateReport,
  onClose,
}: {
  deployment: Deployment
  lineItems: EquipmentLineItem[]
  deviceTypes: DeviceType[]
  medicalDevice: { model: string; serial: string; operatingHours: number; inspection: string }
  language: Language
  onCreateReport: (reportName: string, documentHtml: string) => void
  onClose: () => void
}) {
  const isEnglish = language === 'en'
  const [reportName, setReportName] = useState(`${deployment.name} · ${isEnglish ? 'Report' : 'Bericht'}`)
  const [selectedLineItemIds, setSelectedLineItemIds] = useState(lineItems.map((lineItem) => lineItem.id))
  const [options, setOptions] = useState(defaultReportOptions)
  const [error, setError] = useState('')
  const selectedLineItems = lineItems.filter((lineItem) => selectedLineItemIds.includes(lineItem.id))
  const questions: { key: keyof ReportOptions; label: string }[] = [
    { key: 'showBatteryReadings', label: isEnglish ? 'Show battery voltage and battery status per device in the report?' : 'Batteriespannung und Batteriestatus je Gerät im Bericht anzeigen?' },
    { key: 'showAccessories', label: isEnglish ? 'Show accessories and consumables list in the report?' : 'Zubehör- und Verbrauchsmaterialliste im Bericht anzeigen?' },
    { key: 'showDeviceMarkers', label: isEnglish ? 'Show device location markers on the site map, including single devices?' : 'Gerätestandorte auf der Standortkarte anzeigen, auch bei einzelnen Geräten?' },
    { key: 'showCommissioningGraphs', label: isEnglish ? 'Show commissioning graphs (power draw vs. battery voltage) in the report?' : 'Inbetriebnahme-Diagramme (Leistungsaufnahme über Batteriespannung) im Bericht anzeigen?' },
    { key: 'showPerDeviceGraphs', label: isEnglish ? 'Add a separate self-test graph for each device?' : 'Für jedes Gerät ein eigenes Selbsttest-Diagramm hinzufügen?' },
    { key: 'showPivotTable', label: isEnglish ? 'Show a pivot table with commissioning date, device type and quantity?' : 'Pivot-Tabelle mit Inbetriebnahmedatum, Gerätetyp und Anzahl anzeigen?' },
    { key: 'showTechnicianSignOff', label: isEnglish ? 'Add technician sign-off and commissioning feedback?' : 'Techniker-Freigabe und Inbetriebnahme-Feedback hinzufügen?' },
    { key: 'showCoolingFanGraphs', label: isEnglish ? 'Add cooling-fan graphs to the report? (fan-speed sensor required)' : 'Lüfterdrehzahl-Diagramme hinzufügen? (Lüfterdrehzahl-Sensor vorausgesetzt)' },
  ]

  function buildCommissioningGraph(lineItemList: EquipmentLineItem[], title: string) {
    const colors = ['#315b8a', '#b54a5d', '#668b63', '#8a6a47', '#7851a9', '#27828b']
    const series = lineItemList
      .map((lineItem, seriesIndex) => {
        const random = createDeploymentRandom(`${deployment.id}-${lineItem.id}-graph`)
        const maxBatteryVoltage = options.showBatteryReadings ? 180 : 120
        random() // advance the seeded RNG so the generated graph shapes stay the same
        const points = Array.from({ length: 32 }, (_, index) => {
          const progress = index / 31
          const powerDraw = 45 + progress * 690 + Math.sin(progress * Math.PI * 6 + random()) * 12
          const batteryVoltage = progress * maxBatteryVoltage
          const x = 64 + (powerDraw / 800) * 690
          const y = 24 + 205 - (batteryVoltage / maxBatteryVoltage) * 205
          return `${x.toFixed(1)},${y.toFixed(1)}`
        }).join(' ')
        return `<polyline points="${points}" fill="none" stroke="${colors[seriesIndex % colors.length]}" stroke-width="2.5"/><text x="650" y="${38 + seriesIndex * 18}" fill="${colors[seriesIndex % colors.length]}" font-size="11">${escapeHtml(lineItem.label)}</text>`
      })
      .join('')
    return `<section class="report-section"><h2>${escapeHtml(title)}</h2><svg viewBox="0 0 800 280" role="img" aria-label="${escapeHtml(title)}"><rect width="800" height="280" fill="white"/>${[0, 50, 100, 150, 200].map((batteryVoltage) => `<line x1="64" y1="${229 - batteryVoltage}" x2="754" y2="${229 - batteryVoltage}" stroke="#d8dee8"/><text x="54" y="${233 - batteryVoltage}" text-anchor="end" font-size="11" fill="#333">${-batteryVoltage}</text>`).join('')}${[0, 200, 400, 600, 800].map((powerDraw) => `<line x1="${64 + powerDraw / 800 * 690}" y1="24" x2="${64 + powerDraw / 800 * 690}" y2="229" stroke="#e0e4ea"/><text x="${64 + powerDraw / 800 * 690}" y="248" text-anchor="middle" font-size="11" fill="#333">${powerDraw}</text>`).join('')}<rect x="64" y="24" width="690" height="205" fill="none" stroke="#555"/>${series}<text x="410" y="272" text-anchor="middle" font-size="12">${isEnglish ? 'Power Draw [W]' : 'Leistungsaufnahme [W]'}</text><text x="16" y="126" text-anchor="middle" font-size="12" transform="rotate(-90 16 126)">${isEnglish ? 'Battery Voltage [V]' : 'Batteriespannung [V]'}</text></svg></section>`
  }

  function createReport() {
    const normalizedReportName = reportName.trim()
    if (!normalizedReportName) {
      setError(isEnglish ? 'Enter a name for the report.' : 'Geben Sie einen Namen für den Bericht ein.')
      return
    }

    if (!selectedLineItems.length) {
      setError(isEnglish ? 'Select at least one line item for the report.' : 'Wählen Sie mindestens eine Geräteposition für den Bericht aus.')
      return
    }

    const reportWindow = window.open('', '_blank')
    if (!reportWindow) {
      setError(isEnglish ? 'The report window was blocked. Allow pop-ups and try again.' : 'Das Berichtsfenster wurde blockiert. Erlauben Sie Pop-ups und versuchen Sie es erneut.')
      return
    }

    const lineItemRows = selectedLineItems
      .map((lineItem, index) => {
        const random = createDeploymentRandom(`${deployment.id}-${lineItem.id}-report`)
        const batteryVoltage = 80 + Math.floor(random() * 170)
        const batteryChargeCycles = batteryVoltage + 60 + Math.floor(random() * 100)
        return `<tr><td>${index + 1}</td><td>${escapeHtml(lineItem.label)}</td><td>${lineItem.quantity}</td>${options.showBatteryReadings ? `<td>${batteryChargeCycles} ${isEnglish ? 'charge cycles' : 'Ladezyklen'}</td><td>${batteryVoltage} V</td>` : ''}</tr>`
      })
      .join('')
    const accessories = options.showAccessories
      ? `<section class="report-section"><h2>${isEnglish ? 'Accessories and consumables' : 'Zubehör und Verbrauchsmaterial'}</h2><table><thead><tr><th>${isEnglish ? 'Device type' : 'Gerätetyp'}</th><th>${isEnglish ? 'Series' : 'Serie'}</th><th>${isEnglish ? 'Quantity' : 'Anzahl'}</th></tr></thead><tbody>${deviceTypes.map((deviceType, index) => `<tr><td>${escapeHtml(deviceType.name)}</td><td>${escapeHtml(deviceType.series)}</td><td>${selectedLineItems.reduce((sum, lineItem) => sum + lineItem.quantity, 0) - index * 2}</td></tr>`).join('')}</tbody></table></section>`
      : ''
    const deviceMarkers = selectedLineItems
      .map((lineItem, index) => {
        const x = 95 + (index % 4) * 100
        const y = 65 + Math.floor(index / 4) * 85
        const marker = options.showDeviceMarkers ? `<circle cx="${x}" cy="${y}" r="18" fill="none" stroke="#315b8a" stroke-width="2"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10" fill="#17365d">${index + 1}</text>` : ''
        return `<g>${marker}<circle cx="${x}" cy="${y}" r="5" fill="#17365d"/></g>`
      })
      .join('')
    const lineItemMap = `<section class="report-section"><h2>${isEnglish ? 'Site map and device locations' : 'Standortkarte und Gerätestandorte'}</h2><div class="map"><svg viewBox="0 0 500 210" role="img" aria-label="${escapeHtml(deployment.location)}">${Array.from({ length: 6 }, (_, index) => `<path d="M${index * 100} 0 L${index * 100 + 45} 210 M0 ${index * 42} L500 ${index * 42 + 20}" stroke="#d7e2de" fill="none"/>`).join('')}${deviceMarkers}</svg><p>${escapeHtml(deployment.location)}${deployment.country ? `, ${escapeHtml(deployment.country)}` : ''}</p></div></section>`
    const commissioningGraphs = options.showCommissioningGraphs
      ? `${buildCommissioningGraph(selectedLineItems, isEnglish ? 'Commissioning graph' : 'Inbetriebnahme-Diagramm')}${options.showPerDeviceGraphs ? selectedLineItems.map((lineItem) => buildCommissioningGraph([lineItem], `${isEnglish ? 'Self-test graph' : 'Selbsttest-Diagramm'} · ${lineItem.label}`)).join('') : ''}`
      : ''
    const pivotTable = options.showPivotTable
      ? `<section class="report-section"><h2>${isEnglish ? 'Commissioning overview' : 'Inbetriebnahmeübersicht'}</h2><table><thead><tr><th>${isEnglish ? 'Commissioning date' : 'Inbetriebnahmedatum'}</th><th>${isEnglish ? 'Device type' : 'Gerätetyp'}</th><th>${isEnglish ? 'Quantity' : 'Anzahl'}</th></tr></thead><tbody>${selectedLineItems.map((lineItem, index) => `<tr><td>${escapeHtml(deployment.startDate ?? deployment.createdAt.slice(0, 10))}</td><td>${escapeHtml(deviceTypes[index % deviceTypes.length].name)}</td><td>${lineItem.quantity}</td></tr>`).join('')}</tbody></table></section>`
      : ''
    const technicianSignOff = options.showTechnicianSignOff
      ? `<section class="report-section"><h2>${isEnglish ? 'Technician sign-off' : 'Techniker-Freigabe'}</h2><p>${isEnglish ? 'Commissioning completed successfully. All selected devices passed the power-on self-test and electrical safety check.' : 'Inbetriebnahme erfolgreich abgeschlossen. Alle ausgewählten Geräte haben den Einschalt-Selbsttest und die elektrische Sicherheitsprüfung bestanden.'}</p></section>`
      : ''
    const coolingFanGraphs = options.showCoolingFanGraphs
      ? `<section class="report-section"><h2>${isEnglish ? 'Cooling fan' : 'Lüfter'}</h2><p>${isEnglish ? 'Fan-speed sensor data is not available for this sample deployment.' : 'Für diese Beispielbereitstellung sind keine Daten des Lüfterdrehzahl-Sensors verfügbar.'}</p></section>`
      : ''
    const title = `${isEnglish ? 'Commissioning report' : 'Inbetriebnahmebericht'} · ${deployment.name}`

    const documentHtml = `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><title>${escapeHtml(normalizedReportName)}</title><style>
      *{box-sizing:border-box}body{font:14px/1.5 Arial,sans-serif;color:#182235;margin:0;padding:36px}h1{font-size:26px;margin:0 0 4px}h2{font-size:17px;margin:0 0 12px}p{margin:4px 0}.subtitle{color:#697386}.report-section{margin:26px 0;break-inside:avoid}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:9px 10px;border-bottom:1px solid #dfe4eb}th{background:#f0f2f5;font-size:12px;text-transform:uppercase}.details{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#dfe4eb;border:1px solid #dfe4eb;margin-top:18px}.details div{background:#fff;padding:10px}.details small{display:block;color:#697386}.map{border:1px solid #dfe4eb;border-radius:8px;padding:10px;background:#f4f7f5}.map svg{display:block;width:100%;height:190px}.report-section svg:not(.map svg){display:block;width:100%;height:auto}.foot{margin-top:32px;padding-top:10px;border-top:1px solid #dfe4eb;color:#697386;font-size:11px}@page{size:A4;margin:14mm}@media print{body{padding:0}.report-section{break-inside:avoid}h1,h2{break-after:avoid}table{break-inside:auto}tr{break-inside:avoid;break-after:auto}}
      </style></head><body><h1>${escapeHtml(normalizedReportName)}</h1><p class="subtitle">${escapeHtml(deployment.name)} · ${escapeHtml(isEnglish ? 'Commissioning report' : 'Inbetriebnahmebericht')} · ${escapeHtml(new Date().toLocaleDateString(isEnglish ? 'en-GB' : 'de-DE'))}</p><div class="details"><div><small>${isEnglish ? 'Care provider' : 'Einrichtung'}</small>${escapeHtml(getCareProviderName(deployment.careProviderId))}</div><div><small>${isEnglish ? 'Location' : 'Standort'}</small>${escapeHtml(deployment.location)}</div><div><small>${isEnglish ? 'Created by' : 'Erstellt von'}</small>${escapeHtml(deployment.createdBy)}</div><div><small>${isEnglish ? 'Created on' : 'Erstellt am'}</small>${escapeHtml(formatDateTime(deployment.createdAt))}</div><div><small>${isEnglish ? 'Medical device' : 'Medizingerät'}</small>${escapeHtml(medicalDevice.model)} · ${escapeHtml(medicalDevice.serial)}</div><div><small>${isEnglish ? 'Device types' : 'Gerätetypen'}</small>${deviceTypes.map((deviceType) => escapeHtml(deviceType.name)).join('<br>')}</div></div>${lineItemMap}<section class="report-section"><h2>${isEnglish ? 'Selected line items' : 'Ausgewählte Gerätepositionen'}</h2><table><thead><tr><th>#</th><th>${isEnglish ? 'Line item' : 'Geräteposition'}</th><th>${isEnglish ? 'Quantity' : 'Anzahl'}</th>${options.showBatteryReadings ? `<th>${isEnglish ? 'Battery status' : 'Batteriestatus'}</th><th>${isEnglish ? 'Battery voltage' : 'Batteriespannung'}</th>` : ''}</tr></thead><tbody>${lineItemRows}</tbody></table></section>${accessories}${pivotTable}${commissioningGraphs}${options.showCoolingFanGraphs ? coolingFanGraphs : ''}${technicianSignOff}<footer class="foot">${escapeHtml(normalizedReportName)} · ${escapeHtml(title)} · ${escapeHtml(medicalDevice.model)} · ${escapeHtml(medicalDevice.inspection)}</footer><script>window.addEventListener('afterprint',()=>window.close(),{once:true});window.addEventListener('load',()=>setTimeout(()=>window.print(),300),{once:true});</script></body></html>`
    reportWindow.document.open()
    reportWindow.document.write(documentHtml)
    reportWindow.document.close()
    onCreateReport(normalizedReportName, documentHtml)
    setError('')
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center overflow-y-auto bg-black/60 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="report-dialog-title" className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{isEnglish ? 'Create PDF report' : 'PDF-Bericht erstellen'}</p>
            <h2 id="report-dialog-title" className="mt-1 text-lg font-semibold">{deployment.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={isEnglish ? 'Close report settings' : 'Berichtseinstellungen schließen'} className="rounded-md p-2 text-muted-foreground hover:bg-muted">
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>
        <div className="space-y-6 p-5 sm:p-6">
          <label className="block space-y-2 text-sm font-semibold" htmlFor="deployment-report-name">
            {isEnglish ? 'Report name' : 'Berichtsname'}
            <input
              id="deployment-report-name"
              value={reportName}
              onChange={(event) => setReportName(event.target.value)}
              maxLength={120}
              required
              className="h-10 w-full rounded-lg border border-input bg-background px-3 font-normal outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{isEnglish ? 'Report contents' : 'Berichtsinhalt'}</legend>
            <div className="divide-y divide-border rounded-xl border border-border">
              {questions.map(({ key, label }) => (
                <label key={key} className="flex cursor-pointer items-start gap-3 px-4 py-3 text-sm hover:bg-muted/40">
                  <input
                    type="checkbox"
                    checked={options[key]}
                    onChange={(event) => setOptions((current) => ({ ...current, [key]: event.target.checked }))}
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <button type="button" onClick={() => setOptions({ showBatteryReadings: false, showAccessories: false, showDeviceMarkers: false, showCommissioningGraphs: false, showPerDeviceGraphs: false, showPivotTable: false, showTechnicianSignOff: false, showCoolingFanGraphs: false })} className="mt-3 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
              {isEnglish ? 'Deselect all' : 'Alle abwählen'}
            </button>
          </fieldset>
          <fieldset>
            <div className="mb-2 flex items-center justify-between gap-3">
              <legend className="text-sm font-semibold">{isEnglish ? 'Select line items to include' : 'Gerätepositionen für den Bericht auswählen'}</legend>
              <button type="button" onClick={() => setSelectedLineItemIds(selectedLineItemIds.length === lineItems.length ? [] : lineItems.map((lineItem) => lineItem.id))} className="text-xs font-medium text-primary hover:underline">
                {selectedLineItemIds.length === lineItems.length ? (isEnglish ? 'Deselect all' : 'Alle abwählen') : (isEnglish ? 'Select all' : 'Alle auswählen')}
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {lineItems.map((lineItem) => (
                <label key={lineItem.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted/40">
                  <span className="flex min-w-0 items-center gap-2">
                    <input type="checkbox" checked={selectedLineItemIds.includes(lineItem.id)} onChange={() => setSelectedLineItemIds((current) => current.includes(lineItem.id) ? current.filter((id) => id !== lineItem.id) : [...current, lineItem.id])} className="size-4 shrink-0 accent-primary" />
                    <span className="truncate">{lineItem.label}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{lineItem.quantity} {isEnglish ? 'pcs' : 'Stk.'}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose}>{isEnglish ? 'Cancel' : 'Abbrechen'}</Button>
            <Button type="button" onClick={createReport}><FileText className="size-4" aria-hidden="true" />{isEnglish ? 'Create PDF' : 'PDF erstellen'}</Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export function DeploymentDetails({ deploymentId, language = 'de' }: DeploymentDetailsProps) {
  const { deployments, reports, deletedReports, addReport, deleteReport, openEditDeployment, deleteDeployment, markDeploymentCompleted } = useDeployments()
  const router = useRouter()
  const [reportOpen, setReportOpen] = useState(false)
  const isEnglish = language === 'en'
  const heading = isEnglish ? 'Deployment Details' : 'Bereitstellungsdetails'

  if (!deploymentId) {
    return (
      <div className="mx-auto flex max-w-[1500px] flex-col gap-7">
        <div>
          <p className="mb-2 text-sm font-semibold text-primary">CareOps Gruppe · {heading}</p>
          <h1 className="text-[28px] font-semibold tracking-tight sm:text-[32px]">{heading}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isEnglish ? 'Choose a deployment to view its details.' : 'Wählen Sie eine Bereitstellung aus, um die Details anzusehen.'}
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {deployments.map((deployment) => (
              <li key={deployment.id}>
                <Link
                  href={`/deployments/details/${encodeURIComponent(deployment.id)}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{deployment.name}</span>
                    <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" aria-hidden="true" />
                      {deployment.location} · {getCareProviderName(deployment.careProviderId)}
                    </span>
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  const deployment = deployments.find((item) => item.id === deploymentId)

  if (!deployment) {
    return (
      <div className="mx-auto max-w-[1500px]">
        <p className="text-sm text-muted-foreground">
          {isEnglish ? 'Deployment not found.' : 'Bereitstellung wurde nicht gefunden.'}
        </p>
        <Link href="/deployments/details" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {isEnglish ? 'Back to deployments' : 'Zurück zu den Bereitstellungen'}
        </Link>
      </div>
    )
  }

  const currentDeployment = deployment
  const lineItems = currentDeployment.lineItems?.length
    ? currentDeployment.lineItems
    : Array.from({ length: 4 }, (_, index) => ({
        id: `${currentDeployment.id}-line-item-${index + 1}`,
        label: `Position ${String(index + 1).padStart(2, '0')}`,
        quantity: 2 + Math.floor(createDeploymentRandom(`${currentDeployment.id}-quantity-${index}`)() * 8),
      }))
  const demoRandom = createDeploymentRandom(currentDeployment.id)
  const deploymentReports = reports.filter(
    (report) =>
      report.deploymentId === currentDeployment.id ||
      (!report.deploymentId && report.deploymentName === currentDeployment.name && report.careProviderId === currentDeployment.careProviderId),
  )
  const hasDeletedDeploymentReports = deletedReports.some((report) => report.deploymentId === currentDeployment.id)
  const shownReports: Report[] =
    deploymentReports.length > 0
      ? deploymentReports
      : hasDeletedDeploymentReports
        ? []
        : Array.from({ length: 2 + Math.floor(demoRandom() * 2) }, (_, index) => ({
          id: `${currentDeployment.id}-demo-report-${index + 1}`,
          deploymentId: currentDeployment.id,
          deploymentName: `${isEnglish ? 'Commissioning report' : 'Inbetriebnahmebericht'} ${index + 1}`,
          careProviderId: currentDeployment.careProviderId,
          createdAt: currentDeployment.createdAt,
        }))
  const deviceTypes =
    currentDeployment.deviceTypes?.length
      ? currentDeployment.deviceTypes
      : Array.from({ length: 2 }, (_, index) => {
          const optionIndex = Math.floor(createDeploymentRandom(`${currentDeployment.id}-device-type-${index}`)() * deviceTypeOptions.length)
          return deviceTypeOptions[optionIndex]
        })
  const medicalDeviceRandom = createDeploymentRandom(`${currentDeployment.id}-medical-device`)
  const medicalDeviceModels = ['CareOps InfuMed 300', 'CareOps VitaScan 500', 'CareOps CardioLink D30']
  const medicalDevice = {
    model: medicalDeviceModels[Math.floor(medicalDeviceRandom() * medicalDeviceModels.length)],
    serial: `CO-${String(10000 + Math.floor(medicalDeviceRandom() * 90000))}`,
    operatingHours: 120 + Math.floor(medicalDeviceRandom() * 1800),
    inspection: new Date(Date.UTC(2026, Math.floor(medicalDeviceRandom() * 12), 1 + Math.floor(medicalDeviceRandom() * 27)))
      .toISOString()
      .slice(0, 10),
  }
  function downloadReport(report: Report) {
    const reportWindow = window.open('', '_blank')
    if (!reportWindow) {
      window.alert(isEnglish ? 'The report window was blocked. Allow pop-ups and try again.' : 'Das Berichtsfenster wurde blockiert. Erlauben Sie Pop-ups und versuchen Sie es erneut.')
      return
    }

    const title = report.reportName ?? report.deploymentName
    const documentHtml = report.documentHtml ?? `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font:14px/1.5 Arial,sans-serif;color:#182235;margin:0;padding:36px}h1{font-size:26px;margin:0 0 18px}.details{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#dfe4eb;border:1px solid #dfe4eb}.details div{background:#fff;padding:12px}.details small{display:block;color:#697386}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{text-align:left;padding:9px 10px;border-bottom:1px solid #dfe4eb}th{background:#f0f2f5}@page{size:A4;margin:14mm}@media print{body{padding:0}}</style></head><body><h1>${escapeHtml(title)}</h1><div class="details"><div><small>${isEnglish ? 'Deployment' : 'Bereitstellung'}</small>${escapeHtml(currentDeployment.name)}</div><div><small>${isEnglish ? 'Care provider' : 'Einrichtung'}</small>${escapeHtml(getCareProviderName(currentDeployment.careProviderId))}</div><div><small>${isEnglish ? 'Location' : 'Standort'}</small>${escapeHtml(currentDeployment.location)}</div><div><small>${isEnglish ? 'Created by' : 'Erstellt von'}</small>${escapeHtml(currentDeployment.createdBy)}</div><div><small>${isEnglish ? 'Medical device' : 'Medizingerät'}</small>${escapeHtml(medicalDevice.model)} · ${escapeHtml(medicalDevice.serial)}</div><div><small>${isEnglish ? 'Created on' : 'Erstellt am'}</small>${escapeHtml(formatDateTime(report.createdAt))}</div></div><table><thead><tr><th>${isEnglish ? 'Line item' : 'Geräteposition'}</th><th>${isEnglish ? 'Quantity' : 'Anzahl'}</th></tr></thead><tbody>${lineItems.map((lineItem) => `<tr><td>${escapeHtml(lineItem.label)}</td><td>${lineItem.quantity}</td></tr>`).join('')}</tbody></table><script>window.addEventListener('afterprint',()=>window.close(),{once:true});window.addEventListener('load',()=>setTimeout(()=>window.print(),300),{once:true});</script></body></html>`
    reportWindow.document.open()
    reportWindow.document.write(documentHtml)
    reportWindow.document.close()
  }

  function removeReport(report: Report) {
    if (window.confirm(isEnglish ? `Delete "${report.reportName ?? report.deploymentName}"?` : `„${report.reportName ?? report.deploymentName}“ löschen?`)) {
      deleteReport({ ...report, deploymentId: report.deploymentId ?? currentDeployment.id })
    }
  }
  const matchingUsageRecords = sampleUsageRecords.filter((usageRecord) => usageRecord.deployment === currentDeployment.name)
  const shownUsageRecords =
    matchingUsageRecords.length > 0
      ? matchingUsageRecords.slice(0, 5)
      : Array.from({ length: 3 }, (_, index) => {
          const random = createDeploymentRandom(`${currentDeployment.id}-usage-record-${index}`)
          return {
            id: 20000 + Math.floor(random() * 80000),
            timestamp: `${currentDeployment.createdAt.slice(0, 10)} ${String(8 + Math.floor(random() * 10)).padStart(2, '0')}:${String(Math.floor(random() * 60)).padStart(2, '0')}:00`,
            batteryVoltage: 80 + Math.floor(random() * 180),
            powerDraw: 500 + Math.floor(random() * 9500),
            deviceType: deviceTypes[index % deviceTypes.length].name,
          }
        })
  const fields = [
    [isEnglish ? 'Care provider' : 'Einrichtung', getCareProviderName(currentDeployment.careProviderId)],
    [isEnglish ? 'Location' : 'Standort', currentDeployment.location],
    [isEnglish ? 'Created by' : 'Erstellt von', currentDeployment.createdBy],
    [isEnglish ? 'Created on' : 'Erstellt am', formatDateTime(currentDeployment.createdAt)],
    ...(currentDeployment.reference ? [[isEnglish ? 'Reference' : 'Referenz', currentDeployment.reference]] : []),
    ...(currentDeployment.street ? [[isEnglish ? 'Street' : 'Straße', currentDeployment.street]] : []),
    ...(currentDeployment.zip ? [[isEnglish ? 'Postal code' : 'Postleitzahl', currentDeployment.zip]] : []),
    ...(currentDeployment.country ? [[isEnglish ? 'Country' : 'Land', currentDeployment.country]] : []),
  ]

  function downloadFile(filename: string, content: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function exportDeployment() {
    const safeName = currentDeployment.name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    downloadFile(`${safeName}.json`, JSON.stringify(currentDeployment, null, 2), 'application/json;charset=utf-8')
  }

  function exportLineItems() {
    const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
    const rows = [
      ['#', isEnglish ? 'Line item' : 'Geräteposition', isEnglish ? 'Quantity' : 'Menge'],
      ...(currentDeployment.lineItems ?? []).map((lineItem, index) => [
        String(index + 1),
        lineItem.label,
        String(lineItem.quantity),
      ]),
    ]
    const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(';')).join('\r\n')}`
    const safeName = currentDeployment.name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    downloadFile(`${safeName}-line-items.csv`, csv, 'text/csv;charset=utf-8')
  }

  function confirmDelete() {
    const confirmed = window.confirm(
      isEnglish
        ? `Delete "${currentDeployment.name}"? This cannot be undone.`
        : `„${currentDeployment.name}“ wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.`,
    )
    if (!confirmed) return

    deleteDeployment(currentDeployment.id)
    router.push('/deployments/list')
  }

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-7">
      <Link href="/deployments/details" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {isEnglish ? 'All deployment details' : 'Alle Bereitstellungsdetails'}
      </Link>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-primary">CareOps Gruppe · {heading}</p>
            <h1 className="text-[28px] font-semibold tracking-tight text-balance sm:text-[32px]">{currentDeployment.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" aria-hidden="true" />
              {currentDeployment.location}
            </p>
          </div>
          <StatusBadge status={currentDeployment.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setReportOpen(true)}>
            <FileText className="size-4" aria-hidden="true" />
            {isEnglish ? 'Generate report' : 'Bericht erstellen'}
          </Button>
          <Button type="button" variant="outline" onClick={exportDeployment}>
            <Download className="size-4" aria-hidden="true" />
            {isEnglish ? 'Export deployment' : 'Bereitstellung exportieren'}
          </Button>
          <Button type="button" variant="outline" onClick={exportLineItems}>
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            {isEnglish ? 'Export line items' : 'Gerätepositionen exportieren'}
          </Button>
          <Button type="button" variant="outline" onClick={() => openEditDeployment(currentDeployment.id)}>
            <Pencil className="size-4" aria-hidden="true" />
            {isEnglish ? 'Edit' : 'Bearbeiten'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={currentDeployment.status === 'completed'}
            onClick={() => markDeploymentCompleted(currentDeployment.id)}
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            {currentDeployment.status === 'completed'
              ? isEnglish ? 'Completed' : 'Erledigt'
              : isEnglish ? 'Mark as completed' : 'Als erledigt markieren'}
          </Button>
          <Button type="button" variant="destructive" onClick={confirmDelete}>
            <Trash2 className="size-4" aria-hidden="true" />
            {isEnglish ? 'Delete' : 'Löschen'}
          </Button>
        </div>
      </div>
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <dl className="grid gap-px bg-border sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="bg-card px-5 py-4">
              <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <Panel
        title={isEnglish ? 'Usage records' : 'Nutzungsdatensätze'}
        description={isEnglish ? 'Commissioning test records for this deployment' : 'Inbetriebnahme-Testprotokolle für diese Bereitstellung'}
        action={
          <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
            {shownUsageRecords.length}
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3">{isEnglish ? 'Usage record' : 'Nutzungsdatensatz'}</th>
                <th scope="col" className="px-5 py-3">{isEnglish ? 'Date (UTC)' : 'Datum (UTC)'}</th>
                <th scope="col" className="px-5 py-3">{isEnglish ? 'Device type' : 'Gerätetyp'}</th>
                <th scope="col" className="px-5 py-3 text-right">{isEnglish ? 'Battery voltage' : 'Batteriespannung'}</th>
                <th scope="col" className="px-5 py-3 text-right">{isEnglish ? 'Max. power draw' : 'Max. Leistungsaufnahme'}</th>
              </tr>
            </thead>
            <tbody>
              {shownUsageRecords.map((usageRecord) => (
                <tr key={usageRecord.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">#{usageRecord.id}</td>
                  <td className="px-5 py-3 text-muted-foreground">{usageRecord.timestamp}</td>
                  <td className="max-w-[240px] truncate px-5 py-3" title={usageRecord.deviceType}>{usageRecord.deviceType}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{usageRecord.batteryVoltage} V</td>
                  <td className="px-5 py-3 text-right tabular-nums">{usageRecord.powerDraw.toLocaleString(isEnglish ? 'en' : 'de-DE')} W</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <header className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">
            {isEnglish ? 'Line items' : 'Gerätepositionen'} ({lineItems.length})
          </h2>
        </header>
        {lineItems.length ? (
          <div>
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-10" />
                <col />
                <col className="w-24" />
              </colgroup>
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3">#</th>
                  <th scope="col" className="px-5 py-3">{isEnglish ? 'Name' : 'Name'}</th>
                  <th scope="col" className="px-5 py-3 text-right">{isEnglish ? 'Quantity' : 'Menge'}</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((lineItem, index) => (
                  <tr key={lineItem.id} className="border-t border-border">
                    <td className="px-5 py-3 tabular-nums text-muted-foreground">{index + 1}</td>
                    <td className="break-words px-2 py-3 font-medium">{lineItem.label}</td>
                    <td className="break-words px-2 py-3 text-right tabular-nums">{lineItem.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-5 text-sm text-muted-foreground">
            {isEnglish ? 'No line items have been added.' : 'Es wurden noch keine Gerätepositionen hinzugefügt.'}
          </p>
        )}
      </section>
      <div className="grid items-stretch gap-5 md:grid-cols-2">
        <DeploymentMapCard deployment={currentDeployment} language={language} />
        <Panel
          title={isEnglish ? 'Reports' : 'Berichte'}
          description={isEnglish ? 'Reports associated with this deployment' : 'Berichte zu dieser Bereitstellung'}
          action={
            <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
              {shownReports.length}
            </span>
          }
          className="h-full"
        >
          <ul className="divide-y divide-border px-5 pb-4">
            {shownReports.length > 0 ? (
              shownReports.map((report) => (
                <li key={report.id} className="flex items-center gap-2 py-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{report.reportName ?? report.deploymentName}</span>
                  <time className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatDateTime(report.createdAt)}</time>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={isEnglish ? `Download ${report.reportName ?? report.deploymentName} as PDF` : `${report.reportName ?? report.deploymentName} als PDF herunterladen`}
                      title={isEnglish ? 'Download as PDF' : 'Als PDF herunterladen'}
                      onClick={() => downloadReport(report)}
                    >
                      <Download className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={isEnglish ? `Delete ${report.reportName ?? report.deploymentName}` : `${report.reportName ?? report.deploymentName} löschen`}
                      title={isEnglish ? 'Delete report' : 'Bericht löschen'}
                      onClick={() => removeReport(report)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))
            ) : (
              <li className="py-5 text-sm text-muted-foreground">
                {isEnglish ? 'No reports for this deployment.' : 'Keine Berichte für diese Bereitstellung.'}
              </li>
            )}
          </ul>
        </Panel>

        <Panel
          title={isEnglish ? 'Device types used' : 'Verwendete Gerätetypen'}
          description={isEnglish ? 'Device types used on this deployment' : 'Bei dieser Bereitstellung verwendete Gerätetypen'}
          className="h-full"
        >
          <ul className="divide-y divide-border px-5 pb-2">
            {deviceTypes.map((deviceType) => (
              <li key={deviceType.id} className="flex items-center justify-between gap-3 py-3">
                <span className="truncate text-sm font-medium">{deviceType.name}</span>
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{deviceType.series}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title={isEnglish ? 'Medical device' : 'Medizingerät'}
          description={isEnglish ? 'Equipment used for commissioning' : 'Für die Inbetriebnahme eingesetztes Gerät'}
          className="h-full"
        >
          <dl className="grid grid-cols-2 gap-4 px-5 pb-5">
            {[
              [isEnglish ? 'Model' : 'Modell', medicalDevice.model],
              [isEnglish ? 'Serial number' : 'Seriennummer', medicalDevice.serial],
              [isEnglish ? 'Operating hours' : 'Betriebsstunden', `${medicalDevice.operatingHours} h`],
              [isEnglish ? 'Last inspection' : 'Letzte Wartung', medicalDevice.inspection],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>

      </div>
      {reportOpen && (
        <ReportDialog
          deployment={currentDeployment}
          lineItems={lineItems}
          deviceTypes={deviceTypes}
          medicalDevice={medicalDevice}
          language={language}
          onCreateReport={(reportName, documentHtml) =>
            addReport({
              deploymentId: currentDeployment.id,
              deploymentName: currentDeployment.name,
              careProviderId: currentDeployment.careProviderId,
              reportName,
              documentHtml,
              createdAt: new Date().toISOString(),
            })
          }
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  )
}
