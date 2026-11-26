'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
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

type MedicalDevice = {
  number: number
  name: string
  monitoring: string
  sensors: string
  company: string
  outOfService: boolean
  active: boolean
}

const initialMedicalDevices: MedicalDevice[] = [
  { number: 16, name: 'InfuMed 300', monitoring: 'CareOps ...', sensors: 'Default', company: 'Klinik Kleinfeld', outOfService: false, active: false },
  { number: 17, name: 'InfuMed 300', monitoring: 'CareOps ...', sensors: 'Default', company: 'Reha-Klinik Waldesruh', outOfService: false, active: false },
  { number: 18, name: 'VitaScan 500', monitoring: 'CareOps ...', sensors: '', company: 'Dialysezentrum Ostring', outOfService: false, active: false },
  { number: 22, name: 'CardioLink D30-048', monitoring: 'CareOps ...', sensors: 'Default', company: 'Dialysezentrum Ostring', outOfService: false, active: false },
  { number: 24, name: 'CardioLink D30-046', monitoring: 'N/A', sensors: 'Default', company: 'CareOps Klinik Zürich', outOfService: false, active: false },
  { number: 29, name: 'CardioLink D30-041', monitoring: 'CareOps ...', sensors: 'Default', company: 'Klinik Kleinfeld', outOfService: false, active: false },
  { number: 33, name: 'CardioLink D30-037', monitoring: 'CareOps ...', sensors: 'Default', company: 'Klinik Kleinfeld', outOfService: false, active: false },
  { number: 37, name: 'CardioLink D30-033', monitoring: 'CareOps ...', sensors: 'Default', company: 'Klinik Kleinfeld', outOfService: false, active: false },
  { number: 39, name: 'CardioLink D30-031', monitoring: 'CareOps ...', sensors: 'Default', company: 'Rehazentrum Lindau', outOfService: false, active: false },
  { number: 40, name: 'CardioLink D30-030', monitoring: 'CareOps ...', sensors: 'Default', company: 'Klinik Kleinfeld', outOfService: false, active: false },
  { number: 58, name: 'CardioLink D30-012', monitoring: 'CareOps ...', sensors: 'Default', company: 'Dialysezentrum Ostring', outOfService: false, active: false },
  { number: 61, name: 'CardioLink D30-009', monitoring: 'CareOps ...', sensors: 'Default', company: 'Dialysezentrum Ostring', outOfService: false, active: false },
]

const storageKey = 'careops-medical-devices'

function isMedicalDevice(value: unknown): value is MedicalDevice {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return typeof item.number === 'number'
    && typeof item.name === 'string'
    && typeof item.monitoring === 'string'
    && typeof item.sensors === 'string'
    && typeof item.company === 'string'
    && typeof item.outOfService === 'boolean'
    && typeof item.active === 'boolean'
}

