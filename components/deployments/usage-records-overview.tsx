'use client'

import { useMemo, useState } from 'react'
import { useLanguage, type Language } from '@/components/app-shell'
import {
  Activity,
  ArrowDownWideNarrow,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  FilterX,
  FolderInput,
  MapPin,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useDeployments } from '@/components/deployments-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  createSampleMeasurements,
  usageRecordDisplayValue,
  sampleUsageRecords,
  type UsageRecord,
} from '@/lib/usage-record-data'

const panelClass = 'rounded-lg border border-[#293550] bg-[#151f33]'
const controlClass =
  'h-10 rounded-md border border-[#35415a] bg-[#111a2b] px-3 text-sm text-[#e7ebf3] outline-none placeholder:text-[#8893a8] focus-visible:border-[#aa7af6] focus-visible:ring-2 focus-visible:ring-[#9b6bea]/40'
const tableCellClass = 'px-3 py-3 text-left text-sm text-[#dce2ed]'
const pageSize = 10
const detailPageSize = 50
type UsageRecordTab = 'overview' | 'measurements' | 'chart' | 'location' | 'notes'
type SortKey = 'id' | 'deployment' | 'deviceType' | 'timestamp' | 'batteryVoltage' | 'powerDraw' | 'serial'

function createChartTicks(minimum: number, maximum: number, targetCount = 6) {
  const range = maximum - minimum
  if (!Number.isFinite(range) || range <= 0) return [minimum]

  const roughStep = range / Math.max(1, targetCount - 1)
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const normalizedStep = roughStep / magnitude
  const stepMultiplier = normalizedStep <= 1 ? 1 : normalizedStep <= 2 ? 2 : normalizedStep <= 5 ? 5 : 10
  const step = stepMultiplier * magnitude
  const firstTick = Math.ceil(minimum / step) * step

  return Array.from({ length: targetCount + 2 }, (_, index) => firstTick + index * step)
    .filter((tick) => tick <= maximum + step * 1e-9)
}

function formatDate(date: string, language: Language) {
  return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'de-DE', { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  )
}

function toIsoDate(value: string) {
  const germanDate = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim())
  return germanDate ? `${germanDate[3]}-${germanDate[2]}-${germanDate[1]}` : value
}

function excelCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? '' : String(value)
  const type = typeof value === 'number' ? 'Number' : 'String'
  return `<Cell><Data ss:Type="${type}">${text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</Data></Cell>`
}

