'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, CheckCircle2, Download, FileSpreadsheet, FileText, MapPin, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProjects } from '@/components/projects-provider'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { ProjectLocationMap } from '@/components/dashboard/project-location-map'
import { Panel } from '@/components/dashboard/panel'
import { formatDateTime, getOrgName, screwOptions, type Project, type ProjectPosition, type ProjectScrew, type Report } from '@/lib/dashboard-data'
import { sampleDatasets } from '@/lib/dataset-data'
import type { Language } from '@/components/app-shell'

type ProjectDetailsProps = {
  projectId?: string
  language?: Language
}

function createProjectRandom(seed: string) {
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

function ProjectMapCard({ project, language }: { project: Project; language: Language }) {
  const mapProject = useMemo(() => {
    if (typeof project.latitude === 'number' && typeof project.longitude === 'number') return project
    const random = createProjectRandom(`${project.id}-map`)
    return {
      ...project,
      latitude: 47 + random() * 7,
      longitude: 6 + random() * 9,
    }
  }, [project])

  return <ProjectLocationMap projects={[mapProject]} language={language} />
}

type ReportOptions = {
  showPileDepth: boolean
  showMaterials: boolean
  showPositionCircles: boolean
  showGraphs: boolean
  showIndividualGraphs: boolean
  showPivotTable: boolean
  showFeedback: boolean
  showArGraphs: boolean
}

const defaultReportOptions: ReportOptions = {
  showPileDepth: false,
  showMaterials: false,
  showPositionCircles: false,
  showGraphs: true,
  showIndividualGraphs: false,
  showPivotTable: false,
  showFeedback: false,
  showArGraphs: false,
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
  project,
  positions,
  screws,
  machine,
  language,
  onCreateReport,
  onClose,
}: {
  project: Project
  positions: ProjectPosition[]
  screws: ProjectScrew[]
  machine: { model: string; serial: string; operatingHours: number; inspection: string }
  language: Language
  onCreateReport: (reportName: string, documentHtml: string) => void
  onClose: () => void
}) {
  const isEnglish = language === 'en'
  const [reportName, setReportName] = useState(`${project.name} · ${isEnglish ? 'Report' : 'Bericht'}`)
  const [selectedPositionIds, setSelectedPositionIds] = useState(positions.map((position) => position.id))
  const [options, setOptions] = useState(defaultReportOptions)
  const [error, setError] = useState('')
  const selectedPositions = positions.filter((position) => selectedPositionIds.includes(position.id))
  const questions: { key: keyof ReportOptions; label: string }[] = [
    { key: 'showPileDepth', label: isEnglish ? 'Show pile length and depth in report?' : 'Pfahllänge und Pfahltiefe im Bericht anzeigen?' },
    { key: 'showMaterials', label: isEnglish ? 'Show materials list in report?' : 'Materialliste im Bericht anzeigen?' },
    { key: 'showPositionCircles', label: isEnglish ? 'Show position circles on map, including single positions?' : 'Positions-Kreis auch bei Einzelpositionen in der Karte anzeigen?' },
    { key: 'showGraphs', label: isEnglish ? 'Show graphs in report?' : 'Graphen im Bericht anzeigen?' },
    { key: 'showIndividualGraphs', label: isEnglish ? 'Add individual graphs to the report?' : 'Einzelgraphen zum Bericht hinzufügen?' },
    { key: 'showPivotTable', label: isEnglish ? 'Show a pivot table with installation date, screw type and quantity?' : 'Soll im Bericht eine Pivot-Tabelle mit Einbaudatum, Schraubentyp und Anzahl angezeigt werden?' },
    { key: 'showFeedback', label: isEnglish ? 'Add feedback to the report?' : 'Feedback zum Bericht hinzufügen?' },
    { key: 'showArGraphs', label: isEnglish ? 'Add AR graphs to the report? (RPM sensor required)' : 'AR-Graphen zum Bericht hinzufügen? (RPM-Sensor vorausgesetzt)' },
  ]

  function buildGraph(positionList: ProjectPosition[], title: string) {
    const colors = ['#315b8a', '#b54a5d', '#668b63', '#8a6a47', '#7851a9', '#27828b']
    const series = positionList
      .map((position, seriesIndex) => {
        const random = createProjectRandom(`${project.id}-${position.id}-graph`)
        const maxDepth = options.showPileDepth ? 180 : 120
        const maxTorque = 1200 + random() * 500
        const points = Array.from({ length: 32 }, (_, index) => {
          const progress = index / 31
          const torque = 45 + progress * 690 + Math.sin(progress * Math.PI * 6 + random()) * 12
          const depth = progress * maxDepth
          const x = 64 + (torque / 800) * 690
          const y = 24 + 205 - (depth / maxDepth) * 205
          return `${x.toFixed(1)},${y.toFixed(1)}`
        }).join(' ')
        return `<polyline points="${points}" fill="none" stroke="${colors[seriesIndex % colors.length]}" stroke-width="2.5"/><text x="650" y="${38 + seriesIndex * 18}" fill="${colors[seriesIndex % colors.length]}" font-size="11">${escapeHtml(position.label)}</text>`
      })
      .join('')
    return `<section class="report-section"><h2>${escapeHtml(title)}</h2><svg viewBox="0 0 800 280" role="img" aria-label="${escapeHtml(title)}"><rect width="800" height="280" fill="white"/>${[0, 50, 100, 150, 200].map((depth) => `<line x1="64" y1="${229 - depth}" x2="754" y2="${229 - depth}" stroke="#d8dee8"/><text x="54" y="${233 - depth}" text-anchor="end" font-size="11" fill="#333">${-depth}</text>`).join('')}${[0, 200, 400, 600, 800].map((torque) => `<line x1="${64 + torque / 800 * 690}" y1="24" x2="${64 + torque / 800 * 690}" y2="229" stroke="#e0e4ea"/><text x="${64 + torque / 800 * 690}" y="248" text-anchor="middle" font-size="11" fill="#333">${torque}</text>`).join('')}<rect x="64" y="24" width="690" height="205" fill="none" stroke="#555"/>${series}<text x="410" y="272" text-anchor="middle" font-size="12">Torque [Nm]</text><text x="16" y="126" text-anchor="middle" font-size="12" transform="rotate(-90 16 126)">Depth [cm]</text></svg></section>`
  }

  function createReport() {
    const normalizedReportName = reportName.trim()
    if (!normalizedReportName) {
      setError(isEnglish ? 'Enter a name for the report.' : 'Geben Sie einen Namen für den Bericht ein.')
      return
    }

    if (!selectedPositions.length) {
      setError(isEnglish ? 'Select at least one position for the report.' : 'Wählen Sie mindestens eine Position für den Bericht aus.')
      return
    }

    const reportWindow = window.open('', '_blank')
    if (!reportWindow) {
      setError(isEnglish ? 'The report window was blocked. Allow pop-ups and try again.' : 'Das Berichtsfenster wurde blockiert. Erlauben Sie Pop-ups und versuchen Sie es erneut.')
      return
    }

    const positionRows = selectedPositions
      .map((position, index) => {
        const random = createProjectRandom(`${project.id}-${position.id}-report`)
        const depth = 80 + Math.floor(random() * 170)
        const pileLength = depth + 60 + Math.floor(random() * 100)
        return `<tr><td>${index + 1}</td><td>${escapeHtml(position.label)}</td><td>${position.quantity}</td>${options.showPileDepth ? `<td>${pileLength} cm</td><td>${depth} cm</td>` : ''}</tr>`
      })
      .join('')
    const materials = options.showMaterials
      ? `<section class="report-section"><h2>${isEnglish ? 'Materials' : 'Materialliste'}</h2><table><thead><tr><th>${isEnglish ? 'Screw type' : 'Schraubentyp'}</th><th>${isEnglish ? 'Series' : 'Serie'}</th><th>${isEnglish ? 'Quantity' : 'Anzahl'}</th></tr></thead><tbody>${screws.map((screw, index) => `<tr><td>${escapeHtml(screw.name)}</td><td>${escapeHtml(screw.series)}</td><td>${selectedPositions.reduce((sum, position) => sum + position.quantity, 0) - index * 2}</td></tr>`).join('')}</tbody></table></section>`
      : ''
    const mapCircles = selectedPositions
      .map((position, index) => {
        const x = 95 + (index % 4) * 100
        const y = 65 + Math.floor(index / 4) * 85
        const circle = options.showPositionCircles ? `<circle cx="${x}" cy="${y}" r="18" fill="none" stroke="#315b8a" stroke-width="2"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10" fill="#17365d">${index + 1}</text>` : ''
        return `<g>${circle}<circle cx="${x}" cy="${y}" r="5" fill="#17365d"/></g>`
      })
      .join('')
    const positionMap = `<section class="report-section"><h2>${isEnglish ? 'Project location and positions' : 'Projektstandort und Positionen'}</h2><div class="map"><svg viewBox="0 0 500 210" role="img" aria-label="${escapeHtml(project.location)}">${Array.from({ length: 6 }, (_, index) => `<path d="M${index * 100} 0 L${index * 100 + 45} 210 M0 ${index * 42} L500 ${index * 42 + 20}" stroke="#d7e2de" fill="none"/>`).join('')}${mapCircles}</svg><p>${escapeHtml(project.location)}${project.country ? `, ${escapeHtml(project.country)}` : ''}</p></div></section>`
    const graph = options.showGraphs
      ? `${buildGraph(selectedPositions, isEnglish ? 'Installation graph' : 'Installationsgraph')}${options.showIndividualGraphs ? selectedPositions.map((position) => buildGraph([position], `${isEnglish ? 'Individual graph' : 'Einzelgraph'} · ${position.label}`)).join('') : ''}`
      : ''
    const pivotTable = options.showPivotTable
      ? `<section class="report-section"><h2>${isEnglish ? 'Installation overview' : 'Einbauübersicht'}</h2><table><thead><tr><th>${isEnglish ? 'Installation date' : 'Einbaudatum'}</th><th>${isEnglish ? 'Screw type' : 'Schraubentyp'}</th><th>${isEnglish ? 'Quantity' : 'Anzahl'}</th></tr></thead><tbody>${selectedPositions.map((position, index) => `<tr><td>${escapeHtml(project.startDate ?? project.createdAt.slice(0, 10))}</td><td>${escapeHtml(screws[index % screws.length].name)}</td><td>${position.quantity}</td></tr>`).join('')}</tbody></table></section>`
      : ''
    const feedback = options.showFeedback
      ? `<section class="report-section"><h2>${isEnglish ? 'Feedback' : 'Feedback'}</h2><p>${isEnglish ? 'Installation completed successfully. All selected positions were checked.' : 'Installation erfolgreich abgeschlossen. Alle ausgewählten Positionen wurden geprüft.'}</p></section>`
      : ''
    const arGraphs = options.showArGraphs
      ? `<section class="report-section"><h2>AR</h2><p>${isEnglish ? 'RPM sensor data is not available for this sample project.' : 'Für dieses Beispielprojekt sind keine RPM-Sensordaten verfügbar.'}</p></section>`
      : ''
    const title = `${isEnglish ? 'Project report' : 'Projektbericht'} · ${project.name}`

    const documentHtml = `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><title>${escapeHtml(normalizedReportName)}</title><style>
      *{box-sizing:border-box}body{font:14px/1.5 Arial,sans-serif;color:#182235;margin:0;padding:36px}h1{font-size:26px;margin:0 0 4px}h2{font-size:17px;margin:0 0 12px}p{margin:4px 0}.subtitle{color:#697386}.report-section{margin:26px 0;break-inside:avoid}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:9px 10px;border-bottom:1px solid #dfe4eb}th{background:#f0f2f5;font-size:12px;text-transform:uppercase}.details{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#dfe4eb;border:1px solid #dfe4eb;margin-top:18px}.details div{background:#fff;padding:10px}.details small{display:block;color:#697386}.map{border:1px solid #dfe4eb;border-radius:8px;padding:10px;background:#f4f7f5}.map svg{display:block;width:100%;height:190px}.report-section svg:not(.map svg){display:block;width:100%;height:auto}.foot{margin-top:32px;padding-top:10px;border-top:1px solid #dfe4eb;color:#697386;font-size:11px}@page{size:A4;margin:14mm}@media print{body{padding:0}.report-section{break-inside:avoid}h1,h2{break-after:avoid}table{break-inside:auto}tr{break-inside:avoid;break-after:auto}}
      </style></head><body><h1>${escapeHtml(normalizedReportName)}</h1><p class="subtitle">${escapeHtml(project.name)} · ${escapeHtml(isEnglish ? 'Project report' : 'Projektbericht')} · ${escapeHtml(new Date().toLocaleDateString(isEnglish ? 'en-GB' : 'de-DE'))}</p><div class="details"><div><small>${isEnglish ? 'Organization' : 'Organisation'}</small>${escapeHtml(getOrgName(project.orgId))}</div><div><small>${isEnglish ? 'Location' : 'Standort'}</small>${escapeHtml(project.location)}</div><div><small>${isEnglish ? 'Created by' : 'Erstellt von'}</small>${escapeHtml(project.createdBy)}</div><div><small>${isEnglish ? 'Created on' : 'Erstellt am'}</small>${escapeHtml(formatDateTime(project.createdAt))}</div><div><small>${isEnglish ? 'Machine' : 'Maschine'}</small>${escapeHtml(machine.model)} · ${escapeHtml(machine.serial)}</div><div><small>${isEnglish ? 'Screw types' : 'Schraubentypen'}</small>${screws.map((screw) => escapeHtml(screw.name)).join('<br>')}</div></div>${positionMap}<section class="report-section"><h2>${isEnglish ? 'Selected positions' : 'Ausgewählte Positionen'}</h2><table><thead><tr><th>#</th><th>${isEnglish ? 'Position' : 'Position'}</th><th>${isEnglish ? 'Quantity' : 'Anzahl'}</th>${options.showPileDepth ? `<th>${isEnglish ? 'Pile length' : 'Pfahllänge'}</th><th>${isEnglish ? 'Depth' : 'Tiefe'}</th>` : ''}</tr></thead><tbody>${positionRows}</tbody></table></section>${materials}${pivotTable}${graph}${options.showArGraphs ? arGraphs : ''}${feedback}<footer class="foot">${escapeHtml(normalizedReportName)} · ${escapeHtml(title)} · ${escapeHtml(machine.model)} · ${escapeHtml(machine.inspection)}</footer><script>window.addEventListener('afterprint',()=>window.close(),{once:true});window.addEventListener('load',()=>setTimeout(()=>window.print(),300),{once:true});</script></body></html>`
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
            <h2 id="report-dialog-title" className="mt-1 text-lg font-semibold">{project.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={isEnglish ? 'Close report settings' : 'Berichtseinstellungen schließen'} className="rounded-md p-2 text-muted-foreground hover:bg-muted">
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>
        <div className="space-y-6 p-5 sm:p-6">
          <label className="block space-y-2 text-sm font-semibold" htmlFor="project-report-name">
            {isEnglish ? 'Report name' : 'Berichtsname'}
            <input
              id="project-report-name"
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
            <button type="button" onClick={() => setOptions({ showPileDepth: false, showMaterials: false, showPositionCircles: false, showGraphs: false, showIndividualGraphs: false, showPivotTable: false, showFeedback: false, showArGraphs: false })} className="mt-3 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
              {isEnglish ? 'Deselect all' : 'Alle abwählen'}
            </button>
          </fieldset>
          <fieldset>
            <div className="mb-2 flex items-center justify-between gap-3">
              <legend className="text-sm font-semibold">{isEnglish ? 'Select positions to include' : 'Positionen für den Bericht auswählen'}</legend>
              <button type="button" onClick={() => setSelectedPositionIds(selectedPositionIds.length === positions.length ? [] : positions.map((position) => position.id))} className="text-xs font-medium text-primary hover:underline">
                {selectedPositionIds.length === positions.length ? (isEnglish ? 'Deselect all' : 'Alle abwählen') : (isEnglish ? 'Select all' : 'Alle auswählen')}
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {positions.map((position) => (
                <label key={position.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted/40">
                  <span className="flex min-w-0 items-center gap-2">
                    <input type="checkbox" checked={selectedPositionIds.includes(position.id)} onChange={() => setSelectedPositionIds((current) => current.includes(position.id) ? current.filter((id) => id !== position.id) : [...current, position.id])} className="size-4 shrink-0 accent-primary" />
                    <span className="truncate">{position.label}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{position.quantity} {isEnglish ? 'pcs' : 'Stk.'}</span>
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

export function ProjectDetails({ projectId, language = 'de' }: ProjectDetailsProps) {
  const { projects, reports, deletedReports, addReport, deleteReport, openEditProject, deleteProject, markProjectCompleted } = useProjects()
  const router = useRouter()
  const [reportOpen, setReportOpen] = useState(false)
  const isEnglish = language === 'en'
  const heading = isEnglish ? 'Project Details' : 'Projektdetails'

  if (!projectId) {
    return (
      <div className="mx-auto flex max-w-[1500px] flex-col gap-7">
        <div>
          <p className="mb-2 text-sm font-semibold text-primary">Z-part group · {heading}</p>
          <h1 className="text-[28px] font-semibold tracking-tight sm:text-[32px]">{heading}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isEnglish ? 'Choose a project to view its details.' : 'Wählen Sie ein Projekt aus, um die Details anzusehen.'}
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projekte/details/${encodeURIComponent(project.id)}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{project.name}</span>
                    <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" aria-hidden="true" />
                      {project.location} · {getOrgName(project.orgId)}
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

  const project = projects.find((item) => item.id === projectId)

  if (!project) {
    return (
      <div className="mx-auto max-w-[1500px]">
        <p className="text-sm text-muted-foreground">
          {isEnglish ? 'Project not found.' : 'Projekt wurde nicht gefunden.'}
        </p>
        <Link href="/projekte/details" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {isEnglish ? 'Back to projects' : 'Zurück zu den Projekten'}
        </Link>
      </div>
    )
  }

  const currentProject = project
  const positions = currentProject.positions?.length
    ? currentProject.positions
    : Array.from({ length: 4 }, (_, index) => ({
        id: `${currentProject.id}-position-${index + 1}`,
        label: `Position ${String(index + 1).padStart(2, '0')}`,
        quantity: 2 + Math.floor(createProjectRandom(`${currentProject.id}-quantity-${index}`)() * 8),
      }))
  const demoRandom = createProjectRandom(currentProject.id)
  const projectReports = reports.filter(
    (report) =>
      report.projectId === currentProject.id ||
      (!report.projectId && report.projectName === currentProject.name && report.orgId === currentProject.orgId),
  )
  const hasDeletedProjectReports = deletedReports.some((report) => report.projectId === currentProject.id)
  const shownReports: Report[] =
    projectReports.length > 0
      ? projectReports
      : hasDeletedProjectReports
        ? []
        : Array.from({ length: 2 + Math.floor(demoRandom() * 2) }, (_, index) => ({
          id: `${currentProject.id}-demo-report-${index + 1}`,
          projectId: currentProject.id,
          projectName: `${isEnglish ? 'Installation report' : 'Installationsbericht'} ${index + 1}`,
          orgId: currentProject.orgId,
          createdAt: currentProject.createdAt,
        }))
  const screws =
    currentProject.screwTypes?.length
      ? currentProject.screwTypes
      : Array.from({ length: 2 }, (_, index) => {
          const optionIndex = Math.floor(createProjectRandom(`${currentProject.id}-screw-${index}`)() * screwOptions.length)
          return screwOptions[optionIndex]
        })
  const machineRandom = createProjectRandom(`${currentProject.id}-machine`)
  const machineModels = ['KRINNER KSF M 140', 'KRINNER KSF F 140', 'KRINNER KSF G 89']
  const machine = {
    model: machineModels[Math.floor(machineRandom() * machineModels.length)],
    serial: `KR-${String(10000 + Math.floor(machineRandom() * 90000))}`,
    operatingHours: 120 + Math.floor(machineRandom() * 1800),
    inspection: new Date(Date.UTC(2026, Math.floor(machineRandom() * 12), 1 + Math.floor(machineRandom() * 27)))
      .toISOString()
      .slice(0, 10),
  }
  function downloadReport(report: Report) {
    const reportWindow = window.open('', '_blank')
    if (!reportWindow) {
      window.alert(isEnglish ? 'The report window was blocked. Allow pop-ups and try again.' : 'Das Berichtsfenster wurde blockiert. Erlauben Sie Pop-ups und versuchen Sie es erneut.')
      return
    }

    const title = report.reportName ?? report.projectName
    const documentHtml = report.documentHtml ?? `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font:14px/1.5 Arial,sans-serif;color:#182235;margin:0;padding:36px}h1{font-size:26px;margin:0 0 18px}.details{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#dfe4eb;border:1px solid #dfe4eb}.details div{background:#fff;padding:12px}.details small{display:block;color:#697386}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{text-align:left;padding:9px 10px;border-bottom:1px solid #dfe4eb}th{background:#f0f2f5}@page{size:A4;margin:14mm}@media print{body{padding:0}}</style></head><body><h1>${escapeHtml(title)}</h1><div class="details"><div><small>${isEnglish ? 'Project' : 'Projekt'}</small>${escapeHtml(currentProject.name)}</div><div><small>${isEnglish ? 'Organization' : 'Organisation'}</small>${escapeHtml(getOrgName(currentProject.orgId))}</div><div><small>${isEnglish ? 'Location' : 'Standort'}</small>${escapeHtml(currentProject.location)}</div><div><small>${isEnglish ? 'Created by' : 'Erstellt von'}</small>${escapeHtml(currentProject.createdBy)}</div><div><small>${isEnglish ? 'Machine' : 'Maschine'}</small>${escapeHtml(machine.model)} · ${escapeHtml(machine.serial)}</div><div><small>${isEnglish ? 'Created on' : 'Erstellt am'}</small>${escapeHtml(formatDateTime(report.createdAt))}</div></div><table><thead><tr><th>${isEnglish ? 'Position' : 'Position'}</th><th>${isEnglish ? 'Quantity' : 'Anzahl'}</th></tr></thead><tbody>${positions.map((position) => `<tr><td>${escapeHtml(position.label)}</td><td>${position.quantity}</td></tr>`).join('')}</tbody></table><script>window.addEventListener('afterprint',()=>window.close(),{once:true});window.addEventListener('load',()=>setTimeout(()=>window.print(),300),{once:true});</script></body></html>`
    reportWindow.document.open()
    reportWindow.document.write(documentHtml)
    reportWindow.document.close()
  }

  function removeReport(report: Report) {
    if (window.confirm(isEnglish ? `Delete "${report.reportName ?? report.projectName}"?` : `„${report.reportName ?? report.projectName}“ löschen?`)) {
      deleteReport({ ...report, projectId: report.projectId ?? currentProject.id })
    }
  }
  const matchingDatasets = sampleDatasets.filter((dataset) => dataset.project === currentProject.name)
  const shownDatasets =
    matchingDatasets.length > 0
      ? matchingDatasets.slice(0, 5)
      : Array.from({ length: 3 }, (_, index) => {
          const random = createProjectRandom(`${currentProject.id}-dataset-${index}`)
          return {
            id: 20000 + Math.floor(random() * 80000),
            timestamp: `${currentProject.createdAt.slice(0, 10)} ${String(8 + Math.floor(random() * 10)).padStart(2, '0')}:${String(Math.floor(random() * 60)).padStart(2, '0')}:00`,
            distance: 80 + Math.floor(random() * 180),
            torque: 500 + Math.floor(random() * 9500),
            screw: screws[index % screws.length].name,
          }
        })
  const fields = [
    [isEnglish ? 'Organization' : 'Organisation', getOrgName(currentProject.orgId)],
    [isEnglish ? 'Location' : 'Standort', currentProject.location],
    [isEnglish ? 'Created by' : 'Erstellt von', currentProject.createdBy],
    [isEnglish ? 'Created on' : 'Erstellt am', formatDateTime(currentProject.createdAt)],
    ...(currentProject.reference ? [[isEnglish ? 'Reference' : 'Referenz', currentProject.reference]] : []),
    ...(currentProject.street ? [[isEnglish ? 'Street' : 'Straße', currentProject.street]] : []),
    ...(currentProject.zip ? [[isEnglish ? 'Postal code' : 'Postleitzahl', currentProject.zip]] : []),
    ...(currentProject.country ? [[isEnglish ? 'Country' : 'Land', currentProject.country]] : []),
  ]

  function downloadFile(filename: string, content: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function exportProject() {
    const safeName = currentProject.name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    downloadFile(`${safeName}.json`, JSON.stringify(currentProject, null, 2), 'application/json;charset=utf-8')
  }

  function exportPositions() {
    const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
    const rows = [
      ['#', isEnglish ? 'Position' : 'Position', isEnglish ? 'Quantity' : 'Menge'],
      ...(currentProject.positions ?? []).map((position, index) => [
        String(index + 1),
        position.label,
        String(position.quantity),
      ]),
    ]
    const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(';')).join('\r\n')}`
    const safeName = currentProject.name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    downloadFile(`${safeName}-positions.csv`, csv, 'text/csv;charset=utf-8')
  }

  function confirmDelete() {
    const confirmed = window.confirm(
      isEnglish
        ? `Delete "${currentProject.name}"? This cannot be undone.`
        : `„${currentProject.name}“ wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.`,
    )
    if (!confirmed) return

    deleteProject(currentProject.id)
    router.push('/projekte/liste')
  }

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-7">
      <Link href="/projekte/details" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {isEnglish ? 'All project details' : 'Alle Projektdetails'}
      </Link>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-primary">Z-part group · {heading}</p>
            <h1 className="text-[28px] font-semibold tracking-tight text-balance sm:text-[32px]">{currentProject.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" aria-hidden="true" />
              {currentProject.location}
            </p>
          </div>
          <StatusBadge status={currentProject.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setReportOpen(true)}>
            <FileText className="size-4" aria-hidden="true" />
            {isEnglish ? 'Generate report' : 'Bericht erstellen'}
          </Button>
          <Button type="button" variant="outline" onClick={exportProject}>
            <Download className="size-4" aria-hidden="true" />
            {isEnglish ? 'Export project' : 'Projekt exportieren'}
          </Button>
          <Button type="button" variant="outline" onClick={exportPositions}>
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            {isEnglish ? 'Export positions' : 'Positionen exportieren'}
          </Button>
          <Button type="button" variant="outline" onClick={() => openEditProject(currentProject.id)}>
            <Pencil className="size-4" aria-hidden="true" />
            {isEnglish ? 'Edit' : 'Bearbeiten'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={currentProject.status === 'completed'}
            onClick={() => markProjectCompleted(currentProject.id)}
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            {currentProject.status === 'completed'
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
        title={isEnglish ? 'Datasets' : 'Datensätze'}
        description={isEnglish ? 'Measurement datasets for this project' : 'Messdatensätze für dieses Projekt'}
        action={
          <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
            {shownDatasets.length}
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3">{isEnglish ? 'Dataset' : 'Datensatz'}</th>
                <th scope="col" className="px-5 py-3">{isEnglish ? 'Date (UTC)' : 'Datum (UTC)'}</th>
                <th scope="col" className="px-5 py-3">{isEnglish ? 'Screw' : 'Schraube'}</th>
                <th scope="col" className="px-5 py-3 text-right">{isEnglish ? 'Distance' : 'Distanz'}</th>
                <th scope="col" className="px-5 py-3 text-right">{isEnglish ? 'Max. torque' : 'Max. Drehmoment'}</th>
              </tr>
            </thead>
            <tbody>
              {shownDatasets.map((dataset) => (
                <tr key={dataset.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">#{dataset.id}</td>
                  <td className="px-5 py-3 text-muted-foreground">{dataset.timestamp}</td>
                  <td className="max-w-[240px] truncate px-5 py-3" title={dataset.screw}>{dataset.screw}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{dataset.distance} cm</td>
                  <td className="px-5 py-3 text-right tabular-nums">{dataset.torque.toLocaleString(isEnglish ? 'en' : 'de-DE')} Nm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <header className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">
            {isEnglish ? 'Positions' : 'Positionen'} ({positions.length})
          </h2>
        </header>
        {positions.length ? (
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
                {positions.map((position, index) => (
                  <tr key={position.id} className="border-t border-border">
                    <td className="px-5 py-3 tabular-nums text-muted-foreground">{index + 1}</td>
                    <td className="break-words px-2 py-3 font-medium">{position.label}</td>
                    <td className="break-words px-2 py-3 text-right tabular-nums">{position.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-5 text-sm text-muted-foreground">
            {isEnglish ? 'No positions have been added.' : 'Es wurden noch keine Positionen hinzugefügt.'}
          </p>
        )}
      </section>
      <div className="grid items-stretch gap-5 md:grid-cols-2">
        <ProjectMapCard project={currentProject} language={language} />
        <Panel
          title={isEnglish ? 'Reports' : 'Berichte'}
          description={isEnglish ? 'Reports associated with this project' : 'Berichte zu diesem Projekt'}
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
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{report.reportName ?? report.projectName}</span>
                  <time className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatDateTime(report.createdAt)}</time>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={isEnglish ? `Download ${report.reportName ?? report.projectName} as PDF` : `${report.reportName ?? report.projectName} als PDF herunterladen`}
                      title={isEnglish ? 'Download as PDF' : 'Als PDF herunterladen'}
                      onClick={() => downloadReport(report)}
                    >
                      <Download className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={isEnglish ? `Delete ${report.reportName ?? report.projectName}` : `${report.reportName ?? report.projectName} löschen`}
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
                {isEnglish ? 'No reports for this project.' : 'Keine Berichte für dieses Projekt.'}
              </li>
            )}
          </ul>
        </Panel>

        <Panel
          title={isEnglish ? 'Screws used' : 'Verwendete Schrauben'}
          description={isEnglish ? 'Screw types used on this project' : 'Bei diesem Projekt verwendete Schraubentypen'}
          className="h-full"
        >
          <ul className="divide-y divide-border px-5 pb-2">
            {screws.map((screw) => (
              <li key={screw.id} className="flex items-center justify-between gap-3 py-3">
                <span className="truncate text-sm font-medium">{screw.name}</span>
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{screw.series}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title={isEnglish ? 'Machine' : 'Maschine'}
          description={isEnglish ? 'Equipment used for installation' : 'Für die Installation eingesetztes Gerät'}
          className="h-full"
        >
          <dl className="grid grid-cols-2 gap-4 px-5 pb-5">
            {[
              [isEnglish ? 'Model' : 'Modell', machine.model],
              [isEnglish ? 'Serial number' : 'Seriennummer', machine.serial],
              [isEnglish ? 'Operating hours' : 'Betriebsstunden', `${machine.operatingHours} h`],
              [isEnglish ? 'Last inspection' : 'Letzte Wartung', machine.inspection],
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
          project={currentProject}
          positions={positions}
          screws={screws}
          machine={machine}
          language={language}
          onCreateReport={(reportName, documentHtml) =>
            addReport({
              projectId: currentProject.id,
              projectName: currentProject.name,
              orgId: currentProject.orgId,
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
