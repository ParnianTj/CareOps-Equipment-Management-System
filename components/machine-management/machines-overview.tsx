'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { CheckCircle2, Download, Filter, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLanguage } from '@/components/app-shell'

type Machine = {
  number: number
  name: string
  carrier: string
  screwConfiguration: string
  protocol: string
  sensors: string
  company: string
  outOfService: boolean
  active: boolean
}

const initialMachines: Machine[] = [
  { number: 16, name: '15000 MAX', carrier: 'Default', screwConfiguration: 'Default', protocol: 'KRINNER ...', sensors: 'Default', company: 'Krinner Foundation S...', outOfService: false, active: false },
  { number: 17, name: '15000 MAX', carrier: 'Default', screwConfiguration: 'Default', protocol: 'KRINNER ...', sensors: 'Default', company: 'Krinner Canada Inc.', outOfService: false, active: false },
  { number: 18, name: '25000 MAX', carrier: 'Default', screwConfiguration: 'Default', protocol: 'KRINNER ...', sensors: '', company: 'Krinner Schraubfund...', outOfService: false, active: false },
  { number: 22, name: 'KRD30-048', carrier: 'Default', screwConfiguration: 'Default', protocol: 'KRINNER ...', sensors: 'Default', company: 'Krinner Schraubfund...', outOfService: false, active: false },
  { number: 24, name: 'KRD30-046', carrier: 'Default', screwConfiguration: 'Default', protocol: 'N/A', sensors: 'Default', company: 'KRINNER Oceania', outOfService: false, active: false },
  { number: 29, name: 'KRD30-041', carrier: 'Default', screwConfiguration: 'Default', protocol: 'KRINNER ...', sensors: 'Default', company: 'Krinner Foundation S...', outOfService: false, active: false },
  { number: 33, name: 'KRD30-037', carrier: 'Default', screwConfiguration: 'Default', protocol: 'KRINNER ...', sensors: 'Default', company: 'Krinner Foundation S...', outOfService: false, active: false },
  { number: 37, name: 'KRD30-033', carrier: 'Default', screwConfiguration: 'Default', protocol: 'KRINNER ...', sensors: 'Default', company: 'Krinner Foundation S...', outOfService: false, active: false },
  { number: 39, name: 'KRD30-031', carrier: 'Default', screwConfiguration: 'Default', protocol: 'KRINNER ...', sensors: 'Default', company: 'Krinner SK s.r.o.', outOfService: false, active: false },
  { number: 40, name: 'KRD30-030', carrier: 'Default', screwConfiguration: 'Default', protocol: 'KRINNER ...', sensors: 'Default', company: 'Krinner Foundation S...', outOfService: false, active: false },
  { number: 58, name: 'KRD30-012', carrier: 'Default', screwConfiguration: 'Default', protocol: 'KRINNER ...', sensors: 'Default', company: 'Krinner Schraubfund...', outOfService: false, active: false },
  { number: 61, name: 'KRD30-009', carrier: 'Default', screwConfiguration: 'Default', protocol: 'KRINNER ...', sensors: 'Default', company: 'Krinner Schraubfund...', outOfService: false, active: false },
]