function exportExcel(usageRecords: UsageRecord[], language: Language = 'de') {
  const isEnglish = language === 'en'
  const worksheets = usageRecords.map((usageRecord) => {
    const measurements = createSampleMeasurements(usageRecord)
    const metadata: [string, string | number][] = [
      ['CareOps Export', ''],
      ['Website', 'https://careops.example'],
      ['Export Timestamp', new Date().toISOString()],
      ['Process', usageRecord.process],
      ['Serial', usageRecord.serial],
      ['Usage Record ID', usageRecord.id],
      ['Deployment Name', usageRecordDisplayValue(usageRecord.deployment, isEnglish ? 'Not provided' : 'Keine Angabe')],
      ['Line Item Name', usageRecordDisplayValue(usageRecord.lineItem, isEnglish ? 'Not provided' : 'Keine Angabe')],
      ['Line Item Feedback', usageRecordDisplayValue(usageRecord.feedback, isEnglish ? 'Not provided' : 'Keine Angabe')],
      ['Line Item Note', usageRecordDisplayValue(usageRecord.note, isEnglish ? 'Not provided' : 'Keine Angabe')],
      ['Device Type Name', usageRecord.deviceType],
      ['GPS Timestamp', usageRecordDisplayValue(usageRecord.gpsTimestamp, isEnglish ? 'Not provided' : 'Keine Angabe')],
      ['GPS Quality', usageRecordDisplayValue(usageRecord.gpsQuality, isEnglish ? 'Not provided' : 'Keine Angabe')],
      ['GPS Satellite', usageRecordDisplayValue(usageRecord.gpsSatellites, isEnglish ? 'Not provided' : 'Keine Angabe')],
      ['GPS Latitude', usageRecordDisplayValue(usageRecord.latitude, isEnglish ? 'Not provided' : 'Keine Angabe')],
      ['GPS Longitude', usageRecordDisplayValue(usageRecord.longitude, isEnglish ? 'Not provided' : 'Keine Angabe')],
      ['CareOps User ID', usageRecordDisplayValue(usageRecord.userId, isEnglish ? 'Not provided' : 'Keine Angabe')],
      ['Datacount', measurements.length],
    ]
    const rows = [
      ...metadata.map(([key, value]) => `<Row>${excelCell(key)}${excelCell(value)}</Row>`),
      `<Row>${['Index', 'Time [s]', 'Power Draw [W]', 'Battery Voltage [V]', 'Cooling Fan Speed [rpm]'].map(excelCell).join('')}</Row>`,
      ...measurements.map(
        (item) =>
          `<Row>${[item.index, item.time, item.powerDraw, item.batteryVoltage, item.coolingFanSpeed ?? (isEnglish ? 'Unavailable' : 'Nicht verfügbar')]
            .map(excelCell)
            .join('')}</Row>`,
      ),
    ].join('')
    const sheetName = `${isEnglish ? 'Usage record' : 'Nutzungsdatensatz'} ${usageRecord.id}`
    return `<Worksheet ss:Name="${sheetName}"><Table>${rows}</Table></Worksheet>`
  })
  const workbook =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">` +
    worksheets.join('') +
    '</Workbook>'
  const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const downloadLink = document.createElement('a')
  downloadLink.href = url
  downloadLink.download =
    usageRecords.length === 1
      ? `careops_usage_record_${usageRecords[0].id}_${usageRecords[0].date}.xls`
      : `careops_usage_records_${new Date().toISOString().slice(0, 10)}.xls`
  document.body.append(downloadLink)
  downloadLink.click()
  downloadLink.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function SortButton({
  label,
  sortKey,
  current,
  direction,
  onSort,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  direction: 'asc' | 'desc'
  onSort: (key: SortKey) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1.5 font-semibold text-[#b8c2d5] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#aa7af6]"
    >
      {label}
      {current === sortKey ? (
        <ArrowDownWideNarrow className={`size-3.5 ${direction === 'asc' ? 'rotate-180' : ''}`} aria-hidden="true" />
      ) : (
        <ChevronsUpDown className="size-3.5 opacity-50" aria-hidden="true" />
      )}
    </button>
  )
}

function ShortValue({ value, fallback }: { value: string | number | null; fallback: string }) {
  const text = value === null || value === '' ? fallback : String(value)
  return (
    <span className="block max-w-[180px] truncate" title={text}>
      {text}
    </span>
  )
}

function UsageRecordActions({
  usageRecord,
  language,
  onDetails,
  onLink,
  onExport,
  onDisable,
}: {
  usageRecord: UsageRecord
  language: Language
  onDetails: () => void
  onLink: () => void
  onExport: () => void
  onDisable: () => void
}) {
  const isEnglish = language === 'en'
  const actions = [
    { label: isEnglish ? 'Analyze usage record' : 'Nutzungsdatensatz analysieren', icon: Activity, action: onDetails },
    { label: isEnglish ? 'Link usage record' : 'Nutzungsdatensatz verknüpfen', icon: FolderInput, action: onLink },
    { label: isEnglish ? 'View details' : 'Details anzeigen', icon: Eye, action: onDetails },
    { label: isEnglish ? 'Download Excel' : 'Excel herunterladen', icon: Download, action: onExport },
    {
      label: usageRecord.linked
        ? (isEnglish ? 'Remove link' : 'Verknüpfung entfernen')
        : (isEnglish ? 'Deactivate usage record' : 'Nutzungsdatensatz deaktivieren'),
      icon: X,
      action: onDisable,
    },
  ]
  return (
    <details className="group relative">
      <summary
        aria-label={isEnglish ? `Actions for usage record ${usageRecord.id}` : `Aktionen für Nutzungsdatensatz ${usageRecord.id}`}
        title={isEnglish ? 'Actions' : 'Aktionen'}
        className="flex size-9 cursor-pointer list-none items-center justify-center rounded-md text-[#b8c2d5] outline-none hover:bg-[#293550] hover:text-white focus-visible:ring-2 focus-visible:ring-[#aa7af6] [&::-webkit-details-marker]:hidden"
      >
        <MoreHorizontal className="size-5" aria-hidden="true" />
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-60 rounded-md border border-[#3a4661] bg-[#111a2b] p-1 shadow-xl">
        {actions.map(({ label, icon: Icon, action }) => (
          <button
            key={label}
            type="button"
            title={label}
            onClick={(event) => {
              const details = event.currentTarget.closest('details')
              if (details) details.open = false
              action()
            }}
            className="flex w-full items-center gap-2.5 rounded px-3 py-2.5 text-left text-sm text-[#e7ebf3] hover:bg-[#293550] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#aa7af6]"
          >
            <Icon className="size-4 text-[#bd9cff]" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </details>
  )
}

function UsageRecordDetails({
  usageRecord,
  language,
  onClose,
  onPatch,
}: {
  usageRecord: UsageRecord
  language: Language
  onClose: () => void
  onPatch: (patch: Partial<UsageRecord>) => void
}) {
  const isEnglish = language === 'en'
  const [tab, setTab] = useState<UsageRecordTab>('overview')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [chartZoom, setChartZoom] = useState(1)
  const [chartOffset, setChartOffset] = useState(0)
  const [showLine, setShowLine] = useState(true)
  const measurements = useMemo(() => createSampleMeasurements(usageRecord), [usageRecord])
  const matchingMeasurements = useMemo(() => {
    const query = search.trim()
    if (!query) return measurements
    return measurements.filter((item) =>
      [item.index, item.time, item.powerDraw, item.batteryVoltage, item.coolingFanSpeed ?? (isEnglish ? 'Unavailable' : 'Nicht verfügbar')].some((value) =>
        String(value).includes(query),
      ),
    )
  }, [isEnglish, measurements, search])
  const shownMeasurements = matchingMeasurements.slice(page * detailPageSize, (page + 1) * detailPageSize)
  const dataCount = matchingMeasurements.length
  const pageCount = Math.max(1, Math.ceil(dataCount / detailPageSize))
  const visibleCount = Math.max(2, Math.floor(measurements.length / chartZoom))
  const chartItems = measurements
    .slice(chartOffset, chartOffset + visibleCount)
    .filter((_, index) => index % Math.max(1, Math.floor(visibleCount / 100)) === 0)
  const chartWidth = 800
  const chartHeight = 480
  const plot = { left: 82, right: 24, top: 28, bottom: 72 }
  const plotWidth = chartWidth - plot.left - plot.right
  const plotHeight = chartHeight - plot.top - plot.bottom
  const powerDrawValues = measurements.map((item) => item.powerDraw)
  const batteryVoltageValues = measurements.map((item) => -item.batteryVoltage)
  const powerDrawMin = Math.min(0, ...powerDrawValues)
  const powerDrawMax = Math.max(1, ...powerDrawValues)
  const batteryVoltageMin = Math.min(0, ...batteryVoltageValues)
  const batteryVoltageMax = Math.max(1, ...batteryVoltageValues)
  const powerDrawTicks = createChartTicks(powerDrawMin, powerDrawMax)
  const batteryVoltageTicks = createChartTicks(batteryVoltageMin, batteryVoltageMax)
  const xPosition = (value: number) =>
    plot.left + ((value - powerDrawMin) / (powerDrawMax - powerDrawMin || 1)) * plotWidth
  const yPosition = (value: number) =>
    plot.top + plotHeight - ((value - batteryVoltageMin) / (batteryVoltageMax - batteryVoltageMin || 1)) * plotHeight
  const points = chartItems.map((item) => `${xPosition(item.powerDraw)},${yPosition(-item.batteryVoltage)}`).join(' ')
  const tabs: { id: UsageRecordTab; label: string; icon: typeof Activity }[] = [
    { id: 'overview', label: isEnglish ? 'Overview' : 'Übersicht', icon: CircleHelp },
    { id: 'measurements', label: isEnglish ? 'Measurements' : 'Messdaten', icon: SlidersHorizontal },
    { id: 'chart', label: isEnglish ? 'Chart' : 'Diagramm', icon: Activity },
    { id: 'location', label: isEnglish ? 'Location' : 'Standort', icon: MapPin },
    { id: 'notes', label: isEnglish ? 'Notes & feedback' : 'Notizen & Feedback', icon: FileSpreadsheet },
  ]

  return (
    <div className="fixed inset-0 z-[1100] flex justify-end">
      <button type="button" aria-label={isEnglish ? 'Close details' : 'Details schließen'} onClick={onClose} className="absolute inset-0 bg-black/65" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="usage-record-details-title"
        className="relative flex h-full w-full max-w-5xl flex-col border-l border-[#35415a] bg-[#101827] text-[#e7ebf3] shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#293550] px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#bd9cff]">{isEnglish ? 'Usage record details' : 'Nutzungsdatensatz-Details'}</p>
            <h2 id="usage-record-details-title" className="mt-1 text-xl font-semibold">{isEnglish ? 'Usage record' : 'Nutzungsdatensatz'} {usageRecord.id}</h2>
            <p className="mt-1 text-sm text-[#aeb9cc]">{usageRecord.timestamp} UTC · {usageRecord.serial}</p>
          </div>
          <button type="button" aria-label={isEnglish ? 'Close details' : 'Details schließen'} title={isEnglish ? 'Close' : 'Schließen'} onClick={onClose} className="rounded p-2 text-[#b8c2d5] hover:bg-[#293550] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#aa7af6]">
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>
        <nav aria-label={isEnglish ? 'Usage record details' : 'Nutzungsdatensatz-Details'} className="flex gap-1 overflow-x-auto border-b border-[#293550] px-4 pt-2 sm:px-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#aa7af6] ${tab === id ? 'border-[#b68aff] text-[#d3b8ff]' : 'border-transparent text-[#aeb9cc] hover:text-white'}`}
            >
              <Icon className="size-4" aria-hidden="true" />{label}
            </button>
          ))}
        </nav>
        <div className="min-h-0 flex-1 overflow-auto p-5 sm:p-7">
          {tab === 'overview' && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                        [isEnglish ? 'Usage Record ID' : 'Nutzungsdatensatz-ID', usageRecord.id],
                        [isEnglish ? 'Process' : 'Prozess', usageRecord.process],
                        [isEnglish ? 'Medical device / Serial number' : 'Medizingerät / Seriennummer', usageRecord.serial],
                        [isEnglish ? 'Deployment name' : 'Bereitstellungsname', usageRecord.deployment],
                        [isEnglish ? 'Line item name' : 'Gerätepositionsname', usageRecord.lineItem],
                        [isEnglish ? 'Line item feedback' : 'Line items-Feedback', usageRecord.feedback],
                        [isEnglish ? 'Line item note' : 'Gerätepositionsnotiz', usageRecord.note],
                        [isEnglish ? 'Device type name' : 'Gerätetypname', usageRecord.deviceType],
                        [isEnglish ? 'GPS timestamp' : 'GPS-Zeitstempel', usageRecord.gpsTimestamp],
                        [isEnglish ? 'GPS quality' : 'GPS-Qualität', usageRecord.gpsQuality],
                        [isEnglish ? 'GPS satellites' : 'GPS-Satelliten', usageRecord.gpsSatellites],
                        [isEnglish ? 'GPS latitude' : 'GPS-Breitengrad', usageRecord.latitude],
                        [isEnglish ? 'GPS longitude' : 'GPS-Längengrad', usageRecord.longitude],
                ['CareOps User ID', usageRecord.userId],
                        [isEnglish ? 'Measurement count' : 'Anzahl Messwerte', measurements.length],
                        [isEnglish ? 'Export timestamp' : 'Exportzeitpunkt', new Date().toISOString()],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#293550] bg-[#151f33] p-4">
                  <p className="text-xs text-[#9eabc1]">{label}</p>
                  <p className="mt-1 break-words text-sm font-medium">{usageRecordDisplayValue(value as string | number | null, isEnglish ? 'Not provided' : 'Keine Angabe')}</p>
                </div>
              ))}
            </div>
          )}
          {tab === 'measurements' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><h3 className="font-semibold">{isEnglish ? 'Measurement series' : 'Messreihe'}</h3><p className="text-xs text-[#9eabc1]">{measurements.length.toLocaleString(language === 'en' ? 'en' : 'de-DE')} {isEnglish ? 'measurements · loaded page by page' : 'Messwerte · seitenweise geladen'}</p></div>
                <button type="button" className="inline-flex h-9 items-center gap-2 rounded-md border border-[#35415a] bg-[#151f33] px-3 text-sm text-white hover:bg-[#293550] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#aa7af6]" onClick={() => {
                  if (window.confirm(isEnglish
                    ? `The complete measurement series for usage record ${usageRecord.id} will be downloaded as an Excel workbook.\n\nContinue?`
                    : `Die komplette Messreihe für Nutzungsdatensatz ${usageRecord.id} wird als Excel-Arbeitsmappe heruntergeladen.\n\nFortfahren?`)) exportExcel([usageRecord], language)
                }}>
                  <Download className="size-4" aria-hidden="true" />{isEnglish ? 'Download measurements as Excel' : 'Messdaten als Excel herunterladen'}
                </button>
              </div>
              <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0) }} placeholder={isEnglish ? 'Search measurements…' : 'Messdaten durchsuchen …'} aria-label={isEnglish ? 'Search measurements' : 'Messdaten durchsuchen'} className={controlClass} />
              <div className="overflow-x-auto rounded-md border border-[#293550]">
                <table className="w-full min-w-[620px] border-collapse text-sm">
                  <thead className="sticky top-0 bg-[#1b2740] text-xs uppercase tracking-wide"><tr>{['Index', isEnglish ? 'Time [s]' : 'Zeit [s]', isEnglish ? 'Power Draw [W]' : 'Leistungsaufnahme [W]', isEnglish ? 'Battery Voltage [V]' : 'Batteriespannung [V]', isEnglish ? 'Cooling Fan Speed [rpm]' : 'Lüfterdrehzahl [U/min]'].map((label) => <th key={label} className={tableCellClass}>{label}</th>)}</tr></thead>
                  <tbody>{shownMeasurements.map((item) => <tr key={item.index} className="border-t border-[#293550] even:bg-white/[0.015]"><td className={tableCellClass}>{item.index}</td><td className={tableCellClass}>{item.time.toFixed(2)}</td><td className={tableCellClass}>{item.powerDraw.toFixed(1)}</td><td className={tableCellClass}>{item.batteryVoltage.toFixed(2)}</td><td className={tableCellClass}>{item.coolingFanSpeed ?? (isEnglish ? 'Unavailable' : 'Nicht verfügbar')}</td></tr>)}</tbody>
                </table>
                {shownMeasurements.length === 0 && <p className="p-6 text-center text-sm text-[#aeb9cc]">{isEnglish ? 'No measurements found.' : 'Keine Messwerte gefunden.'}</p>}
              </div>
              <Pagination page={page} pageCount={pageCount} total={dataCount} pageSize={detailPageSize} onPage={setPage} label={isEnglish ? 'Measurements' : 'Messwerte'} language={language} />
            </div>
          )}
          {tab === 'chart' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{isEnglish ? 'Power draw vs. battery voltage' : 'Leistungsaufnahme über Batteriespannung'}</h3>
                  <p className="text-xs text-[#9eabc1]">{isEnglish ? 'Power Draw [W] · Battery Voltage [V]' : 'Leistungsaufnahme [W] · Batteriespannung [V]'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" aria-label={isEnglish ? 'Pan chart left' : 'Im Diagramm nach links schwenken'} title={isEnglish ? 'Pan left' : 'Nach links schwenken'} disabled={chartOffset === 0} onClick={() => setChartOffset((offset) => Math.max(0, offset - Math.max(1, Math.floor(visibleCount / 2))))} className="rounded border border-[#35415a] px-3 py-2 disabled:opacity-40">←</button>
                  <button type="button" aria-label={isEnglish ? 'Pan chart right' : 'Im Diagramm nach rechts schwenken'} title={isEnglish ? 'Pan right' : 'Nach rechts schwenken'} disabled={chartOffset + visibleCount >= measurements.length} onClick={() => setChartOffset((offset) => Math.min(measurements.length - visibleCount, offset + Math.max(1, Math.floor(visibleCount / 2))))} className="rounded border border-[#35415a] px-3 py-2 disabled:opacity-40">→</button>
                  <button type="button" aria-label={isEnglish ? 'Zoom in' : 'Diagramm vergrößern'} title={isEnglish ? 'Zoom in' : 'Vergrößern'} onClick={() => setChartZoom((zoom) => Math.min(zoom * 2, 16))} className="rounded border border-[#35415a] px-3 py-2">+</button>
                  <button type="button" aria-label={isEnglish ? 'Zoom out' : 'Diagramm verkleinern'} title={isEnglish ? 'Zoom out' : 'Verkleinern'} onClick={() => setChartZoom((zoom) => Math.max(zoom / 2, 1))} className="rounded border border-[#35415a] px-3 py-2">−</button>
                  <button type="button" onClick={() => { setChartZoom(1); setChartOffset(0) }} className="rounded border border-[#35415a] px-3 py-2 text-sm hover:bg-[#293550]">{isEnglish ? 'Reset zoom' : 'Zoom zurücksetzen'}</button>
                  <button type="button" onClick={() => setShowLine((visible) => !visible)} aria-pressed={showLine} className="rounded border border-[#35415a] px-3 py-2 text-sm hover:bg-[#293550]">{showLine ? (isEnglish ? 'Hide series' : 'Reihe ausblenden') : (isEnglish ? 'Show series' : 'Reihe einblenden')}</button>
                  <button type="button" title={isEnglish ? 'Export chart as image' : 'Diagramm als Bild exportieren'} onClick={() => { const svg = document.querySelector('#usage-record-chart'); if (!svg) return; const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `careops_usage_record_${usageRecord.id}_chart.svg`; link.click(); URL.revokeObjectURL(url) }} className="rounded border border-[#35415a] px-3 py-2 text-sm hover:bg-[#293550]"><Download className="mr-2 inline size-4" aria-hidden="true" />{isEnglish ? 'Export image' : 'Bild exportieren'}</button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-md border border-[#293550] bg-white p-2 sm:p-4">
                <svg
                  id="usage-record-chart"
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  role="img"
                  aria-label={isEnglish ? 'Power draw versus battery voltage chart' : 'Diagramm Leistungsaufnahme über Batteriespannung'}
                  className="h-auto min-w-[600px] w-full"
                >
                  <rect width={chartWidth} height={chartHeight} fill="#fff" />
                  {powerDrawTicks.map((tick) => {
                    const x = xPosition(tick)
                    return (
                      <g key={`power-draw-${tick}`}>
                        <line x1={x} y1={plot.top} x2={x} y2={plot.top + plotHeight} stroke="#d1d1d1" />
                        <text x={x} y={plot.top + plotHeight + 22} fill="#202020" fontSize="12" textAnchor="middle">
                          {tick.toLocaleString(language === 'en' ? 'en' : 'de-DE', { maximumFractionDigits: 1 })}
                        </text>
                      </g>
                    )
                  })}
                  {batteryVoltageTicks.map((tick) => {
                    const y = yPosition(tick)
                    return (
                      <g key={`battery-voltage-${tick}`}>
                        <line x1={plot.left} y1={y} x2={plot.left + plotWidth} y2={y} stroke="#d1d1d1" />
                        <text x={plot.left - 10} y={y + 4} fill="#202020" fontSize="12" textAnchor="end">
                          {tick.toLocaleString(language === 'en' ? 'en' : 'de-DE', { maximumFractionDigits: 1 })}
                        </text>
                      </g>
                    )
                  })}
                  <rect x={plot.left} y={plot.top} width={plotWidth} height={plotHeight} fill="none" stroke="#555" />
                  {showLine && <polyline points={points} fill="none" stroke="#171717" strokeWidth="2" vectorEffect="non-scaling-stroke" />}
                  <text x={plot.left + plotWidth / 2} y={chartHeight - 14} fill="#202020" fontSize="13" textAnchor="middle">
                    {isEnglish ? 'Power Draw [W]' : 'Leistungsaufnahme [W]'}
                  </text>
                  <text
                    x="18"
                    y={plot.top + plotHeight / 2}
                    fill="#202020"
                    fontSize="13"
                    textAnchor="middle"
                    transform={`rotate(-90 18 ${plot.top + plotHeight / 2})`}
                  >
                    {isEnglish ? 'Battery Voltage [V]' : 'Batteriespannung [V]'}
                  </text>
                </svg>
              </div>
              <p className="text-xs text-[#9eabc1]">{isEnglish ? 'Cooling fan speed chart unavailable: these sample records do not include fan-speed values.' : 'Lüfterdrehzahl-Diagramm nicht verfügbar: Diese Beispieldaten enthalten keine Lüfterdrehzahlwerte.'}</p>
            </div>
          )}
          {tab === 'location' && (
            <div className="rounded-md border border-[#293550] bg-[#151f33] p-8 text-center">
              <MapPin className="mx-auto size-9 text-[#bd9cff]" aria-hidden="true" /><h3 className="mt-3 font-semibold">{isEnglish ? 'No valid location available' : 'Kein gültiger Standort verfügbar'}</h3><p className="mx-auto mt-2 max-w-md text-sm text-[#aeb9cc]">{isEnglish ? 'This usage record has no valid GPS coordinates. No substitute location is shown.' : 'Für diesen Nutzungsdatensatz sind keine gültigen GPS-Koordinaten hinterlegt. Es wird kein Ersatzstandort angezeigt.'}</p>
              <dl className="mx-auto mt-6 grid max-w-lg grid-cols-2 gap-3 text-left text-sm">{[[isEnglish ? 'GPS timestamp' : 'GPS-Zeitstempel', usageRecord.gpsTimestamp], [isEnglish ? 'GPS quality' : 'GPS-Qualität', usageRecord.gpsQuality], [isEnglish ? 'Satellites' : 'Satelliten', usageRecord.gpsSatellites], [isEnglish ? 'Latitude' : 'Breitengrad', usageRecord.latitude], [isEnglish ? 'Longitude' : 'Längengrad', usageRecord.longitude]].map(([label, value]) => <div key={label as string} className="rounded border border-[#293550] p-3"><dt className="text-xs text-[#9eabc1]">{label}</dt><dd className="mt-1">{usageRecordDisplayValue(value as string | number | null, isEnglish ? 'Not provided' : 'Keine Angabe')}</dd></div>)}</dl>
            </div>
          )}
          {tab === 'notes' && (
            <div className="grid gap-5 lg:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">{isEnglish ? 'Note' : 'Notiz'}<textarea value={usageRecord.note} onChange={(event) => onPatch({ note: event.target.value })} rows={5} className={`${controlClass} block h-auto w-full py-3`} placeholder={isEnglish ? 'Not provided' : 'Keine Angabe'} /></label>
              <label className="space-y-2 text-sm font-medium">{isEnglish ? 'Feedback' : 'Feedback'}<textarea value={usageRecord.feedback ?? ''} onChange={(event) => onPatch({ feedback: event.target.value || null })} rows={5} className={`${controlClass} block h-auto w-full py-3`} placeholder={isEnglish ? 'Not provided' : 'Keine Angabe'} /></label>
              <div className="rounded-md border border-[#293550] bg-[#151f33] p-4 lg:col-span-2"><p className="font-medium">{isEnglish ? 'Deployment link' : 'Bereitstellungsverknüpfung'}</p><p className="mt-1 text-sm text-[#aeb9cc]">{usageRecord.linked ? `${usageRecord.deployment} · ${usageRecord.lineItem}` : isEnglish ? 'This usage record is not linked to a deployment or line item.' : 'Dieser Nutzungsdatensatz ist keiner Bereitstellung oder keiner Geräteposition zugeordnet.'}</p><button type="button" onClick={() => onPatch({ linked: !usageRecord.linked, deployment: usageRecord.linked ? null : 'Infusionspumpen-Rollout Station 4B', lineItem: usageRecord.linked ? null : 'Position 01' })} className="mt-3 rounded-md border border-[#6b56a5] px-3 py-2 text-sm text-[#d3b8ff] hover:bg-[#372c52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#aa7af6]">{usageRecord.linked ? (isEnglish ? 'Remove link' : 'Verknüpfung entfernen') : (isEnglish ? 'Link sample deployment' : 'Mit Beispielbereitstellung verknüpfen')}</button></div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Pagination({
  page,
  pageCount,
  total,
  pageSize: size,
  onPage,
  label,
  language,
}: {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPage: (page: number) => void
  label: string
  language: Language
}) {
  const from = total === 0 ? 0 : page * size + 1
  const to = Math.min((page + 1) * size, total)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#aeb9cc]">
      <span>{language === 'en' ? `${label}: ${from}–${to} of ${total}` : `${label}: ${from}–${to} von ${total}`}</span>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={language === 'en' ? 'Previous page' : 'Vorherige Seite'} disabled={page === 0} onClick={() => onPage(page - 1)} className="rounded border border-[#35415a] p-2 hover:bg-[#293550] disabled:opacity-40"><ChevronLeft className="size-4" aria-hidden="true" /></button>
        <span>{language === 'en' ? `Page ${page + 1} of ${pageCount}` : `Seite ${page + 1} von ${pageCount}`}</span>
        <button type="button" aria-label={language === 'en' ? 'Next page' : 'Nächste Seite'} disabled={page + 1 >= pageCount} onClick={() => onPage(page + 1)} className="rounded border border-[#35415a] p-2 hover:bg-[#293550] disabled:opacity-40"><ChevronRight className="size-4" aria-hidden="true" /></button>
      </div>
    </div>
  )
}

export function UsageRecordsOverview() {
  const { language } = useLanguage()
  const isEnglish = language === 'en'
  const { deployments } = useDeployments()
  const [usageRecords, setUsageRecords] = useState(sampleUsageRecords)
  const [view, setView] = useState<'unlinked' | 'all'>('unlinked')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deploymentFilter, setDeploymentFilter] = useState('')
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('')
  const [serialFilter, setSerialFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [groupPageSize, setGroupPageSize] = useState(pageSize)
  const [usageRecordPage, setUsageRecordPage] = useState<Record<string, number>>({})
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [detailsId, setDetailsId] = useState<number | null>(null)
  const [toast, setToast] = useState('')
  const [exporting, setExporting] = useState(false)

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(language)
    return usageRecords.filter((usageRecord) => {
      if (view === 'unlinked' && (usageRecord.linked || usageRecord.disabled)) return false
      if (dateFrom && usageRecord.date < toIsoDate(dateFrom)) return false
      if (dateTo && usageRecord.date > toIsoDate(dateTo)) return false
      if (deploymentFilter && usageRecord.deployment !== deploymentFilter) return false
      if (deviceTypeFilter && usageRecord.deviceType !== deviceTypeFilter) return false
      if (serialFilter && !usageRecord.serial.toLocaleLowerCase(language).includes(serialFilter.toLocaleLowerCase(language))) return false
      if (!query) return true
      return [usageRecord.id, usageRecord.deployment, usageRecord.deviceType, usageRecord.serial, usageRecord.note, usageRecord.date, usageRecord.timestamp]
        .some((value) => String(value ?? '').toLocaleLowerCase(language).includes(query))
    })
  }, [usageRecords, dateFrom, dateTo, language, deploymentFilter, deviceTypeFilter, search, serialFilter, view])
  const groups = useMemo(() => {
    const byDate = new Map<string, UsageRecord[]>()
    filtered.forEach((usageRecord) => byDate.set(usageRecord.date, [...(byDate.get(usageRecord.date) ?? []), usageRecord]))
    return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])
  const pageCount = Math.max(1, Math.ceil(groups.length / groupPageSize))
  const visibleGroups = groups.slice(page * groupPageSize, (page + 1) * groupPageSize)
  const hasFilters = Boolean(search || dateFrom || dateTo || deploymentFilter || deviceTypeFilter || serialFilter)
  const detailsUsageRecord = detailsId === null ? null : usageRecords.find((usageRecord) => usageRecord.id === detailsId) ?? null
  const totalSelection = selected.filter((id) => filtered.some((usageRecord) => usageRecord.id === id)).length

  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 3500)
  }

  function resetFilters() {
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setDeploymentFilter('')
    setDeviceTypeFilter('')
    setSerialFilter('')
    setPage(0)
  }

  function patchUsageRecord(id: number, patch: Partial<UsageRecord>) {
    setUsageRecords((current) => current.map((usageRecord) => usageRecord.id === id ? { ...usageRecord, ...patch } : usageRecord))
  }

  function download(items: UsageRecord[]) {
    if (!items.length || exporting) return
    const method = isEnglish
      ? items.length === 1
        ? `An Excel workbook for usage record ${items[0].id} will be downloaded.`
        : `${items.length} usage records will be exported as separate worksheets in an Excel workbook.`
      : items.length === 1
        ? `Eine Excel-Arbeitsmappe für Nutzungsdatensatz ${items[0].id} wird heruntergeladen.`
        : `${items.length} Nutzungsdatensätze werden als separate Tabellenblätter in einer Excel-Arbeitsmappe exportiert.`
    if (!window.confirm(`${method}\n\n${isEnglish ? 'Continue?' : 'Fortfahren?'}`)) return
    setExporting(true)
    try {
      exportExcel(items, language)
      notify(isEnglish
        ? `${items.length} ${items.length === 1 ? 'usage record' : 'usageRecords'} exported successfully.`
        : `${items.length === 1 ? 'Nutzungsdatensatz' : `${items.length} Nutzungsdatensätze`} erfolgreich exportiert.`)
    } catch (error) {
      console.error(isEnglish ? 'Usage record export failed.' : 'Der Nutzungsdatensatz-Export ist fehlgeschlagen.', error)
      notify(isEnglish ? 'Export failed. Please try again.' : 'Export fehlgeschlagen. Bitte versuchen Sie es erneut.')
    } finally {
      setExporting(false)
    }
  }

  function disableUsageRecord(usageRecord: UsageRecord) {
    const prompt = isEnglish
      ? usageRecord.linked
        ? `Really remove the link from usage record ${usageRecord.id}?`
        : `Really deactivate usage record ${usageRecord.id}?`
      : usageRecord.linked
        ? `Verknüpfung von Nutzungsdatensatz ${usageRecord.id} wirklich entfernen?`
        : `Nutzungsdatensatz ${usageRecord.id} wirklich deaktivieren?`
    if (!window.confirm(prompt)) return
    patchUsageRecord(usageRecord.id, usageRecord.linked ? { linked: false, deployment: null, lineItem: null } : { disabled: true })
    notify(usageRecord.linked
      ? (isEnglish ? 'Link removed.' : 'Verknüpfung entfernt.')
      : (isEnglish ? 'Usage record deactivated.' : 'Nutzungsdatensatz deaktiviert.'))
  }

  function linkUsageRecord(usageRecord: UsageRecord) {
    const firstDeployment = deployments[0]?.name ?? 'Infusionspumpen-Rollout Station 4B'
    patchUsageRecord(usageRecord.id, { linked: true, disabled: false, deployment: firstDeployment, lineItem: 'Position 01' })
    notify(isEnglish
      ? `Usage record ${usageRecord.id} was linked to "${firstDeployment}".`
      : `Nutzungsdatensatz ${usageRecord.id} wurde mit „${firstDeployment}“ verknüpft.`)
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDirection('asc') }
  }

  function sortedRecords(records: UsageRecord[]) {
    return [...records].sort((a, b) => {
      const aValue = a[sortKey] ?? ''
      const bValue = b[sortKey] ?? ''
      const result = typeof aValue === 'number' && typeof bValue === 'number'
        ? aValue - bValue
        : String(aValue).localeCompare(String(bValue), 'de', { numeric: true })
      return sortDirection === 'asc' ? result : -result
    })
  }

  function usageRecordRow(usageRecord: UsageRecord) {
    return (
      <tr key={usageRecord.id} className="border-t border-[#293550] hover:bg-[#ffffff0a]">
        <td className={tableCellClass}><input type="checkbox" aria-label={isEnglish ? `Select usage record ${usageRecord.id}` : `Nutzungsdatensatz ${usageRecord.id} auswählen`} checked={selected.includes(usageRecord.id)} onChange={() => setSelected((current) => current.includes(usageRecord.id) ? current.filter((id) => id !== usageRecord.id) : [...current, usageRecord.id])} className="size-4 accent-[#ae82f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a8ff]" /></td>
        <td className={tableCellClass}><button type="button" onClick={() => setDetailsId(usageRecord.id)} className="font-semibold text-[#d3b8ff] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#aa7af6]">#{usageRecord.id}</button></td>
        <td className={tableCellClass}><ShortValue value={usageRecord.deployment} fallback={isEnglish ? '[Empty]' : '[Leer]'} /></td>
        <td className={tableCellClass}><ShortValue value={usageRecord.deviceType} fallback={isEnglish ? 'Not provided' : 'Keine Angabe'} /></td>
        <td className={tableCellClass}><ShortValue value={usageRecord.lineItem} fallback={isEnglish ? '[Empty]' : '[Leer]'} /></td>
        <td className={tableCellClass}><span className="whitespace-nowrap" title={`${usageRecord.timestamp} UTC`}>{usageRecord.timestamp}</span></td>
        <td className={tableCellClass}>{usageRecord.batteryVoltage}</td>
        <td className={tableCellClass}>{usageRecord.powerDraw.toLocaleString(language === 'en' ? 'en' : 'de-DE')}</td>
        <td className={tableCellClass}><ShortValue value={usageRecord.serial} fallback={isEnglish ? 'Not provided' : 'Keine Angabe'} /></td>
        <td className={tableCellClass}><ShortValue value={usageRecord.note} fallback={isEnglish ? 'Not provided' : 'Keine Angabe'} /></td>
        <td className={tableCellClass}><ShortValue value={usageRecord.feedback} fallback={isEnglish ? 'Not provided' : 'Keine Angabe'} /></td>
        <td className={tableCellClass}><UsageRecordActions usageRecord={usageRecord} language={language} onDetails={() => setDetailsId(usageRecord.id)} onLink={() => linkUsageRecord(usageRecord)} onExport={() => download([usageRecord])} onDisable={() => disableUsageRecord(usageRecord)} /></td>
      </tr>
    )
  }

  return (
    <div className="usage-records-theme -mx-4 -my-7 min-h-[calc(100vh-72px)] bg-[#0e1625] px-4 py-7 text-[#e7ebf3] sm:-mx-7 sm:-my-9 sm:px-7 sm:py-9 lg:-mx-10 lg:-my-10 lg:px-10 lg:py-10">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#bd9cff]">{isEnglish ? 'CAREOPS · TECHNICAL DATA' : 'CAREOPS · TECHNISCHE DATEN'}</p>
            <h1 className="text-3xl font-semibold tracking-tight">{isEnglish ? 'Usage records' : 'Nutzungsdatensätze'}</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#aeb9cc]">{isEnglish ? 'View, assign, analyze, and export recorded installation data.' : 'Aufgezeichnete Installationsdaten anzeigen, zuordnen, analysieren und exportieren.'}</p>
          </div>
        </header>

        <section aria-label={isEnglish ? 'Search and filter usage records' : 'Nutzungsdatensätze suchen und filtern'} className={`${panelClass} p-3 sm:p-4`}>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div role="group" aria-label={isEnglish ? 'Usage record scope' : 'Umfang der Nutzungsdatensätze'} className="grid grid-cols-2 rounded-md border border-[#35415a] bg-[#101827] p-1 sm:inline-flex sm:w-fit">
              <button type="button" aria-pressed={view === 'unlinked'} onClick={() => { setView('unlinked'); setPage(0) }} className={`rounded px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#aa7af6] ${view === 'unlinked' ? 'bg-[#754caa] text-white shadow' : 'text-[#b8c2d5] hover:text-white'}`}>{isEnglish ? 'Unlinked usage records' : 'Unverknüpfte Nutzungsdatensätze'}</button>
              <button type="button" aria-pressed={view === 'all'} onClick={() => { setView('all'); setPage(0) }} className={`rounded px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#aa7af6] ${view === 'all' ? 'bg-[#754caa] text-white shadow' : 'text-[#b8c2d5] hover:text-white'}`}>{isEnglish ? 'All usage records' : 'Alle Nutzungsdatensätze'}</button>
            </div>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row xl:max-w-3xl">
              <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8893a8]" aria-hidden="true" /><Input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0) }} placeholder={isEnglish ? 'Search usage records…' : 'Nutzungsdatensätze durchsuchen …'} aria-label={isEnglish ? 'Search usage records' : 'Nutzungsdatensätze durchsuchen'} className={`${controlClass} w-full pl-9`} /></div>
              <button type="button" aria-expanded={showFilters} onClick={() => setShowFilters((show) => !show)} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#35415a] bg-[#111a2b] px-3 text-sm text-[#e7ebf3] hover:bg-[#293550] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#aa7af6]"><Filter className="size-4" aria-hidden="true" />{isEnglish ? 'Filter' : 'Filter'}</button>
              <Button type="button" disabled={totalSelection === 0 || exporting} onClick={() => download(filtered.filter((usageRecord) => selected.includes(usageRecord.id)))} className="h-10 bg-[#754caa] text-white hover:bg-[#8960bf]"><Download aria-hidden="true" />{exporting ? (isEnglish ? 'Exporting…' : 'Export läuft …') : `${isEnglish ? 'Export' : 'Exportieren'}${totalSelection ? ` (${totalSelection})` : ''}`}</Button>
              {hasFilters && <Button type="button" variant="ghost" onClick={resetFilters} className="h-10 text-[#d3b8ff] hover:bg-[#293550] hover:text-white"><FilterX aria-hidden="true" />{isEnglish ? 'Clear filters' : 'Filter zurücksetzen'}</Button>}
            </div>
          </div>
          {showFilters && <div className="mt-3 grid gap-2 border-t border-[#293550] pt-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex items-center gap-2"><CalendarDays className="size-4 shrink-0 text-[#bd9cff]" aria-hidden="true" /><span className="sr-only">{isEnglish ? 'From date' : 'Datum von'}</span><input type="text" inputMode="numeric" placeholder={isEnglish ? 'From DD.MM.YYYY' : 'Von TT.MM.JJJJ'} value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(0) }} aria-label={isEnglish ? 'From date (DD.MM.YYYY)' : 'Datum von (TT.MM.JJJJ)'} className={`${controlClass} min-w-0 flex-1`} /></label>
            <label className="flex items-center gap-2"><CalendarDays className="size-4 shrink-0 text-[#bd9cff]" aria-hidden="true" /><span className="sr-only">{isEnglish ? 'To date' : 'Datum bis'}</span><input type="text" inputMode="numeric" placeholder={isEnglish ? 'To DD.MM.YYYY' : 'Bis TT.MM.JJJJ'} value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(0) }} aria-label={isEnglish ? 'To date (DD.MM.YYYY)' : 'Datum bis (TT.MM.JJJJ)'} className={`${controlClass} min-w-0 flex-1`} /></label>
            <select aria-label={isEnglish ? 'Filter by deployment' : 'Bereitstellung filtern'} value={deploymentFilter} onChange={(event) => { setDeploymentFilter(event.target.value); setPage(0) }} className={controlClass}><option value="">{isEnglish ? 'All deployments' : 'Alle Bereitstellungen'}</option>{[...new Set(usageRecords.map((item) => item.deployment).filter((item): item is string => Boolean(item)))].sort().map((deployment) => <option key={deployment} value={deployment}>{deployment}</option>)}</select>
            <select aria-label={isEnglish ? 'Filter by device type' : 'Gerätetyp filtern'} value={deviceTypeFilter} onChange={(event) => { setDeviceTypeFilter(event.target.value); setPage(0) }} className={controlClass}><option value="">{isEnglish ? 'All device types' : 'Alle Gerätetypen'}</option>{[...new Set(usageRecords.map((item) => item.deviceType))].map((deviceType) => <option key={deviceType} value={deviceType}>{deviceType}</option>)}</select>
            <Input value={serialFilter} onChange={(event) => { setSerialFilter(event.target.value); setPage(0) }} placeholder={isEnglish ? 'Medical device / serial number' : 'Medizingerät / Seriennummer'} aria-label={isEnglish ? 'Filter by medical device or serial number' : 'Nach Medizingerät oder Seriennummer filtern'} className={controlClass} />
          </div>}
        </section>

        {toast && <div role="status" className="fixed bottom-5 right-5 z-[1200] flex max-w-sm items-center gap-2 rounded-md border border-[#53617c] bg-[#1a2941] px-4 py-3 text-sm text-white shadow-xl"><Check className="size-4 text-emerald-300" aria-hidden="true" />{toast}</div>}
        {filtered.length === 0 && <section className={`${panelClass} p-10 text-center`}><CircleHelp className="mx-auto size-8 text-[#bd9cff]" aria-hidden="true" /><h2 className="mt-3 font-semibold">{usageRecords.length === 0 ? (isEnglish ? 'No usage records available' : 'Keine Nutzungsdatensätze vorhanden') : view === 'unlinked' && !hasFilters ? (isEnglish ? 'No unlinked usage records' : 'Keine unverknüpften Nutzungsdatensätze') : (isEnglish ? 'No results' : 'Keine Treffer')}</h2><p className="mt-1 text-sm text-[#aeb9cc]">{hasFilters ? (isEnglish ? 'Adjust your search or filters.' : 'Passen Sie die Suche oder Filter an.') : (isEnglish ? 'There are currently no usage records available in this view.' : 'In dieser Ansicht sind derzeit keine Nutzungsdatensätze verfügbar.')}</p>{hasFilters && <button type="button" onClick={resetFilters} className="mt-4 text-sm text-[#d3b8ff] underline underline-offset-4">{isEnglish ? 'Clear filters' : 'Filter zurücksetzen'}</button>}</section>}

        {filtered.length > 0 && <section aria-label={isEnglish ? 'Usage records grouped by date' : 'Nach Datum gruppierte Nutzungsdatensätze'} className={`${panelClass} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#293550] px-4 py-4 sm:px-5">
            <div><h2 className="font-semibold">{isEnglish ? 'Installation data' : 'Installationsdaten'}</h2><p className="mt-1 text-xs text-[#9eabc1]">{isEnglish ? `${filtered.length} usage records in ${groups.length} date groups` : `${filtered.length} Nutzungsdatensätze in ${groups.length} Datumsgruppen`}</p></div>
            <label className="flex items-center gap-2 text-xs text-[#aeb9cc]">{isEnglish ? 'Rows per page' : 'Zeilen pro Seite'}<select value={groupPageSize} onChange={(event) => { setGroupPageSize(Number(event.target.value)); setPage(0) }} className="rounded border border-[#35415a] bg-[#111a2b] px-2 py-1.5 text-[#e7ebf3]"><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></label>
          </div>
          <div className="divide-y divide-[#293550]">
            {visibleGroups.map(([date, rows], groupIndex) => {
              const isOpen = expanded === date
              const sorted = sortedRecords(rows)
              const currentPage = usageRecordPage[date] ?? 0
              const paginated = sorted.slice(currentPage * detailPageSize, (currentPage + 1) * detailPageSize)
              const selectedInGroup = rows.filter((row) => selected.includes(row.id)).length
              return <article key={date}>
                <button type="button" aria-expanded={isOpen} onClick={() => setExpanded(isOpen ? null : date)} className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-[#ffffff08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#aa7af6] sm:px-5">
                  <ChevronDown className={`size-4 shrink-0 text-[#bd9cff] transition-transform ${isOpen ? '' : '-rotate-90'}`} aria-hidden="true" />
                  <span className="w-8 shrink-0 text-xs text-[#9eabc1]">{page * groupPageSize + groupIndex + 1}.</span>
                  <span className="flex-1 font-medium">{formatDate(date, language)} <span className="ml-1 text-xs font-normal text-[#9eabc1]">({date})</span></span>
                  <span className="text-sm text-[#b8c2d5]">{rows.length} {isEnglish ? (rows.length === 1 ? 'usage record' : 'usageRecords') : (rows.length === 1 ? 'Nutzungsdatensatz' : 'Nutzungsdatensätze')}</span>
                </button>
                {isOpen && <div className="border-t border-[#293550] bg-[#101827]">
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => setShowFilters(true)} className="inline-flex h-8 items-center gap-2 rounded-md border border-[#35415a] bg-[#151f33] px-2.5 text-xs text-[#e7ebf3] hover:bg-[#293550] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#aa7af6]"><SlidersHorizontal className="size-4" aria-hidden="true" />{isEnglish ? 'Filter' : 'Filter'}</button><Button type="button" disabled={!selectedInGroup || exporting} onClick={() => download(rows.filter((row) => selected.includes(row.id)))} className="h-8 bg-[#754caa] text-xs text-white hover:bg-[#8960bf]"><Download aria-hidden="true" />{isEnglish ? 'Export' : 'Export'}{selectedInGroup ? ` (${selectedInGroup})` : ''}</Button>{selectedInGroup > 0 && <span className="text-xs text-[#bd9cff]">{isEnglish ? `${selectedInGroup} selected` : `${selectedInGroup} ausgewählt`}</span>}</div>
                    <button type="button" disabled={!rows.length} onClick={() => setSelected((current) => rows.every((row) => current.includes(row.id)) ? current.filter((id) => !rows.some((row) => row.id === id)) : [...new Set([...current, ...rows.map((row) => row.id)])])} className="text-xs text-[#d3b8ff] hover:underline disabled:opacity-50">{rows.every((row) => selected.includes(row.id)) ? (isEnglish ? 'Clear selection' : 'Auswahl aufheben') : (isEnglish ? 'Select all in group' : 'Alle in Gruppe auswählen')}</button>
                  </div>
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full min-w-[1450px] border-collapse">
                      <thead className="sticky top-0 z-10 bg-[#1b2740] text-xs uppercase tracking-wide"><tr>
                        <th className={tableCellClass}><input type="checkbox" aria-label={isEnglish ? 'Select all usage records on this page' : 'Alle Nutzungsdatensätze dieser Seite auswählen'} checked={paginated.length > 0 && paginated.every((row) => selected.includes(row.id))} onChange={() => setSelected((current) => paginated.every((row) => current.includes(row.id)) ? current.filter((id) => !paginated.some((row) => row.id === id)) : [...new Set([...current, ...paginated.map((row) => row.id)])])} className="size-4 accent-[#ae82f7]" /></th>
                        <th className={tableCellClass}><SortButton label="#" sortKey="id" current={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                        <th className={tableCellClass}><SortButton label={isEnglish ? 'Deployment' : 'Bereitstellung'} sortKey="deployment" current={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                        <th className={tableCellClass}><SortButton label={isEnglish ? 'Device type' : 'Gerätetyp'} sortKey="deviceType" current={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                        <th className={tableCellClass}>{isEnglish ? 'Line item' : 'Geräteposition'}</th>
                        <th className={tableCellClass}><SortButton label={isEnglish ? 'Date (UTC)' : 'Datum (UTC)'} sortKey="timestamp" current={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                        <th className={tableCellClass}><SortButton label={isEnglish ? 'Battery voltage' : 'Batteriespannung'} sortKey="batteryVoltage" current={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                        <th className={tableCellClass}><SortButton label={isEnglish ? 'Max. power draw' : 'Max. Leistungsaufnahme'} sortKey="powerDraw" current={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                        <th className={tableCellClass}><SortButton label={isEnglish ? 'Serial number' : 'Seriennummer'} sortKey="serial" current={sortKey} direction={sortDirection} onSort={toggleSort} /></th>
                        <th className={tableCellClass}>{isEnglish ? 'Notes' : 'Notizen'}</th><th className={tableCellClass}>Feedback</th><th className={tableCellClass}>{isEnglish ? 'Actions' : 'Aktionen'}</th>
                      </tr></thead>
                      <tbody>{paginated.map(usageRecordRow)}</tbody>
                    </table>
                  </div>
                  <div className="grid gap-2 p-3 lg:hidden">{paginated.map((usageRecord) => <div key={usageRecord.id} className="rounded-md border border-[#293550] bg-[#151f33] p-3">
                    <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-2"><input type="checkbox" aria-label={isEnglish ? `Select usage record ${usageRecord.id}` : `Nutzungsdatensatz ${usageRecord.id} auswählen`} checked={selected.includes(usageRecord.id)} onChange={() => setSelected((current) => current.includes(usageRecord.id) ? current.filter((id) => id !== usageRecord.id) : [...current, usageRecord.id])} className="mt-1 size-4 accent-[#ae82f7]" /><div className="min-w-0"><button type="button" onClick={() => setDetailsId(usageRecord.id)} className="font-semibold text-[#d3b8ff]">{isEnglish ? 'Usage record' : 'Nutzungsdatensatz'} #{usageRecord.id}</button><p className="mt-1 text-xs text-[#aeb9cc]">{usageRecord.timestamp} UTC</p></div></div><UsageRecordActions usageRecord={usageRecord} language={language} onDetails={() => setDetailsId(usageRecord.id)} onLink={() => linkUsageRecord(usageRecord)} onExport={() => download([usageRecord])} onDisable={() => disableUsageRecord(usageRecord)} /></div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs"><div><dt className="text-[#8f9bb1]">{isEnglish ? 'Deployment' : 'Bereitstellung'}</dt><dd className="mt-0.5 truncate" title={usageRecord.deployment ?? (isEnglish ? '[Empty]' : '[Leer]')}>{usageRecord.deployment ?? (isEnglish ? '[Empty]' : '[Leer]')}</dd></div><div><dt className="text-[#8f9bb1]">{isEnglish ? 'Device type' : 'Gerätetyp'}</dt><dd className="mt-0.5 truncate" title={usageRecord.deviceType}>{usageRecord.deviceType}</dd></div><div><dt className="text-[#8f9bb1]">{isEnglish ? 'Battery voltage' : 'Batteriespannung'}</dt><dd className="mt-0.5">{usageRecord.batteryVoltage}</dd></div><div><dt className="text-[#8f9bb1]">{isEnglish ? 'Max. power draw' : 'Max. Leistungsaufnahme'}</dt><dd className="mt-0.5">{usageRecord.powerDraw.toLocaleString(language === 'en' ? 'en' : 'de-DE')} W</dd></div><div className="col-span-2"><dt className="text-[#8f9bb1]">{isEnglish ? 'Serial number' : 'Seriennummer'}</dt><dd className="mt-0.5 truncate" title={usageRecord.serial}>{usageRecord.serial}</dd></div></dl>
                  </div>)}</div>
                  <div className="border-t border-[#293550] px-4 py-3 sm:px-5"><Pagination page={currentPage} pageCount={Math.max(1, Math.ceil(rows.length / detailPageSize))} total={rows.length} pageSize={detailPageSize} onPage={(nextPage) => setUsageRecordPage((current) => ({ ...current, [date]: nextPage }))} label={isEnglish ? 'Usage records' : 'Nutzungsdatensätze'} language={language} /></div>
                </div>}
              </article>
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#293550] px-4 py-4 sm:px-5">
            <span className="text-xs text-[#aeb9cc]">{isEnglish ? `${groups.length ? page * groupPageSize + 1 : 0}–${Math.min((page + 1) * groupPageSize, groups.length)} of ${groups.length} date groups · ${filtered.length} usage records` : `${groups.length ? page * groupPageSize + 1 : 0}–${Math.min((page + 1) * groupPageSize, groups.length)} von ${groups.length} Datumsgruppen · ${filtered.length} Nutzungsdatensätze`}</span>
            <div className="flex items-center gap-2"><button type="button" aria-label={isEnglish ? 'Previous date groups' : 'Vorherige Datumsgruppen'} disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} className="rounded border border-[#35415a] p-2 hover:bg-[#293550] disabled:opacity-40"><ChevronLeft className="size-4" aria-hidden="true" /></button><span className="text-xs text-[#aeb9cc]">{isEnglish ? `Page ${page + 1} of ${pageCount}` : `Seite ${page + 1} von ${pageCount}`}</span><button type="button" aria-label={isEnglish ? 'Next date groups' : 'Nächste Datumsgruppen'} disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} className="rounded border border-[#35415a] p-2 hover:bg-[#293550] disabled:opacity-40"><ChevronRight className="size-4" aria-hidden="true" /></button></div>
          </div>
        </section>}
      </div>
      {detailsUsageRecord && <UsageRecordDetails usageRecord={detailsUsageRecord} language={language} onClose={() => setDetailsId(null)} onPatch={(patch) => patchUsageRecord(detailsUsageRecord.id, patch)} />}
    </div>
  )
}
