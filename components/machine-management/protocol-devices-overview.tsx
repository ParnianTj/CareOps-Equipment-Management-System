'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { Download, Filter } from 'lucide-react'
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

type ProtocolDevice = {
  number?: number
  type: 'Doku-Kit' | 'Smart-Cap'
  serialNumber: string
  warrantyAllowed: string
  pin: string
  assignedFirmware: string
  currentFirmware: string
  company: string
  active: boolean
}

const initialDevices: ProtocolDevice[] = [
  { number: 21, type: 'Doku-Kit', serialNumber: 'KRINNER Doku-Kit #0021', warrantyAllowed: 'No', pin: '4096', assignedFirmware: 'DOKU-KIT_ST...', currentFirmware: 'DOKU-KIT_ST...', company: 'z-part group', active: false },
  { number: 35, type: 'Doku-Kit', serialNumber: 'KRINNER Doku-Kit #0035', warrantyAllowed: 'No', pin: '5636', assignedFirmware: 'DOKU-KIT_ST...', currentFirmware: 'N/A', company: 'z-part group', active: false },
  { number: 55, type: 'Doku-Kit', serialNumber: 'KRINNER Doku-Kit #0055', warrantyAllowed: 'No', pin: '7733', assignedFirmware: 'DOKU-KIT_ST...', currentFirmware: 'DOKU-KIT_ST...', company: 'z-part group', active: false },
  { number: 59, type: 'Doku-Kit', serialNumber: 'KRINNER Doku-Kit #0059', warrantyAllowed: 'No', pin: '1447', assignedFirmware: 'DOKU-KIT_ST...', currentFirmware: 'N/A', company: 'z-part group', active: false },
  { number: 70, type: 'Doku-Kit', serialNumber: 'KRINNER Doku-Kit #0070', warrantyAllowed: 'No', pin: '4597', assignedFirmware: 'DOKU-KIT_ST...', currentFirmware: 'N/A', company: 'z-part group', active: false },
  { number: 71, type: 'Doku-Kit', serialNumber: 'KRINNER Doku-Kit #0071', warrantyAllowed: 'No', pin: '4346', assignedFirmware: 'DOKU-KIT_ST...', currentFirmware: 'N/A', company: 'z-part group', active: false },
  { number: 106, type: 'Smart-Cap', serialNumber: 'KRINNER KRE20-SC #82-25066', warrantyAllowed: 'No', pin: '1', assignedFirmware: 'KRE20_BLE_b1...', currentFirmware: 'N/A', company: 'z-part group', active: false },
  { number: 122, type: 'Smart-Cap', serialNumber: 'KRINNER KRE20-SC #82-42484', warrantyAllowed: 'No', pin: '1', assignedFirmware: 'KRE20_BLE_b1...', currentFirmware: 'N/A', company: 'z-part group', active: false },
  { number: 135, type: 'Smart-Cap', serialNumber: 'KRINNER KRE20-SC #82-42502', warrantyAllowed: 'No', pin: '1', assignedFirmware: 'KRE20_BLE_b1...', currentFirmware: 'N/A', company: 'z-part group', active: false },
  { number: 140, type: 'Smart-Cap', serialNumber: 'KRINNER KRE25-SC #82-41508', warrantyAllowed: 'No', pin: '1', assignedFirmware: 'KRE20_BLE_b1...', currentFirmware: 'N/A', company: 'z-part group', active: false },
  { number: 144, type: 'Smart-Cap', serialNumber: 'KRINNER KRE25-SC #82-41512', warrantyAllowed: 'No', pin: '1', assignedFirmware: 'KRE20_BLE_b1...', currentFirmware: 'N/A', company: 'z-part group', active: false },
  { number: 146, type: 'Smart-Cap', serialNumber: 'KRINNER KRE25-SC #82-41514', warrantyAllowed: 'No', pin: '1', assignedFirmware: 'KRE20_BLE_b1...', currentFirmware: 'N/A', company: 'z-part group', active: false },
  { type: 'Smart-Cap', serialNumber: 'KRINNER KRE20-SC #82-42193', warrantyAllowed: 'No', pin: '1', assignedFirmware: 'KRE20_BLE_b1...', currentFirmware: 'N/A', company: 'z-part group', active: false },
]

