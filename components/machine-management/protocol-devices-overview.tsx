'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { Download, Filter, Plus } from 'lucide-react'
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

export function ProtocolDevicesOverview() {
  const [devices, setDevices] = useState(initialDevices)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [serialNumber, setSerialNumber] = useState('')
  const [type, setType] = useState<ProtocolDevice['type']>('Doku-Kit')
  const [error, setError] = useState('')

  const visibleDevices = useMemo(() => {
    const query = filter.trim().toLocaleLowerCase()
    if (!query) return devices
    return devices.filter((device) =>
      [
        device.type,
        device.serialNumber,
        device.warrantyAllowed,
        device.pin,
        device.assignedFirmware,
        device.currentFirmware,
        device.company,
      ].some((value) => value.toLocaleLowerCase().includes(query)),
    )
  }, [devices, filter])

  function exportDevices() {
    const headers = ['Typ', 'Serien-Nr', 'Erlaube Garantie', 'PIN', 'Zugewiesene Firmware', 'Aktuelle Firmware', 'Firmenname', 'Status']
    const rows = visibleDevices.map((device) => [
      device.type,
      device.serialNumber,
      device.warrantyAllowed,
      device.pin,
      device.assignedFirmware,
      device.currentFirmware,
      device.company,
      device.active ? 'Aktiviert' : 'Aktivieren',
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
      .join('\r\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'protokoll-aufnahmegeraete.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  function createDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedSerialNumber = serialNumber.trim()
    if (!trimmedSerialNumber) {
      setError('Serien-Nr ist ein Pflichtfeld.')
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
        <div className="flex flex-wrap items-center gap-5 px-5 py-4">
          <button
            type="button"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
          >
            <Filter className="size-4" aria-hidden="true" />
            Filters
          </button>
          <button
            type="button"
            onClick={exportDevices}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
          >
            <Download className="size-4" aria-hidden="true" />
            Export
          </button>
          <Button type="button" onClick={() => { setError(''); setCreateOpen(true) }} className="gap-2">
            <Plus className="size-4" aria-hidden="true" />
            Neues Aufnahmegerät erstellen
          </Button>
        </div>

        {filtersOpen && (
          <div className="border-t border-border px-5 py-3">
            <Input
              type="search"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Aufnahmegeräte suchen"
              aria-label="Aufnahmegeräte suchen"
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
                <th className="px-3 py-3">Typ</th>
                <th className="px-3 py-3">Serien-Nr</th>
                <th className="truncate px-3 py-3" title="Erlaube Garantie">Erlaube Garanti...</th>
                <th className="px-3 py-3">PIN</th>
                <th className="truncate px-3 py-3" title="Zugewiesene Firmware">Zugewiesene Fi...</th>
                <th className="truncate px-3 py-3" title="Aktuelle Firmware">Aktuelle Firmw...</th>
                <th className="px-3 py-3">Firmenname</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleDevices.map((device, index) => (
                <tr key={device.serialNumber} className={`border-b border-border last:border-0 hover:bg-muted/50 ${index % 2 ? 'bg-muted/20' : ''}`}>
                  <td className="truncate px-3 py-4" title={device.type}>{device.type}</td>
                  <td className="truncate px-3 py-4" title={device.serialNumber}>{device.serialNumber}</td>
                  <td className="truncate px-3 py-4" title={device.warrantyAllowed}>{device.warrantyAllowed}</td>
                  <td className="px-3 py-4 tabular-nums">{device.pin}</td>
                  <td className="truncate px-3 py-4" title={device.assignedFirmware}>{device.assignedFirmware}</td>
                  <td className="truncate px-3 py-4" title={device.currentFirmware}>{device.currentFirmware}</td>
                  <td className="truncate px-3 py-4" title={device.company}>{device.company}</td>
                  <td className="px-3 py-4">
                    <button
                      type="button"
                      aria-label={`${device.serialNumber} ${device.active ? 'deaktivieren' : 'aktivieren'}`}
                      onClick={() => setDevices((current) => current.map((item) =>
                        item.serialNumber === device.serialNumber ? { ...item, active: !item.active } : item,
                      ))}
                      className="whitespace-nowrap text-sm text-muted-foreground hover:text-primary"
                    >
                      {device.active ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                  </td>
                </tr>
              ))}
              {visibleDevices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">Keine Aufnahmegeräte gefunden.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form onSubmit={createDevice} className="grid gap-5">
            <DialogHeader>
              <DialogTitle>Neues Aufnahmegerät erstellen</DialogTitle>
              <DialogDescription>Erfassen Sie Typ und Serien-Nr des Aufnahmegeräts.</DialogDescription>
            </DialogHeader>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Typ*</span>
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
              <span className="text-sm font-medium">Serien-Nr*</span>
              <Input value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} required autoFocus />
            </label>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Abbrechen</Button>
              <Button type="submit">Erstellen</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