export function MachinesOverview() {
  const { language } = useLanguage()
  const [machines, setMachines] = useState(initialMachines)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState('')
  const isEnglish = language === 'en'
  const labels = isEnglish
    ? {
        filters: 'Filters',
        export: 'Export',
        createMachine: 'Create machine',
        search: 'Search machines and companies',
        carrier: 'Carrier',
        screwConfiguration: 'Screw configuration',
        protocol: 'Protocol',
        sensors: 'Sensors',
        company: 'Company name',
        outOfService: 'Out of service',
        status: 'Status',
        inService: 'In service',
        activate: 'Activate',
        deactivate: 'Deactivate',
        noMachinesFound: 'No machines found.',
        nameRequired: 'Name and company name are required.',
        createDescription: 'Enter the machine name and company.',
        cancel: 'Cancel',
        create: 'Create',
      }
    : {
        filters: 'Filter',
        export: 'Exportieren',
        createMachine: 'Maschine erstellen',
        search: 'Maschinen und Firmen suchen',
        carrier: 'Träger',
        screwConfiguration: 'Schraubenkonfiguration',
        protocol: 'Protokoll',
        sensors: 'Sensoren',
        company: 'Firmenname',
        outOfService: 'Außer Betrieb',
        status: 'Status',
        inService: 'Im Betrieb',
        activate: 'Aktivieren',
        deactivate: 'Deaktivieren',
        noMachinesFound: 'Keine Maschinen gefunden.',
        nameRequired: 'Name und Firmenname sind Pflichtfelder.',
        createDescription: 'Geben Sie den Maschinennamen und die Firma ein.',
        cancel: 'Abbrechen',
        create: 'Erstellen',
      }

  const visibleMachines = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase()
    if (!query) return machines
    return machines.filter((machine) =>
      [
        machine.name,
        machine.carrier === 'Default' && !isEnglish ? 'Standard' : machine.carrier,
        machine.screwConfiguration === 'Default' && !isEnglish ? 'Standard' : machine.screwConfiguration,
        machine.protocol,
        machine.sensors === 'Default' && !isEnglish ? 'Standard' : machine.sensors,
        machine.company,
      ]
        .some((value) => value.toLocaleLowerCase().includes(query)),
    )
  }, [filter, isEnglish, machines])

  function exportMachines() {
    const headers = [
      'Name',
      labels.carrier,
      labels.screwConfiguration,
      labels.protocol,
      labels.sensors,
      labels.company,
      labels.outOfService,
      labels.status,
    ]
    const rows = visibleMachines.map((machine) => [
      machine.name,
      machine.carrier === 'Default' && !isEnglish ? 'Standard' : machine.carrier,
      machine.screwConfiguration === 'Default' && !isEnglish ? 'Standard' : machine.screwConfiguration,
      machine.protocol,
      machine.sensors === 'Default' && !isEnglish ? 'Standard' : machine.sensors,
      machine.company,
      machine.outOfService ? labels.outOfService : labels.inService,
      machine.active ? (isEnglish ? 'Active' : 'Aktiv') : (isEnglish ? 'Inactive' : 'Inaktiv'),
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
      .join('\r\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = isEnglish ? 'machines.csv' : 'maschinen.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  function createMachine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedCompany = company.trim()
    if (!trimmedName || !trimmedCompany) {
      setError(labels.nameRequired)
      return
    }
    setMachines((current) => [...current, {
      number: Math.max(0, ...current.map((machine) => machine.number)) + 1,
      name: trimmedName,
      carrier: 'Default',
      screwConfiguration: 'Default',
      protocol: 'N/A',
      sensors: 'Default',
      company: trimmedCompany,
      outOfService: false,
      active: false,
    }])
    setName('')
    setCompany('')
    setError('')
    setCreateOpen(false)
  }

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
      <section className="overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-[0_2px_12px_rgba(23,42,50,0.025)]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <h2 className="text-lg font-semibold">{isEnglish ? 'Machines' : 'Maschinen'}</h2>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-5">
            <button
              type="button"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
            >
              <Filter className="size-4" aria-hidden="true" />
              {labels.filters}
            </button>
            <button
              type="button"
              onClick={exportMachines}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
            >
              <Download className="size-4" aria-hidden="true" />
              {labels.export}
            </button>
            <Button type="button" onClick={() => { setError(''); setCreateOpen(true) }} className="gap-2">
              <Plus className="size-4" aria-hidden="true" />
              {labels.createMachine}
            </Button>
          </div>
        </div>

        {filtersOpen && (
          <div className="border-t border-border px-5 py-3">
            <Input
              type="search"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder={labels.search}
              aria-label={labels.search}
              className="max-w-md"
            />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] table-fixed text-xs sm:text-sm">
            <colgroup>
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[9%]" />
              <col className="w-[20%]" />
              <col className="w-[14%]" />
              <col className="w-[15%]" />
            </colgroup>
            <thead>
              <tr className="border-y border-border bg-muted/60 text-left text-xs font-semibold text-foreground">
                <th className="px-3 py-3">Name</th>
                <th className="truncate px-3 py-3" title={labels.carrier}>{labels.carrier}</th>
                <th className="truncate px-3 py-3" title={labels.screwConfiguration}>{labels.screwConfiguration}</th>
                <th className="truncate px-3 py-3" title={labels.protocol}>{labels.protocol}</th>
                <th className="px-3 py-3">{labels.sensors}</th>
                <th className="px-3 py-3">{labels.company}</th>
                <th className="px-3 py-3">{labels.outOfService}</th>
                <th className="px-3 py-3">{labels.status}</th>
              </tr>
            </thead>
            <tbody>
              {visibleMachines.map((machine, index) => (
                <tr key={machine.number} className={`border-b border-border last:border-0 hover:bg-muted/50 ${index % 2 ? 'bg-muted/20' : ''}`}>
                  <td className="truncate px-3 py-4" title={machine.name}>{machine.name}</td>
                  <td className="truncate px-3 py-4" title={machine.carrier === 'Default' && !isEnglish ? 'Standard' : machine.carrier}>{machine.carrier === 'Default' && !isEnglish ? 'Standard' : machine.carrier}</td>
                  <td className="truncate px-3 py-4" title={machine.screwConfiguration === 'Default' && !isEnglish ? 'Standard' : machine.screwConfiguration}>{machine.screwConfiguration === 'Default' && !isEnglish ? 'Standard' : machine.screwConfiguration}</td>
                  <td className="truncate px-3 py-4" title={machine.protocol}>{machine.protocol}</td>
                  <td className="truncate px-3 py-4" title={machine.sensors === 'Default' && !isEnglish ? 'Standard' : machine.sensors}>{machine.sensors === 'Default' && !isEnglish ? 'Standard' : machine.sensors}</td>
                  <td className="truncate px-3 py-4" title={machine.company}>{machine.company}</td>
                  <td className="px-3 py-4">
                    <span
                      aria-label={machine.outOfService ? labels.outOfService : labels.inService}
                      title={machine.outOfService ? labels.outOfService : labels.inService}
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${machine.outOfService ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'}`}
                    >
                      <CheckCircle2 className="size-3.5" aria-hidden="true" />
                      {machine.outOfService ? labels.outOfService : labels.inService}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <button
                      type="button"
                      aria-label={`${machine.name} ${machine.active ? labels.deactivate : labels.activate}`}
                      onClick={() => setMachines((current) => current.map((item) =>
                        item.number === machine.number ? { ...item, active: !item.active } : item,
                      ))}
                      className="whitespace-nowrap text-sm text-muted-foreground hover:text-primary"
                    >
                      {machine.active ? labels.deactivate : labels.activate}
                    </button>
                  </td>
                </tr>
              ))}
              {visibleMachines.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">{labels.noMachinesFound}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent closeLabel={isEnglish ? 'Close' : 'Schließen'}>
          <form onSubmit={createMachine} className="grid gap-5">
            <DialogHeader>
              <DialogTitle>{labels.createMachine}</DialogTitle>
              <DialogDescription>{labels.createDescription}</DialogDescription>
            </DialogHeader>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Name*</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} required autoFocus />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">{isEnglish ? 'Company name*' : 'Firmenname*'}</span>
              <Input value={company} onChange={(event) => setCompany(event.target.value)} required />
            </label>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>{labels.cancel}</Button>
              <Button type="submit">{labels.create}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
