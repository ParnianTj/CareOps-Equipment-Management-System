'use client'

import { useEffect, useMemo, useState } from 'react'
import { Ban, Download, Filter, KeyRound, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
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
import { organizations } from '@/lib/dashboard-data'

type UserRole =
  | 'SUPERADMIN'
  | 'ACCOUNT MANAGER'
  | 'ADMIN'
  | 'OPERATOR'
  | 'USER'
  | 'STORE CUSTOMER'
  | 'PLAN MANAGER'
type UserFilterColumn = 'name' | 'email' | 'company' | 'role' | 'expirationDate' | 'status' | 'action'
type UserFilterOperator = 'contains' | 'equals' | 'not-equals' | 'starts-with' | 'ends-with'
type ManagedUser = {
  id: string
  name: string
  firstName?: string
  lastName?: string
  email: string
  company: string
  role: UserRole
  phone?: string
  mobile?: string
  fax?: string
  expirationDate: string
  active: boolean
  archived: boolean
}

const storageKey = 'schlienz-managed-users'
const screenshotUsersMigrationKey = 'schlienz-screenshot-users-seeded-v3'
const filterOperators: { value: UserFilterOperator; label: string }[] = [
  { value: 'contains', label: 'contains' },
  { value: 'equals', label: 'equals' },
  { value: 'not-equals', label: 'does not equal' },
  { value: 'starts-with', label: 'starts with' },
  { value: 'ends-with', label: 'ends with' },
]

const legacyRoleNames = new Map<string, UserRole>([
  ['Account Manager', 'ACCOUNT MANAGER'],
  ['Store Customer', 'STORE CUSTOMER'],
  ['Admin', 'ADMIN'],
])

const filterColumns: { value: UserFilterColumn; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'company', label: 'Firmenname' },
  { value: 'role', label: 'Rolle' },
  { value: 'expirationDate', label: 'Expiration Date(UTC)' },
  { value: 'status', label: 'Status' },
  { value: 'action', label: 'Aktion' },
]

const screenshotUsers: ManagedUser[] = [
  { id: 'screenshot-user-1', name: 'Antoni Albrycht', email: 'antoni.albrycht@z-part.group', company: 'z-part group', role: 'OPERATOR', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-2', name: 'David Kaltenrieder', email: 'david.kaltenrieder@z-part.group', company: 'z-part group, Affolter Metall, Atel...', role: 'ACCOUNT MANAGER', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-3', name: 'Dominik Züger', email: 'dominik.zueger@z-part.group', company: 'z-part group, Roth Zaun AG, G.A...', role: 'ACCOUNT MANAGER', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-4', name: 'Faycal Djelal', email: 'faycal.djelal@z-part.group', company: 'z-part group', role: 'OPERATOR', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-5', name: 'Helmuth Grossmayer', email: '', company: 'z-part group, Easy-Fundament G...', role: 'ACCOUNT MANAGER', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-6', name: 'Ioan Bobes', email: 'ioan.bobes@z-part.group', company: 'z-part group', role: 'OPERATOR', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-7', name: 'Jakub Baran', email: 'jakub.baran@z-part.group', company: 'z-part group', role: 'OPERATOR', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-8', name: 'Jarek Kuzniar', email: 'jaroslaw.kuzniar@z-part.group', company: 'z-part group', role: 'OPERATOR', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-9', name: 'Jonathan Gros', email: 'jonathan.gros@z-part.group', company: 'z-part group', role: 'ADMIN', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-10', name: 'Kambium Montagen', email: 'info@kambium-montagen.ch', company: 'z-part group', role: 'OPERATOR', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-11', name: 'Kamil Szumski', email: 'kamil.szumski@z-part.group', company: 'z-part group', role: 'OPERATOR', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-12', name: 'Leandro Santos', email: 'leandro.santos@z-part.group', company: 'Jutech, z-part group', role: 'ACCOUNT MANAGER', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-13', name: 'Lukas Casar', email: 'lukas.casar@z-part.group', company: 'z-part group', role: 'ADMIN', expirationDate: '', active: false, archived: false },
]

const initialUsers = screenshotUsers
const previousSeedUserIds = new Set(Array.from({ length: 8 }, (_, index) => `user-${index + 1}`))

type UserDialog = 'create' | 'edit' | 'password' | null

