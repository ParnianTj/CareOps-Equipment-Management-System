'use client'

import { useEffect, useMemo, useState } from 'react'
import { Ban, Download, Filter, KeyRound, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { AppShell, useT } from '@/components/app-shell'
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
import { careProviders } from '@/lib/dashboard-data'

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

const storageKey = 'careops-managed-users'
const screenshotUsersMigrationKey = 'careops-screenshot-users-seeded-v3'
const filterOperators: { value: UserFilterOperator; label: string; labelEn: string }[] = [
  { value: 'contains', label: 'enthält', labelEn: 'contains' },
  { value: 'equals', label: 'ist gleich', labelEn: 'equals' },
  { value: 'not-equals', label: 'ist ungleich', labelEn: 'does not equal' },
  { value: 'starts-with', label: 'beginnt mit', labelEn: 'starts with' },
  { value: 'ends-with', label: 'endet mit', labelEn: 'ends with' },
]

const legacyRoleNames = new Map<string, UserRole>([
  ['Account Manager', 'ACCOUNT MANAGER'],
  ['Store Customer', 'STORE CUSTOMER'],
  ['Admin', 'ADMIN'],
])

const filterColumns: { value: UserFilterColumn; label: string; labelEn: string }[] = [
  { value: 'name', label: 'Name', labelEn: 'Name' },
  { value: 'email', label: 'E-Mail', labelEn: 'Email' },
  { value: 'company', label: 'Firmenname', labelEn: 'Company name' },
  { value: 'role', label: 'Rolle', labelEn: 'Role' },
  { value: 'expirationDate', label: 'Ablaufdatum (UTC)', labelEn: 'Expiration date (UTC)' },
  { value: 'status', label: 'Status', labelEn: 'Status' },
  { value: 'action', label: 'Aktion', labelEn: 'Action' },
]

const screenshotUsers: ManagedUser[] = [
  { id: 'screenshot-user-1', name: 'Anton Albrecht', email: 'anton.albrecht@careops.example', company: 'CareOps Gruppe', role: 'OPERATOR', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-2', name: 'Daniel Kaltenbach', email: 'daniel.kaltenbach@careops.example', company: 'CareOps Gruppe, MVZ Am Stadtgarten, Schme...', role: 'ACCOUNT MANAGER', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-3', name: 'Alex Berger', email: 'alex.berger@careops.example', company: 'CareOps Gruppe, Praxis am Rosenpark, Haus...', role: 'ACCOUNT MANAGER', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-4', name: 'Farid Demir', email: 'farid.demir@careops.example', company: 'CareOps Gruppe', role: 'OPERATOR', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-5', name: 'Miriam Vogt', email: '', company: 'CareOps Gruppe, Praxisgemeinschaft M...', role: 'ACCOUNT MANAGER', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-6', name: 'Ivo Brandl', email: 'ivo.brandl@careops.example', company: 'CareOps Gruppe', role: 'OPERATOR', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-7', name: 'Jana Bauer', email: 'jana.bauer@careops.example', company: 'CareOps Gruppe', role: 'OPERATOR', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-8', name: 'Jan Kunz', email: 'jan.kunz@careops.example', company: 'CareOps Gruppe', role: 'OPERATOR', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-9', name: 'Julia Graf', email: 'julia.graf@careops.example', company: 'CareOps Gruppe', role: 'ADMIN', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-10', name: 'Klinik Kleinfeld', email: 'info@klinik-kleinfeld.example', company: 'CareOps Gruppe', role: 'OPERATOR', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-11', name: 'Karin Schulz', email: 'karin.schulz@careops.example', company: 'CareOps Gruppe', role: 'OPERATOR', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-12', name: 'Leon Sander', email: 'leon.sander@careops.example', company: 'Telemedizin Nordlicht, CareOps Gruppe', role: 'ACCOUNT MANAGER', expirationDate: '', active: false, archived: false },
  { id: 'screenshot-user-13', name: 'Lena Christ', email: 'lena.christ@careops.example', company: 'CareOps Gruppe', role: 'ADMIN', expirationDate: '', active: false, archived: false },
]

const initialUsers = screenshotUsers
const previousSeedUserIds = new Set(Array.from({ length: 8 }, (_, index) => `user-${index + 1}`))

type UserDialog = 'create' | 'edit' | 'password' | null

export function UsersOverview() {
  const t = useT()
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
      setError(t('Änderungen konnten nicht im Browser gespeichert werden.', 'Changes could not be saved in the browser.'))
    }
  }, [users, storageLoaded, t])

  const visibleUsers = useMemo(() => users.filter((user) => {
    if (user.archived && !showArchived) return false
    const matchesSearch = !search.trim() || [user.name, user.email, user.company]
      .some((value) => value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
    const filterField = filterColumn === 'status'
      ? user.active ? t('Aktiv', 'Active') : t('Inaktiv', 'Inactive')
      : filterColumn === 'action'
        ? user.archived ? t('Bearbeiten Passwort ändern Wiederherstellen Löschen', 'Edit Change password Restore Delete') : t('Bearbeiten Passwort ändern Archivieren Löschen', 'Edit Change password Archive Delete')
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
  }), [users, showArchived, search, filterColumn, filterOperator, filterValue, t])

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
      setError(t('E-Mail, Vorname, Nachname und Einrichtung sind Pflichtfelder.', 'Email, first name, last name and care provider are required.'))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      setError(t('Bitte eine gültige E-Mail-Adresse eingeben.', 'Please enter a valid email address.'))
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
    const headers = [t('Name', 'Name'), t('E-Mail', 'Email'), t('Firmenname', 'Company name'), t('Rolle', 'Role'), t('Ablaufdatum (UTC)', 'Expiration date (UTC)'), 'Status']
    const csv = [headers, ...visibleUsers.map((user) => [
      user.name,
      user.email,
      user.company,
      user.role,
      user.expirationDate || '---',
      user.active ? t('Aktiv', 'Active') : t('Inaktiv', 'Inactive'),
    ])]
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
      .join('\r\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = t('benutzer.csv', 'users.csv')
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
            <h1 className="text-[15px] font-semibold tracking-tight">{t('Benutzer', 'Users')}</h1>
          </header>

          <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:flex-nowrap md:items-center md:gap-2">
            <label className="relative block min-w-0 md:w-auto md:flex-1">
              <span className="sr-only">{t('Benutzer suchen', 'Search users')}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('Benutzer suchen', 'Search users')}
                aria-label={t('Benutzer suchen', 'Search users')}
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
                  {t('Filter', 'Filters')}
                </button>
                <button
                  type="button"
                  onClick={exportUsers}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-foreground/90 hover:text-foreground md:text-xs"
                >
                  <Download className="size-4" aria-hidden="true" />
                  {t('Exportieren', 'Export')}
                </button>
              </div>
              <label className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm text-foreground/80 md:text-xs">
                <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} className="size-4 shrink-0 rounded border-input" />
                <span>{t('Archivierte Benutzer anzeigen', 'Show archived users')}</span>
              </label>
              <Button type="button" onClick={openCreate} className="h-10 shrink-0 gap-1.5 whitespace-nowrap rounded-xl px-3 font-semibold shadow-sm md:px-2 md:text-xs">
                <Plus className="size-4" aria-hidden="true" />
                {t('Benutzer hinzufügen', 'Add user')}
              </Button>
            </div>
          </div>

          {filtersOpen && (
            <div className="mx-4 mb-4 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-2 rounded-lg border border-border p-3 sm:mx-5 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
              <button type="button" aria-label={t('Filter zurücksetzen', 'Reset filter')} onClick={() => setFilterValue('')} className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="size-4" aria-hidden="true" />
              </button>
              <label className="grid gap-1 text-xs text-muted-foreground">
                {t('Spalte', 'Column')}
                <select
                  value={filterColumn}
                  onChange={(event) => setFilterColumn(event.target.value as UserFilterColumn)}
                  aria-label={t('Filterspalte', 'Filter column')}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                >
                  {filterColumns.map((column) => <option key={column.value} value={column.value}>{t(column.label, column.labelEn)}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                {t('Operator', 'Operator')}
                <select
                  value={filterOperator}
                  onChange={(event) => setFilterOperator(event.target.value as UserFilterOperator)}
                  aria-label={t('Filteroperator', 'Filter operator')}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                >
                  {filterOperators.map((operator) => <option key={operator.value} value={operator.value}>{t(operator.label, operator.labelEn)}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                {t('Wert', 'Value')}
                <Input aria-label={t('Filterwert', 'Filter value')} value={filterValue} onChange={(event) => setFilterValue(event.target.value)} placeholder={t('Filterwert', 'Filter value')} className="h-9" />
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
                  <th className="px-2 py-3">{t('E-Mail', 'Email')}</th>
                  <th className="px-2 py-3">{t('Firmenname', 'Company name')}</th>
                  <th className="px-2 py-3">{t('Rolle', 'Role')}</th>
                  <th className="px-2 py-3">{t('Ablaufdatum (UTC)', 'Expiration date (UTC)')}</th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-2 py-3">{t('Aktion', 'Action')}</th>
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
                        {user.active ? t('Deaktivieren', 'Deactivate') : t('Aktivieren', 'Activate')}
                      </button>
                    </td>
                    <td className="px-2 py-4">
                      <div className="flex items-center gap-3">
                        <button type="button" aria-label={t(`${user.name} bearbeiten`, `Edit ${user.name}`)} title={t('Bearbeiten', 'Edit')} onClick={() => openEdit(user)} className="text-primary hover:text-primary/80"><Pencil className="size-4" aria-hidden="true" /></button>
                        <button type="button" aria-label={t(`${user.name} Passwort ändern`, `Change password for ${user.name}`)} title={t('Passwort ändern', 'Change password')} onClick={() => { setSelectedId(user.id); setPasswordDraft(''); setError(''); setDialog('password') }} className="text-primary hover:text-primary/80"><KeyRound className="size-4" aria-hidden="true" /></button>
                        <button type="button" aria-label={user.archived ? t(`${user.name} wiederherstellen`, `Restore ${user.name}`) : t(`${user.name} archivieren`, `Archive ${user.name}`)} title={user.archived ? t('Wiederherstellen', 'Restore') : t('Archivieren', 'Archive')} onClick={() => persistUsers(users.map((item) => item.id === user.id ? { ...item, archived: !item.archived } : item))} className="text-muted-foreground hover:text-foreground"><Ban className="size-4" aria-hidden="true" /></button>
                        <button type="button" aria-label={t(`${user.name} löschen`, `Delete ${user.name}`)} title={t('Löschen', 'Delete')} onClick={() => { if (window.confirm(t(`Benutzer „${user.name}“ wirklich löschen?`, `Really delete user "${user.name}"?`))) persistUsers(users.filter((item) => item.id !== user.id)) }} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" aria-hidden="true" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleUsers.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">{t('Keine Benutzer gefunden.', 'No users found.')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open) setDialog(null) }}>
        <DialogContent className="max-h-[90vh] gap-5 overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialog === 'create' ? t('Benutzer hinzufügen', 'Add user') : dialog === 'edit' ? t('Benutzer bearbeiten', 'Edit user') : t('Passwort ändern', 'Change password')}</DialogTitle>
            <DialogDescription>{t('Benutzerdaten für die Einrichtungsverwaltung.', 'User details for care provider management.')}</DialogDescription>
          </DialogHeader>
          {dialog === 'password' ? (
            <label className="grid gap-2">
              <span className="text-sm font-medium">{t('Neues Passwort', 'New password')}</span>
              <Input type="password" value={passwordDraft} onChange={(event) => setPasswordDraft(event.target.value)} aria-label={t('Neues Passwort', 'New password')} />
            </label>
          ) : (
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium">{t('E-Mail*', 'Email*')}</span>
                <Input
                  type="email"
                  value={draft.email}
                  onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                  aria-label={t('E-Mail', 'Email')}
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">{t('Vorname*', 'First name*')}</span>
                <Input
                  value={draft.firstName ?? ''}
                  onChange={(event) => setDraft({ ...draft, firstName: event.target.value })}
                  aria-label={t('Vorname', 'First name')}
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">{t('Nachname*', 'Last name*')}</span>
                <Input
                  value={draft.lastName ?? ''}
                  onChange={(event) => setDraft({ ...draft, lastName: event.target.value })}
                  aria-label={t('Nachname', 'Last name')}
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">{t('Tel-Nr.', 'Phone')}</span>
                <Input
                  type="tel"
                  value={draft.phone ?? ''}
                  onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                  aria-label={t('Tel-Nr.', 'Phone')}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">{t('Mobil-Nr.', 'Mobile')}</span>
                <Input
                  type="tel"
                  value={draft.mobile ?? ''}
                  onChange={(event) => setDraft({ ...draft, mobile: event.target.value })}
                  aria-label={t('Mobil-Nr.', 'Mobile')}
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
                <span className="text-sm font-medium">{t('Einrichtungen*', 'Care providers*')}</span>
                <select
                  value={draft.company}
                  onChange={(event) => setDraft({ ...draft, company: event.target.value })}
                  aria-label={t('Einrichtungen', 'Care providers')}
                  required
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">{t('Einrichtung auswählen', 'Select care provider')}</option>
                  {careProviders.map((careProvider) => <option key={careProvider.id} value={careProvider.name}>{careProvider.name}</option>)}
                  {!careProviders.some((careProvider) => careProvider.name === draft.company) && draft.company && <option value={draft.company}>{draft.company}</option>}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">{t('Rolle*', 'Role*')}</span>
                <select
                  value={draft.role}
                  onChange={(event) => setDraft({ ...draft, role: event.target.value as UserRole })}
                  aria-label={t('Rolle', 'Role')}
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
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>{t('Abbrechen', 'Cancel')}</Button>
            {dialog === 'password' ? (
              <Button type="button" onClick={() => {
                if (passwordDraft.length < 8) { setError(t('Das Passwort muss mindestens 8 Zeichen lang sein.', 'The password must be at least 8 characters long.')); return }
                setDialog(null)
              }}>{t('Speichern', 'Save')}</Button>
            ) : (
              <Button type="button" onClick={saveUser}>{dialog === 'create' ? t('Einladung versenden', 'Send invitation') : t('Speichern', 'Save')}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