function localizedWarranty(value: string, isEnglish: boolean) {
  if (value === 'No') return isEnglish ? 'No' : 'Nein'
  if (value === 'Yes') return isEnglish ? 'Yes' : 'Ja'
  return value
}

function localizedFirmware(value: string, isEnglish: boolean) {
  return value === 'N/A' && !isEnglish ? 'k. A.' : value
}

export function ProtocolDevicesOverview() {
  const { language } = useLanguage()
  const [devices, setDevices] = useState(initialDevices)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [serialNumber, setSerialNumber] = useState('')
  const [type, setType] = useState<ProtocolDevice['type']>('Doku-Kit')
  const [error, setError] = useState('')
  const isEnglish = language === 'en'
  const labels = isEnglish
    ? {
        filters: 'Filters',
        export: 'Export',
        createDevice: 'Create recording device',
        search: 'Search recording devices',
        type: 'Type',
        serialNumber: 'Serial no.',
        warrantyAllowed: 'Warranty allowed',
        assignedFirmware: 'Assigned firmware',
        currentFirmware: 'Current firmware',
        company: 'Company name',
        status: 'Status',
        activate: 'Activate',
        deactivate: 'Deactivate',
        noDevicesFound: 'No recording devices found.',
        serialRequired: 'Serial number is required.',
        createDescription: 'Enter the type and serial number of the recording device.',
        cancel: 'Cancel',
        create: 'Create',
      }
    : {
        filters: 'Filter',
        export: 'Exportieren',
        createDevice: 'Neues Aufnahmegerät erstellen',
        search: 'Aufnahmegeräte suchen',
        type: 'Typ',
        serialNumber: 'Serien-Nr.',
        warrantyAllowed: 'Garantie zulässig',
        assignedFirmware: 'Zugewiesene Firmware',
        currentFirmware: 'Aktuelle Firmware',
        company: 'Firmenname',
        status: 'Status',
        activate: 'Aktivieren',
        deactivate: 'Deaktivieren',
        noDevicesFound: 'Keine Aufnahmegeräte gefunden.',
        serialRequired: 'Die Seriennummer ist ein Pflichtfeld.',
        createDescription: 'Erfassen Sie Typ und Seriennummer des Aufnahmegeräts.',
        cancel: 'Abbrechen',
        create: 'Erstellen',
      }
  const visibleDevices = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase()
    if (!query) return devices
    return devices.filter((device) =>
      [
        device.type,
        device.serialNumber,
        localizedWarranty(device.warrantyAllowed, isEnglish),
        device.pin,
        device.assignedFirmware,
        localizedFirmware(device.currentFirmware, isEnglish),
        device.company,
      ].some((value) => value.toLocaleLowerCase().includes(query)),
    )
  }, [devices, filter, isEnglish])

  function exportDevices() {
    const headers = [
      labels.type,
      labels.serialNumber,
      labels.warrantyAllowed,
      'PIN',
      labels.assignedFirmware,
      labels.currentFirmware,
      labels.company,
      labels.status,
    ]
    const rows = visibleDevices.map((device) => [
      device.type,
      device.serialNumber,
      localizedWarranty(device.warrantyAllowed, isEnglish),
      device.pin,
      device.assignedFirmware,
      localizedFirmware(device.currentFirmware, isEnglish),
      device.company,
      device.active ? (isEnglish ? 'Active' : 'Aktiv') : (isEnglish ? 'Inactive' : 'Inaktiv'),
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
      .join('\r\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = isEnglish ? 'protocol-recording-devices.csv' : 'protokoll-aufnahmegeraete.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  function createDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedSerialNumber = serialNumber.trim()
    if (!trimmedSerialNumber) {
      setError(labels.serialRequired)
      return
    }
    setDevices((current) => [...current, {
      type,
      serialNumber: trimmedSerialNumber,
      warrantyAllowed: 'No',
      pin: type === 'Doku-Kit' ? '4096' : '1',
      assignedFirmware: type === 'Doku-Kit' ? 'DOKU-KIT_ST...' : 'KRE20_BLE_b1...',
      currentFirmware: 'N/A',
      company: 'z-part group',
      active: false,
    }])
    setSerialNumber('')
    setType('Doku-Kit')
    setError('')
    setCreateOpen(false)
  }

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
      <section className="overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-[0_2px_12px_rgba(23,42,50,0.025)]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <h2 className="text-lg font-semibold">
            {isEnglish ? 'Protocol/Recording Devices' : 'Protokoll/Aufnahmegeräte'}
          </h2>
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
              onClick={exportDevices}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
            >
              <Download className="size-4" aria-hidden="true" />
              {labels.export}
            </button>
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
          <table className="w-full min-w-[1150px] table-fixed text-xs sm:text-sm">
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[25%]" />
              <col className="w-[12%]" />
              <col className="w-[7%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[11%]" />
              <col className="w-[7%]" />
            </colgroup>
            <thead>
              <tr className="border-y border-border bg-muted/60 text-left text-xs font-semibold text-foreground">
                <th className="px-3 py-3">{labels.type}</th>
                <th className="px-3 py-3">{labels.serialNumber}</th>
                <th className="truncate px-3 py-3" title={labels.warrantyAllowed}>{labels.warrantyAllowed}</th>
                <th className="px-3 py-3">PIN</th>
                <th className="truncate px-3 py-3" title={labels.assignedFirmware}>{labels.assignedFirmware}</th>
                <th className="truncate px-3 py-3" title={labels.currentFirmware}>{labels.currentFirmware}</th>
                <th className="px-3 py-3">{labels.company}</th>
                <th className="px-3 py-3">{labels.status}</th>
              </tr>
            </thead>
            <tbody>
              {visibleDevices.map((device, index) => (
                <tr key={device.serialNumber} className={`border-b border-border last:border-0 hover:bg-muted/50 ${index % 2 ? 'bg-muted/20' : ''}`}>
                  <td className="truncate px-3 py-4" title={device.type}>{device.type}</td>
                  <td className="truncate px-3 py-4" title={device.serialNumber}>{device.serialNumber}</td>
                  <td className="truncate px-3 py-4" title={localizedWarranty(device.warrantyAllowed, isEnglish)}>{localizedWarranty(device.warrantyAllowed, isEnglish)}</td>
                  <td className="px-3 py-4 tabular-nums">{device.pin}</td>
                  <td className="truncate px-3 py-4" title={device.assignedFirmware}>{device.assignedFirmware}</td>
                  <td className="truncate px-3 py-4" title={localizedFirmware(device.currentFirmware, isEnglish)}>{localizedFirmware(device.currentFirmware, isEnglish)}</td>
                  <td className="truncate px-3 py-4" title={device.company}>{device.company}</td>
                  <td className="px-3 py-4">
                    <button
                      type="button"
                      aria-label={`${device.serialNumber} ${device.active ? labels.deactivate : labels.activate}`}
                      onClick={() => setDevices((current) => current.map((item) =>
                        item.serialNumber === device.serialNumber ? { ...item, active: !item.active } : item,
                      ))}
                      className="whitespace-nowrap text-sm text-muted-foreground hover:text-primary"
                    >
                      {device.active ? labels.deactivate : labels.activate}
                    </button>
                  </td>
                </tr>
              ))}
              {visibleDevices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">{labels.noDevicesFound}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent closeLabel={isEnglish ? 'Close' : 'Schließen'}>
          <form onSubmit={createDevice} className="grid gap-5">
            <DialogHeader>
              <DialogTitle>{labels.createDevice}</DialogTitle>
              <DialogDescription>{labels.createDescription}</DialogDescription>
            </DialogHeader>
            <label className="grid gap-2">
              <span className="text-sm font-medium">{labels.type}*</span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as ProtocolDevice['type'])}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="Doku-Kit">Doku-Kit</option>
                <option value="Smart-Cap">Smart-Cap</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">{labels.serialNumber}*</span>
              <Input value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} required autoFocus />
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