export function UsersOverview() {
  const [users, setUsers] = useState(initialUsers)
  const [storageLoaded, setStorageLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterColumn, setFilterColumn] = useState<UserFilterColumn>('name')
  const [filterOperator, setFilterOperator] = useState<UserFilterOperator>('contains')
  const [filterValue, setFilterValue] = useState('')
  const [dialog, setDialog] = useState<UserDialog>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ManagedUser>(initialUsers[0])
  const [passwordDraft, setPasswordDraft] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey)
      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        if (!Array.isArray(parsed) || !parsed.every((user) =>
          typeof user === 'object'
          && user !== null
          && typeof user.id === 'string'
          && typeof user.name === 'string'
          && typeof user.email === 'string'
          && typeof user.company === 'string'
          && typeof user.role === 'string'
          && typeof user.active === 'boolean'
          && typeof user.archived === 'boolean',
        )) {
          throw new Error('Saved user data has an invalid shape.')
        }
        const savedUsers = (parsed as ManagedUser[])
          .filter((user) => !previousSeedUserIds.has(user.id))
          .map((user) => ({
            ...user,
            role: legacyRoleNames.get(user.role) ?? user.role,
          }))
        if (window.localStorage.getItem(screenshotUsersMigrationKey) !== 'true') {
          const userCreatedOutsideScreenshot = savedUsers.filter((user) => !user.id.startsWith('screenshot-user-'))
          window.localStorage.setItem(screenshotUsersMigrationKey, 'true')
          // localStorage only exists in the browser, so saved data can only be loaded after hydration
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setUsers([...userCreatedOutsideScreenshot, ...screenshotUsers])
        } else {
          const savedUserIds = new Set(savedUsers.map((user) => user.id))
          setUsers([
            ...savedUsers,
            ...screenshotUsers.filter((user) => !savedUserIds.has(user.id)),
          ])
        }
      } else {
        window.localStorage.setItem(screenshotUsersMigrationKey, 'true')
      }
    } catch (loadError) {
      console.error('Could not load saved users from local storage.', loadError)
    } finally {
      setStorageLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!storageLoaded) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(users))
    } catch (saveError) {
      console.error('Could not save user changes.', saveError)
      // reports a failed write to localStorage (an external system), which is only known inside this effect
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('Änderungen konnten nicht im Browser gespeichert werden.')
    }
  }, [users, storageLoaded])

  const visibleUsers = useMemo(() => users.filter((user) => {
    if (user.archived && !showArchived) return false
    const matchesSearch = !search.trim() || [user.name, user.email, user.company]
      .some((value) => value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
    const filterField = filterColumn === 'status'
      ? user.active ? 'Aktiv' : 'Inaktiv'
      : filterColumn === 'action'
        ? user.archived ? 'Bearbeiten Passwort ändern Wiederherstellen Löschen' : 'Bearbeiten Passwort ändern Archivieren Löschen'
        : filterColumn === 'expirationDate'
          ? user.expirationDate || '---'
          : user[filterColumn]
    const normalizedField = filterField.toLocaleLowerCase()
    const normalizedFilter = filterValue.trim().toLocaleLowerCase()
    const matchesFilter = !normalizedFilter || (() => {
      switch (filterOperator) {
        case 'equals': return normalizedField === normalizedFilter
        case 'not-equals': return normalizedField !== normalizedFilter
        case 'starts-with': return normalizedField.startsWith(normalizedFilter)
        case 'ends-with': return normalizedField.endsWith(normalizedFilter)
        case 'contains': return normalizedField.includes(normalizedFilter)
      }
    })()
    return matchesSearch && matchesFilter
  }), [users, showArchived, search, filterColumn, filterOperator, filterValue])

  function persistUsers(nextUsers: ManagedUser[]) {
    setUsers(nextUsers)
    setError('')
  }

  function openCreate() {
    setSelectedId(null)
    setDraft({
      id: `user-${crypto.randomUUID()}`,
      name: '',
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      role: 'ACCOUNT MANAGER',
      expirationDate: '',
      phone: '',
      mobile: '',
      fax: '',
      active: false,
      archived: false,
    })
    setError('')
    setDialog('create')
  }

  function openEdit(user: ManagedUser) {
    setSelectedId(user.id)
    const [firstName = '', ...lastNames] = user.name.split(' ')
    setDraft({
      ...user,
      firstName: user.firstName ?? firstName,
      lastName: user.lastName ?? lastNames.join(' '),
      phone: user.phone ?? '',
      mobile: user.mobile ?? '',
      fax: user.fax ?? '',
    })
    setError('')
    setDialog('edit')
  }

  function saveUser() {
    const firstName = (draft.firstName ?? '').trim()
    const lastName = (draft.lastName ?? '').trim()
    if (!firstName || !lastName || !draft.email.trim() || !draft.company.trim()) {
      setError('E-Mail, Vorname, Nachname und Organisation sind Pflichtfelder.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      setError('Bitte eine gültige E-Mail-Adresse eingeben.')
      return
    }
    const nextUsers = dialog === 'edit'
      ? users.map((user) => user.id === selectedId ? {
          ...draft,
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
          email: draft.email.trim(),
          company: draft.company.trim(),
        } : user)
      : [...users, {
          ...draft,
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
          email: draft.email.trim(),
          company: draft.company.trim(),
        }]
    persistUsers(nextUsers)
    setDialog(null)
  }

  function exportUsers() {
    const headers = ['Name', 'Email', 'Firmenname', 'Rolle', 'Expiration Date (UTC)', 'Status']
    const csv = [headers, ...visibleUsers.map((user) => [
      user.name,
      user.email,
      user.company,
      user.role,
      user.expirationDate || '---',
      user.active ? 'Aktiv' : 'Inaktiv',
    ])]
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
      .join('\r\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'benutzer.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-[1500px] flex-col gap-7">
        <section className="flex min-w-0 flex-col rounded-2xl border border-border/80 bg-card text-card-foreground shadow-[0_2px_12px_rgba(23,42,50,0.025)]">
          <header className="px-5 pt-5 pb-3 sm:px-6 sm:pt-6">
            <h1 className="text-[15px] font-semibold tracking-tight">Benutzer</h1>
          </header>

          <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:flex-nowrap md:items-center md:gap-2">
            <label className="relative block min-w-0 md:w-auto md:flex-1">
              <span className="sr-only">Benutzer suchen</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Benutzer suchen"
                aria-label="Benutzer suchen"
                className="h-10 pl-9"
              />
            </label>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end md:flex-nowrap">
              <div className="flex shrink-0 flex-wrap items-center gap-2 md:flex-nowrap md:gap-2">
                <button
                  type="button"
                  aria-expanded={filtersOpen}
                  onClick={() => setFiltersOpen((open) => !open)}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-foreground/90 hover:text-foreground md:text-xs"
                >
                  <Filter className="size-4" aria-hidden="true" />
                  Filters
                </button>
                <button
                  type="button"
                  onClick={exportUsers}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-foreground/90 hover:text-foreground md:text-xs"
                >
                  <Download className="size-4" aria-hidden="true" />
                  Export
                </button>
              </div>
              <label className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm text-foreground/80 md:text-xs">
                <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} className="size-4 shrink-0 rounded border-input" />
                <span>Archivierte Benutzer anzeigen</span>
              </label>
              <Button type="button" onClick={openCreate} className="h-10 shrink-0 gap-1.5 whitespace-nowrap rounded-xl px-3 font-semibold shadow-sm md:px-2 md:text-xs">
                <Plus className="size-4" aria-hidden="true" />
                Benutzer hinzufügen
              </Button>
            </div>
          </div>

          {filtersOpen && (
            <div className="mx-4 mb-4 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-2 rounded-lg border border-border p-3 sm:mx-5 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
              <button type="button" aria-label="Filter zurücksetzen" onClick={() => setFilterValue('')} className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="size-4" aria-hidden="true" />
              </button>
              <label className="grid gap-1 text-xs text-muted-foreground">
                Columns
                <select
                  value={filterColumn}
                  onChange={(event) => setFilterColumn(event.target.value as UserFilterColumn)}
                  aria-label="Filter column"
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                >
                  {filterColumns.map((column) => <option key={column.value} value={column.value}>{column.label}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                Operator
                <select
                  value={filterOperator}
                  onChange={(event) => setFilterOperator(event.target.value as UserFilterOperator)}
                  aria-label="Filter operator"
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                >
                  {filterOperators.map((operator) => <option key={operator.value} value={operator.value}>{operator.label}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                Value
                <Input aria-label="Filter value" value={filterValue} onChange={(event) => setFilterValue(event.target.value)} placeholder="Filter value" className="h-9" />
              </label>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full table-fixed text-xs sm:text-sm">
              <colgroup>
                <col className="w-[10%]" />
                <col className="w-[20%]" />
                <col className="w-[20%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[9%]" />
                <col className="w-[15%]" />
              </colgroup>
              <thead>
                <tr className="border-y border-border bg-muted/60 text-left text-xs font-semibold text-foreground">
                  <th className="px-2 py-3">Name</th>
                  <th className="px-2 py-3">Email</th>
                  <th className="px-2 py-3">Firmenname</th>
                  <th className="px-2 py-3">Rolle</th>
                  <th className="px-2 py-3">Expiration Date (UTC)</th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-2 py-3">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user, index) => (
                  <tr key={user.id} className={`border-b border-border last:border-0 hover:bg-muted/50 ${index % 2 ? 'bg-muted/20' : ''}`}>
                    <td className="truncate px-2 py-4" title={user.name}>{user.name}</td>
                    <td className="truncate px-2 py-4" title={user.email}>{user.email}</td>
                    <td className="truncate px-2 py-4" title={user.company}>{user.company}</td>
                    <td className="truncate px-2 py-4">{user.role}</td>
                    <td className="px-2 py-4 tabular-nums">{user.expirationDate || '---'}</td>
                    <td className="px-2 py-4">
                      <button type="button" onClick={() => persistUsers(users.map((item) => item.id === user.id ? { ...item, active: !item.active } : item))} className="text-sm text-muted-foreground hover:text-primary">
                        {user.active ? 'Deaktivieren' : 'Aktivieren'}
                      </button>
                    </td>
                    <td className="px-2 py-4">
                      <div className="flex items-center gap-3">
                        <button type="button" aria-label={`${user.name} bearbeiten`} title="Bearbeiten" onClick={() => openEdit(user)} className="text-primary hover:text-primary/80"><Pencil className="size-4" aria-hidden="true" /></button>
                        <button type="button" aria-label={`${user.name} Passwort ändern`} title="Passwort ändern" onClick={() => { setSelectedId(user.id); setPasswordDraft(''); setError(''); setDialog('password') }} className="text-primary hover:text-primary/80"><KeyRound className="size-4" aria-hidden="true" /></button>
                        <button type="button" aria-label={`${user.name} ${user.archived ? 'wiederherstellen' : 'archivieren'}`} title={user.archived ? 'Wiederherstellen' : 'Archivieren'} onClick={() => persistUsers(users.map((item) => item.id === user.id ? { ...item, archived: !item.archived } : item))} className="text-muted-foreground hover:text-foreground"><Ban className="size-4" aria-hidden="true" /></button>
                        <button type="button" aria-label={`${user.name} löschen`} title="Löschen" onClick={() => { if (window.confirm(`Benutzer „${user.name}“ wirklich löschen?`)) persistUsers(users.filter((item) => item.id !== user.id)) }} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" aria-hidden="true" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleUsers.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">Keine Benutzer gefunden.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open) setDialog(null) }}>
        <DialogContent className="max-h-[90vh] gap-5 overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialog === 'create' ? 'Benutzer hinzufügen' : dialog === 'edit' ? 'Benutzer bearbeiten' : 'Passwort ändern'}</DialogTitle>
            <DialogDescription>Benutzerdaten für die Organisationsverwaltung.</DialogDescription>
          </DialogHeader>
          {dialog === 'password' ? (
            <label className="grid gap-2">
              <span className="text-sm font-medium">Neues Passwort</span>
              <Input type="password" value={passwordDraft} onChange={(event) => setPasswordDraft(event.target.value)} aria-label="Neues Passwort" />
            </label>
          ) : (
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Email*</span>
                <Input
                  type="email"
                  value={draft.email}
                  onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                  aria-label="Email"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Vorname*</span>
                <Input
                  value={draft.firstName ?? ''}
                  onChange={(event) => setDraft({ ...draft, firstName: event.target.value })}
                  aria-label="Vorname"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Nachname*</span>
                <Input
                  value={draft.lastName ?? ''}
                  onChange={(event) => setDraft({ ...draft, lastName: event.target.value })}
                  aria-label="Nachname"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Tel-Nr.</span>
                <Input
                  type="tel"
                  value={draft.phone ?? ''}
                  onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                  aria-label="Tel-Nr."
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Mobil-Nr</span>
                <Input
                  type="tel"
                  value={draft.mobile ?? ''}
                  onChange={(event) => setDraft({ ...draft, mobile: event.target.value })}
                  aria-label="Mobil-Nr"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Fax</span>
                <Input
                  type="tel"
                  value={draft.fax ?? ''}
                  onChange={(event) => setDraft({ ...draft, fax: event.target.value })}
                  aria-label="Fax"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Organisationen*</span>
                <select
                  value={draft.company}
                  onChange={(event) => setDraft({ ...draft, company: event.target.value })}
                  aria-label="Organisationen"
                  required
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Organisation auswählen</option>
                  {organizations.map((org) => <option key={org.id} value={org.name}>{org.name}</option>)}
                  {!organizations.some((org) => org.name === draft.company) && draft.company && <option value={draft.company}>{draft.company}</option>}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Rolle*</span>
                <select
                  value={draft.role}
                  onChange={(event) => setDraft({ ...draft, role: event.target.value as UserRole })}
                  aria-label="Rolle"
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="SUPERADMIN">SUPERADMIN</option>
                  <option value="ACCOUNT MANAGER">ACCOUNT MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="USER">USER</option>
                  <option value="STORE CUSTOMER">STORE CUSTOMER</option>
                  <option value="PLAN MANAGER">PLAN MANAGER</option>
                </select>
              </label>
            </div>
          )}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>Abbrechen</Button>
            {dialog === 'password' ? (
              <Button type="button" onClick={() => {
                if (passwordDraft.length < 8) { setError('Das Passwort muss mindestens 8 Zeichen lang sein.'); return }
                setDialog(null)
              }}>Speichern</Button>
            ) : (
              <Button type="button" onClick={saveUser}>{dialog === 'create' ? 'Einladung versenden' : 'Speichern'}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