export function MedicalDevicesOverview() {
  const { language } = useLanguage()
  const [medicalDevices, setMedicalDevices] = useState(initialMedicalDevices)
  const [storageLoaded, setStorageLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey)
      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        if (!Array.isArray(parsed) || !parsed.every(isMedicalDevice)) {
          throw new Error('Saved medical device data has an invalid shape.')
        }
        // localStorage only exists in the browser, so saved data can only be loaded after hydration
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMedicalDevices(parsed)
      }
    } catch (loadError) {
      console.error('Could not load saved medical devices from local storage.', loadError)
    } finally {
      setStorageLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!storageLoaded) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(medicalDevices))
    } catch (saveError) {
      console.error('Could not save medical devices to local storage.', saveError)
    }
  }, [medicalDevices, storageLoaded])
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
        createMedicalDevice: 'Create medical device',
        search: 'Search medical devices and companies',
        monitoring: 'Monitoring device',
        sensors: 'Sensors',
        company: 'Company name',
        outOfService: 'Out of service',
        status: 'Status',
        inService: 'In service',
        activate: 'Activate',
        deactivate: 'Deactivate',
        noMedicalDevicesFound: 'No medical devices found.',
        nameRequired: 'Name and company name are required.',
        createDescription: 'Enter the medical device name and company.',
        cancel: 'Cancel',
        create: 'Create',
      }
    : {
        filters: 'Filter',
        export: 'Exportieren',
        createMedicalDevice: 'Medizingerät erstellen',
        search: 'Medizingeräte und Firmen suchen',
        monitoring: 'Monitoring-Gerät',
        sensors: 'Sensoren',
        company: 'Firmenname',
        outOfService: 'Außer Betrieb',
        status: 'Status',
        inService: 'Im Betrieb',
        activate: 'Aktivieren',
        deactivate: 'Deaktivieren',
        noMedicalDevicesFound: 'Keine Medizingeräte gefunden.',
        nameRequired: 'Name und Firmenname sind Pflichtfelder.',
        createDescription: 'Geben Sie den Gerätenamen und die Firma ein.',
        cancel: 'Abbrechen',
        create: 'Erstellen',
      }

  const visibleMedicalDevices = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase()
    if (!query) return medicalDevices
    return medicalDevices.filter((medicalDevice) =>
      [
        medicalDevice.name,
        medicalDevice.monitoring,
        medicalDevice.sensors === 'Default' && !isEnglish ? 'Standard' : medicalDevice.sensors,
        medicalDevice.company,
      ]
        .some((value) => value.toLocaleLowerCase().includes(query)),
    )
  }, [filter, isEnglish, medicalDevices])

  function exportMedicalDevices() {
    const headers = [
      'Name',
      labels.monitoring,
      labels.sensors,
      labels.company,
      labels.outOfService,
      labels.status,
    ]
    const rows = visibleMedicalDevices.map((medicalDevice) => [
      medicalDevice.name,
      medicalDevice.monitoring,
      medicalDevice.sensors === 'Default' && !isEnglish ? 'Standard' : medicalDevice.sensors,
      medicalDevice.company,
      medicalDevice.outOfService ? labels.outOfService : labels.inService,
      medicalDevice.active ? (isEnglish ? 'Active' : 'Aktiv') : (isEnglish ? 'Inactive' : 'Inaktiv'),
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
      .join('\r\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = isEnglish ? 'medical-devices.csv' : 'medizingeraete.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  function createMedicalDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedCompany = company.trim()
    if (!trimmedName || !trimmedCompany) {
      setError(labels.nameRequired)
      return
    }
    setMedicalDevices((current) => [...current, {
      number: Math.max(0, ...current.map((medicalDevice) => medicalDevice.number)) + 1,
      name: trimmedName,
      monitoring: 'N/A',
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
          <h2 className="text-lg font-semibold">{isEnglish ? 'Medical devices' : 'Medizingeräte'}</h2>
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
              onClick={exportMedicalDevices}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
            >
              <Download className="size-4" aria-hidden="true" />
              {labels.export}
            </button>
            <Button type="button" onClick={() => { setError(''); setCreateOpen(true) }} className="gap-2">
              <Plus className="size-4" aria-hidden="true" />
              {labels.createMedicalDevice}
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
          <table className="w-full min-w-[880px] table-fixed text-xs sm:text-sm">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
              <col className="w-[26%]" />
              <col className="w-[17%]" />
              <col className="w-[17%]" />
            </colgroup>
            <thead>
              <tr className="border-y border-border bg-muted/60 text-left text-xs font-semibold text-foreground">
                <th className="px-3 py-3">Name</th>
                <th className="truncate px-3 py-3" title={labels.monitoring}>{labels.monitoring}</th>
                <th className="px-3 py-3">{labels.sensors}</th>
                <th className="px-3 py-3">{labels.company}</th>
                <th className="px-3 py-3">{labels.outOfService}</th>
                <th className="px-3 py-3">{labels.status}</th>
              </tr>
            </thead>
            <tbody>
              {visibleMedicalDevices.map((medicalDevice, index) => (
                <tr key={medicalDevice.number} className={`border-b border-border last:border-0 hover:bg-muted/50 ${index % 2 ? 'bg-muted/20' : ''}`}>
                  <td className="truncate px-3 py-4" title={medicalDevice.name}>{medicalDevice.name}</td>
                  <td className="truncate px-3 py-4" title={medicalDevice.monitoring}>{medicalDevice.monitoring}</td>
                  <td className="truncate px-3 py-4" title={medicalDevice.sensors === 'Default' && !isEnglish ? 'Standard' : medicalDevice.sensors}>{medicalDevice.sensors === 'Default' && !isEnglish ? 'Standard' : medicalDevice.sensors}</td>
                  <td className="truncate px-3 py-4" title={medicalDevice.company}>{medicalDevice.company}</td>
                  <td className="px-3 py-4">
                    <span
                      aria-label={medicalDevice.outOfService ? labels.outOfService : labels.inService}
                      title={medicalDevice.outOfService ? labels.outOfService : labels.inService}
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${medicalDevice.outOfService ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'}`}
                    >
                      <CheckCircle2 className="size-3.5" aria-hidden="true" />
                      {medicalDevice.outOfService ? labels.outOfService : labels.inService}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <button
                      type="button"
                      aria-label={`${medicalDevice.name} ${medicalDevice.active ? labels.deactivate : labels.activate}`}
                      onClick={() => setMedicalDevices((current) => current.map((item) =>
                        item.number === medicalDevice.number ? { ...item, active: !item.active } : item,
                      ))}
                      className="whitespace-nowrap text-sm text-muted-foreground hover:text-primary"
                    >
                      {medicalDevice.active ? labels.deactivate : labels.activate}
                    </button>
                  </td>
                </tr>
              ))}
              {visibleMedicalDevices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">{labels.noMedicalDevicesFound}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent closeLabel={isEnglish ? 'Close' : 'Schließen'}>
          <form onSubmit={createMedicalDevice} className="grid gap-5">
            <DialogHeader>
              <DialogTitle>{labels.createMedicalDevice}</DialogTitle>
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
