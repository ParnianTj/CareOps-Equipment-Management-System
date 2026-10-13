'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Ban,
  Building2,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Download,
  Filter,
  Pencil,
  Plus,
  Search,
  X,
  Trash2,
  UserRound,
} from 'lucide-react'
import { Panel } from './panel'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { stableDemoCount, type Organization } from '@/lib/dashboard-data'

type Row = { org: Organization; depth: number }
type OrganizationDialog = { kind: 'create' | 'edit' | 'owners'; orgId?: string } | null
type OrganizationForm = {
  name: string
  street: string
  zip: string
  city: string
  country: string
  parentId: string
  plan: 'BASIC' | 'PREMIUM'
  accountOwners: string[]
  centralPhone: string
  centralFax: string
  taxNumber: string
  taxRate: string
  openingHours: string
  openingDays: string[]
  managementCountries: string[]
  hasStore: boolean
}
type FilterColumn = 'Firmenname' | 'Account Besitzers' | 'Has Store' | 'Plan' | 'Status' | 'Aktion'
type FilterOperator = 'contains' | 'equals' | 'not-equals' | 'starts-with' | 'ends-with'

const storageKey = 'schlienz-organizations'
const weekdays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
const availableCountries = [
  'Deutschland',
  'Österreich',
  'Schweiz',
  'Italien',
  'Frankreich',
  'Niederlande',
  'Polen',
  'Tschechien',
]
const initialOrganizationForm: OrganizationForm = {
  name: '',
  street: '',
  zip: '',
  city: '',
  country: '',
  parentId: '',
  plan: 'BASIC',
  accountOwners: [],
  centralPhone: '',
  centralFax: '',
  taxNumber: '',
  taxRate: '0',
  openingHours: '',
  openingDays: [],
  managementCountries: [],
  hasStore: false,
}
const filterColumns: FilterColumn[] = [
  'Firmenname',
  'Account Besitzers',
  'Has Store',
  'Plan',
  'Status',
  'Aktion',
]

const filterOperators: { value: FilterOperator; label: string }[] = [
  { value: 'contains', label: 'contains' },
  { value: 'equals', label: 'equals' },
  { value: 'not-equals', label: 'does not equal' },
  { value: 'starts-with', label: 'starts with' },
  { value: 'ends-with', label: 'ends with' },
]

function getOrganizationField(org: Organization, column: FilterColumn, ownerExamples: string[]) {
  if (column === 'Firmenname') return org.name
  if (column === 'Account Besitzers') {
    if (org.accountOwners !== undefined) return org.accountOwners
    if (org.id === 'z-part-group') return 'Martin Fankhauser, Helmuth Großmayer, Stefan S...'
    if (org.id === 'schlienz') return 'Dominik Züger, Simon Liniger, Martin Fankhauser, Krinner Accounting'
    return ownerExamples[stableDemoCount(org.id, ownerExamples.length) - 1]
  }
  if (column === 'Has Store') {
    if (org.hasStore !== undefined) return org.hasStore ? 'YES' : 'NO'
    if (org.id === 'z-part-group' || org.id === 'schlienz') return 'NO'
    return stableDemoCount(`${org.id}-store`, 2) === 1 ? 'YES' : 'NO'
  }
  if (column === 'Plan') {
    if (org.plan) return org.plan
    return org.id === 'z-part-group'
      || org.id === 'schlienz'
      || stableDemoCount(`${org.id}-plan`, 5) === 1
      ? 'PREMIUM'
      : 'BASIC'
  }
  if (column === 'Status') return org.isActive ? 'Aktiv' : 'Inaktiv'
  if (org.isArchived) return 'Benutzer Bearbeiten Wiederherstellen Löschen'
  return 'Benutzer Bearbeiten Archivieren Löschen'
}

function matchesFilter(value: string, operator: FilterOperator, filterValue: string) {
  const normalizedValue = value.toLocaleLowerCase()
  const normalizedFilter = filterValue.trim().toLocaleLowerCase()
  if (!normalizedFilter) return true

  switch (operator) {
    case 'equals':
      return normalizedValue === normalizedFilter
    case 'not-equals':
      return normalizedValue !== normalizedFilter
    case 'starts-with':
      return normalizedValue.startsWith(normalizedFilter)
    case 'ends-with':
      return normalizedValue.endsWith(normalizedFilter)
    case 'contains':
      return normalizedValue.includes(normalizedFilter)
  }
}

function flatten(organizations: Organization[]): Row[] {
  const rows: Row[] = []
  const visit = (org: Organization, depth: number) => {
    const children = organizations.filter((item) => item.parentId === org.id)
    rows.push({ org, depth })
    children.forEach((child) => visit(child, depth + 1))
  }
  organizations.filter((org) => org.parentId === null).forEach((root) => visit(root, 0))
  return rows
}

export function OrganizationTree({
  organizations,
}: {
  organizations: Organization[]
}) {
  const [managedOrganizations, setManagedOrganizations] = useState(organizations)
  const [storageLoaded, setStorageLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [isSchlienzExpanded, setIsSchlienzExpanded] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterColumn, setFilterColumn] = useState<FilterColumn>('Firmenname')
  const [filterOperator, setFilterOperator] = useState<FilterOperator>('contains')
  const [filterValue, setFilterValue] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [dialog, setDialog] = useState<OrganizationDialog>(null)
  const [organizationForm, setOrganizationForm] = useState<OrganizationForm>(initialOrganizationForm)
  const [ownersDraft, setOwnersDraft] = useState('')
  const [ownerOptions, setOwnerOptions] = useState<string[]>([])
  const [newOwnerDraft, setNewOwnerDraft] = useState('')
  const [showAddOwner, setShowAddOwner] = useState(false)
  const [showOpeningDays, setShowOpeningDays] = useState(false)
  const [formError, setFormError] = useState('')
  const ownerExamples = [
    'Alois Huber',
    'Richard Otten, Caleb Alaimo, Evan Blackwell',
    'Martin Fankhauser, Dominik Züger, Simon Liniger',
    'Andreas Englmeier',
    'Krinner Accounting',
  ]

  useEffect(() => {
    const savedOwners = managedOrganizations.flatMap((org) =>
      (org.accountOwners ?? '').split(',').map((owner) => owner.trim()).filter(Boolean),
    )
    setOwnerOptions([...new Set([...ownerExamples, ...savedOwners])])
  }, [managedOrganizations])

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey)
      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        if (!Array.isArray(parsed) || !parsed.every((item) =>
          typeof item === 'object'
          && item !== null
          && typeof item.id === 'string'
          && typeof item.name === 'string'
          && (typeof item.parentId === 'string' || item.parentId === null),
        )) {
          throw new Error('Saved organization data has an invalid shape.')
        }
        setManagedOrganizations(parsed as Organization[])
      }
    } catch (error) {
      console.error('Could not load saved organizations from local storage.', error)
    } finally {
      setStorageLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!storageLoaded) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(managedOrganizations))
    } catch (error) {
      console.error('Could not save organizations to local storage.', error)
    }
  }, [managedOrganizations, storageLoaded])

  const selectedOrganization = dialog?.orgId
    ? managedOrganizations.find((organization) => organization.id === dialog.orgId)
    : undefined

  function openCreateDialog() {
    setOrganizationForm(initialOrganizationForm)
    setShowAddOwner(false)
    setShowOpeningDays(false)
    setFormError('')
    setDialog({ kind: 'create' })
  }

  function openEditDialog(org: Organization) {
    const owners = org.accountOwners === undefined
      ? getOrganizationField(org, 'Account Besitzers', ownerExamples).split(',').map((owner) => owner.trim()).filter(Boolean)
      : org.accountOwners.split(',').map((owner) => owner.trim()).filter(Boolean)
    setOrganizationForm({
      ...initialOrganizationForm,
      name: org.name,
      street: org.street ?? '',
      zip: org.zip ?? '',
      city: org.city ?? '',
      country: org.country ?? '',
      parentId: org.parentId ?? '',
      plan: org.plan ?? getOrganizationField(org, 'Plan', ownerExamples) as 'BASIC' | 'PREMIUM',
      accountOwners: owners,
      centralPhone: org.centralPhone ?? '',
      centralFax: org.centralFax ?? '',
      taxNumber: org.taxNumber ?? '',
      taxRate: org.taxRate === undefined ? '0' : String(org.taxRate),
      openingHours: org.openingHours ?? '',
      openingDays: org.openingDays ?? [],
      managementCountries: org.managementCountries ?? [],
      hasStore: org.hasStore ?? getOrganizationField(org, 'Has Store', ownerExamples) === 'YES',
    })
    setShowAddOwner(false)
    setShowOpeningDays(Boolean(org.openingDays?.length))
    setFormError('')
    setDialog({ kind: 'edit', orgId: org.id })
  }

  function openOwnersDialog(org: Organization) {
    setOwnersDraft(getOrganizationField(org, 'Account Besitzers', ownerExamples))
    setFormError('')
    setDialog({ kind: 'owners', orgId: org.id })
  }

  function canChooseAsParent(candidateId: string, editedId?: string) {
    if (!editedId) return true
    let currentId: string | null = candidateId
    while (currentId) {
      if (currentId === editedId) return false
      currentId = managedOrganizations.find((org) => org.id === currentId)?.parentId ?? null
    }
    return true
  }

  function saveOrganization() {
    const trimmedName = organizationForm.name.trim()
    const requiredFields: [string, string][] = [
      ['street', organizationForm.street],
      ['zip', organizationForm.zip],
      ['city', organizationForm.city],
      ['country', organizationForm.country],
    ]
    if (!trimmedName) {
      setFormError('Bitte alle Pflichtfelder ausfüllen.')
      return
    }
    if (requiredFields.some(([, value]) => !value.trim()) || organizationForm.accountOwners.length === 0) {
      setFormError('Bitte alle Pflichtfelder ausfüllen und mindestens einen Account-Besitzer auswählen.')
      return
    }
    const taxRate = Number(organizationForm.taxRate)
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
      setFormError('Der Steuersatz muss zwischen 0 und 100 liegen.')
      return
    }
    const editedId = dialog?.kind === 'edit' ? dialog.orgId : undefined
    if (managedOrganizations.some((org) => org.id !== editedId && org.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase())) {
      setFormError('Eine Organisation mit diesem Namen existiert bereits.')
      return
    }
    if (editedId) {
      if (organizationForm.parentId === editedId) {
        setFormError('Eine Organisation kann nicht ihr eigener übergeordneter Eintrag sein.')
        return
      }
      const descendants = new Set<string>()
      let pending = [editedId]
      while (pending.length) {
        const parentId = pending.pop()!
        const children = managedOrganizations.filter((org) => org.parentId === parentId)
        children.forEach((child) => {
          descendants.add(child.id)
          pending.push(child.id)
        })
      }
      if (organizationForm.parentId && descendants.has(organizationForm.parentId)) {
        setFormError('Eine Organisation kann nicht unter einem ihrer Unterbereiche verschoben werden.')
        return
      }
      setManagedOrganizations((current) => current.map((org) => org.id === editedId
        ? {
            ...org,
            name: trimmedName,
            parentId: organizationForm.parentId || null,
            street: organizationForm.street.trim(),
            zip: organizationForm.zip.trim(),
            city: organizationForm.city.trim(),
            country: organizationForm.country,
            accountOwners: organizationForm.accountOwners.join(', '),
            centralPhone: organizationForm.centralPhone.trim(),
            centralFax: organizationForm.centralFax.trim(),
            taxNumber: organizationForm.taxNumber.trim(),
            taxRate,
            openingHours: organizationForm.openingHours.trim(),
            openingDays: organizationForm.openingDays,
            managementCountries: organizationForm.managementCountries,
            hasStore: organizationForm.hasStore,
            plan: organizationForm.plan,
          }
        : org))
    } else {
      const id = `org-${crypto.randomUUID()}`
      setManagedOrganizations((current) => [
        ...current,
        {
          id,
          name: trimmedName,
          parentId: organizationForm.parentId || null,
          createdAt: new Date().toISOString().slice(0, 10),
          street: organizationForm.street.trim(),
          zip: organizationForm.zip.trim(),
          city: organizationForm.city.trim(),
          country: organizationForm.country,
          accountOwners: organizationForm.accountOwners.join(', '),
          centralPhone: organizationForm.centralPhone.trim(),
          centralFax: organizationForm.centralFax.trim(),
          taxNumber: organizationForm.taxNumber.trim(),
          taxRate,
          openingHours: organizationForm.openingHours.trim(),
          openingDays: organizationForm.openingDays,
          managementCountries: organizationForm.managementCountries,
          hasStore: organizationForm.hasStore,
          plan: organizationForm.plan,
          isActive: false,
          isArchived: false,
        },
      ])
    }
    setDialog(null)
  }

  function addAccountOwner() {
    const owner = newOwnerDraft.trim()
    if (!owner) {
      setFormError('Bitte einen Benutzernamen eingeben.')
      return
    }
    setOwnerOptions((current) => current.includes(owner) ? current : [...current, owner])
    setOrganizationForm((current) => ({
      ...current,
      accountOwners: current.accountOwners.includes(owner)
        ? current.accountOwners
        : [...current.accountOwners, owner],
    }))
    setNewOwnerDraft('')
    setShowAddOwner(false)
    setFormError('')
  }

  function saveOwners() {
    if (!selectedOrganization) return
    setManagedOrganizations((current) => current.map((org) => org.id === selectedOrganization.id
      ? { ...org, accountOwners: ownersDraft.trim() }
      : org))
    setDialog(null)
  }

  function deleteOrganization(org: Organization) {
    const deletedIds = new Set([org.id])
    let foundChild = true
    while (foundChild) {
      foundChild = false
      managedOrganizations.forEach((item) => {
        if (item.parentId && deletedIds.has(item.parentId) && !deletedIds.has(item.id)) {
          deletedIds.add(item.id)
          foundChild = true
        }
      })
    }
    const message = deletedIds.size > 1
      ? `„${org.name}“ und ${deletedIds.size - 1} Unterorganisation(en) wirklich löschen?`
      : `„${org.name}“ wirklich löschen?`
    if (!window.confirm(message)) return
    setManagedOrganizations((current) => current.filter((item) => !deletedIds.has(item.id)))
  }

  function exportOrganizations() {
    const headers = ['Firmenname', 'Account Besitzers', 'Has Store', 'Plan', 'Status', 'Übergeordnet']
    const csvRows = rows.map(({ org }) => [
      org.name,
      getOrganizationField(org, 'Account Besitzers', ownerExamples),
      getOrganizationField(org, 'Has Store', ownerExamples),
      getOrganizationField(org, 'Plan', ownerExamples),
      org.isArchived ? 'Archiviert' : org.isActive ? 'Aktiv' : 'Inaktiv',
      managedOrganizations.find((item) => item.id === org.parentId)?.name ?? '',
    ])
    const csv = [headers, ...csvRows]
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
      .join('\r\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'organisationen.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const rows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    const matchingIds = new Set(
      managedOrganizations
        .filter((org) => {
          if (org.isArchived && !showArchived) return false
          const matchesSearch = !query || org.name.toLocaleLowerCase().includes(query)
          const matchesColumnFilter = matchesFilter(
            getOrganizationField(org, filterColumn, ownerExamples),
            filterOperator,
            filterValue,
          )
          return matchesSearch && matchesColumnFilter
        })
        .map((org) => org.id),
    )
    const visibleIds = new Set(matchingIds)
    matchingIds.forEach((id) => {
      let parent = managedOrganizations.find((item) => item.id === id)?.parentId
      while (parent) {
        visibleIds.add(parent)
        parent = managedOrganizations.find((item) => item.id === parent)?.parentId
      }
    })
    const hasActiveFilter = filterValue.trim().length > 0
    const visibleOrganizations = query || hasActiveFilter || !showArchived
      ? managedOrganizations.filter((org) => visibleIds.has(org.id) || (!org.isArchived && !query && !hasActiveFilter))
      : managedOrganizations
    const shouldShowChildren = isSchlienzExpanded || query.length > 0 || hasActiveFilter
    const visibleRows = flatten(visibleOrganizations)
    return visibleRows.filter(({ org }) => {
      if (org.parentId !== 'schlienz-group') return true
      return shouldShowChildren
    })
  }, [managedOrganizations, search, isSchlienzExpanded, filterColumn, filterOperator, filterValue, showArchived])

  return (
    <Panel title="Organisationen" description="Organisationen, Zuständigkeiten und Mitglieder im Überblick">
      <div>
        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:flex-nowrap lg:items-center lg:gap-5">
          <div className="flex shrink-0 items-center gap-4">
            <button
              type="button"
              aria-expanded={filterOpen}
              aria-controls="organization-filters"
              onClick={() => setFilterOpen((open) => !open)}
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground/90 transition-colors hover:text-foreground"
            >
              <Filter className="size-4" aria-hidden="true" />
              Filter
            </button>
            <button
              type="button"
              onClick={exportOrganizations}
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground/90 transition-colors hover:text-foreground"
            >
              <Download className="size-4" aria-hidden="true" />
              Export
            </button>
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center lg:flex-1 lg:justify-end">
            <label className="relative block min-w-0 sm:min-w-[220px] lg:w-[min(28vw,325px)]">
              <span className="sr-only">Organisationen durchsuchen</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Suche nach Organisationsname"
                className="h-10 pl-9"
              />
            </label>
            <label className="flex shrink-0 items-center gap-2 text-sm text-foreground/80">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(event) => setShowArchived(event.target.checked)}
                className="h-4 w-4 rounded border-input bg-background"
              />
              Archivierte Organisationen anzeigen
            </label>
            <Button
              type="button"
              onClick={openCreateDialog}
              className="h-10 shrink-0 gap-2 rounded-xl px-4 font-semibold shadow-sm"
            >
              <Plus className="size-4" aria-hidden="true" />
              Organisation erstellen
            </Button>
          </div>
        </div>

        {filterOpen && (
          <div id="organization-filters" className="mx-4 mb-4 rounded-lg border border-border bg-background p-3 sm:mx-5">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <button
                type="button"
                aria-label="Filter entfernen"
                title="Filter entfernen"
                onClick={() => {
                  setFilterValue('')
                  setFilterOpen(false)
                }}
                className="flex size-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
              <label className="min-w-0">
                <span className="mb-1 block text-xs text-muted-foreground">Columns</span>
                <select
                  value={filterColumn}
                  onChange={(event) => setFilterColumn(event.target.value as FilterColumn)}
                  aria-label="Filter column"
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  {filterColumns.map((column) => <option key={column} value={column}>{column}</option>)}
                </select>
              </label>
              <label className="min-w-0">
                <span className="mb-1 block text-xs text-muted-foreground">Operator</span>
                <select
                  value={filterOperator}
                  onChange={(event) => setFilterOperator(event.target.value as FilterOperator)}
                  aria-label="Filter operator"
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  {filterOperators.map((operator) => (
                    <option key={operator.value} value={operator.value}>{operator.label}</option>
                  ))}
                </select>
              </label>
              <label className="min-w-0">
                <span className="mb-1 block text-xs text-muted-foreground">Value</span>
                <Input
                  value={filterValue}
                  onChange={(event) => setFilterValue(event.target.value)}
                  placeholder="Filter value"
                  aria-label="Filter value"
                  className="h-9"
                />
              </label>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full table-fixed text-[10px] sm:text-xs lg:text-sm">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[18%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead>
              <tr className="border-y border-border bg-muted/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="break-words px-2 py-3">Firmenname</th>
                <th scope="col" className="break-words px-2 py-3">Account Besitzers</th>
                <th scope="col" className="break-words px-2 py-3">Has Store</th>
                <th scope="col" className="break-words px-2 py-3">Plan</th>
                <th scope="col" className="break-words px-2 py-3">Status</th>
                <th scope="col" className="break-words px-2 py-3">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ org, depth }) => {
                const accountOwner = getOrganizationField(org, 'Account Besitzers', ownerExamples)
                const hasStore = getOrganizationField(org, 'Has Store', ownerExamples)
                const plan = getOrganizationField(org, 'Plan', ownerExamples)
                const isArchived = Boolean(org.isArchived)

                return (
                  <tr
                    key={org.id}
                    className={`border-b border-border last:border-0 transition-colors hover:bg-muted/50 ${
                      org.id === 'schlienz-group' ? 'bg-muted/40' : ''
                    }`}
                  >
                    <td className="break-words px-2 py-3">
                      <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 1.25}rem` }}>
                        {org.id === 'schlienz-group' ? (
                          <button
                            type="button"
                            onClick={() => setIsSchlienzExpanded((expanded) => !expanded)}
                            aria-expanded={isSchlienzExpanded || search.trim().length > 0}
                            aria-label={`${isSchlienzExpanded ? 'Schlienz-Gruppe einklappen' : 'Schlienz-Gruppe ausklappen'}`}
                            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            {isSchlienzExpanded || search.trim().length > 0 ? (
                              <ChevronDown className="size-4" aria-hidden="true" />
                            ) : (
                              <ChevronRight className="size-4" aria-hidden="true" />
                            )}
                          </button>
                        ) : depth > 0 ? (
                          <CornerDownRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        ) : (
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <Building2 className="size-3.5" aria-hidden="true" />
                          </span>
                        )}
                        <span className={`break-words ${org.id === 'schlienz-group' || depth === 0 ? 'font-semibold' : 'font-medium'}`}>
                          {org.name}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-0 truncate px-2 py-3 text-muted-foreground" title={accountOwner}>{accountOwner}</td>
                    <td className="px-2 py-3 text-muted-foreground">{hasStore}</td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-flex rounded-sm px-1.5 py-0.5 font-medium text-white ${
                          plan === 'PREMIUM' ? 'bg-amber-500' : 'bg-slate-500'
                        }`}
                      >
                        {plan}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        onClick={() => setManagedOrganizations((current) => current.map((item) =>
                          item.id === org.id ? { ...item, isActive: !item.isActive } : item,
                        ))}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {org.isActive ? 'Deaktivieren' : 'Aktivieren'}
                      </button>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openOwnersDialog(org)}
                          aria-label={`Benutzer für ${org.name}`}
                          title="Benutzer verwalten"
                          className="text-primary hover:text-primary/80"
                        >
                          <UserRound className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditDialog(org)}
                          aria-label={`${org.name} bearbeiten`}
                          title="Bearbeiten"
                          className="text-primary hover:text-primary/80"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setManagedOrganizations((current) => current.map((item) =>
                            item.id === org.id ? { ...item, isArchived: !item.isArchived } : item,
                          ))}
                          aria-label={`${org.name} ${isArchived ? 'wiederherstellen' : 'archivieren'}`}
                          title={isArchived ? 'Wiederherstellen' : 'Archivieren'}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Ban className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteOrganization(org)}
                          aria-label={`${org.name} löschen`}
                          title="Löschen"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open) setDialog(null) }}>
        <DialogContent className="max-h-[90vh] gap-5 overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === 'create'
                ? 'Organisation erstellen'
                : dialog?.kind === 'edit'
                  ? 'Organisation bearbeiten'
                  : 'Account-Besitzer verwalten'}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'owners'
                ? `Account-Besitzer für ${selectedOrganization?.name ?? 'Organisation'} bearbeiten.`
                : 'Organisationsdaten bearbeiten. Änderungen werden lokal in diesem Browser gespeichert.'}
            </DialogDescription>
          </DialogHeader>

          {dialog?.kind === 'owners' ? (
            <label className="grid gap-2">
              <span className="text-sm font-medium">Account-Besitzer</span>
              <textarea
                value={ownersDraft}
                onChange={(event) => setOwnersDraft(event.target.value)}
                placeholder="Namen durch Kommas trennen"
                rows={4}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-medium">Firmenname*</span>
                <Input
                  autoFocus
                  value={organizationForm.name}
                  onChange={(event) => setOrganizationForm((current) => ({ ...current, name: event.target.value }))}
                  aria-label="Firmenname"
                  required
                />
              </label>
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-medium">Straße*</span>
                <Input
                  value={organizationForm.street}
                  onChange={(event) => setOrganizationForm((current) => ({ ...current, street: event.target.value }))}
                  aria-label="Straße"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Postleitzahl*</span>
                <Input
                  value={organizationForm.zip}
                  onChange={(event) => setOrganizationForm((current) => ({ ...current, zip: event.target.value }))}
                  aria-label="Postleitzahl"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Stadt*</span>
                <Input
                  value={organizationForm.city}
                  onChange={(event) => setOrganizationForm((current) => ({ ...current, city: event.target.value }))}
                  aria-label="Stadt"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Land*</span>
                <select
                  value={organizationForm.country}
                  onChange={(event) => setOrganizationForm((current) => ({ ...current, country: event.target.value }))}
                  aria-label="Land"
                  required
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Land auswählen</option>
                  {availableCountries.map((country) => <option key={country} value={country}>{country}</option>)}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Plan*</span>
                <select
                  value={organizationForm.plan}
                  onChange={(event) => setOrganizationForm((current) => ({ ...current, plan: event.target.value as 'BASIC' | 'PREMIUM' }))}
                  aria-label="Plan"
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="BASIC">BASIC</option>
                  <option value="PREMIUM">PREMIUM</option>
                </select>
              </label>
              <div className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-medium">Account Besitzers*</span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value=""
                    aria-label="Account-Besitzer auswählen"
                    onChange={(event) => {
                      const owner = event.target.value
                      if (!owner) return
                      setOrganizationForm((current) => ({
                        ...current,
                        accountOwners: current.accountOwners.includes(owner)
                          ? current.accountOwners
                          : [...current.accountOwners, owner],
                      }))
                    }}
                    className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Account-Besitzer auswählen</option>
                    {ownerOptions.map((owner) => (
                      <option key={owner} value={owner} disabled={organizationForm.accountOwners.includes(owner)}>{owner}</option>
                    ))}
                  </select>
                  <Button type="button" className="h-10 gap-2" onClick={() => { setShowAddOwner((show) => !show); setFormError('') }}>
                    <Plus className="size-4" aria-hidden="true" />
                    Benutzer hinzufügen
                  </Button>
                </div>
                {organizationForm.accountOwners.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {organizationForm.accountOwners.map((owner) => (
                      <span key={owner} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                        {owner}
                        <button
                          type="button"
                          aria-label={`${owner} entfernen`}
                          onClick={() => setOrganizationForm((current) => ({
                            ...current,
                            accountOwners: current.accountOwners.filter((item) => item !== owner),
                          }))}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-3" aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {showAddOwner && (
                  <div className="flex gap-2">
                    <Input
                      value={newOwnerDraft}
                      onChange={(event) => setNewOwnerDraft(event.target.value)}
                      aria-label="Neuer Benutzername"
                      placeholder="Benutzername"
                    />
                    <Button type="button" variant="outline" onClick={addAccountOwner}>Hinzufügen</Button>
                  </div>
                )}
              </div>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Zentrale Telefon-Nr</span>
                <Input
                  type="tel"
                  value={organizationForm.centralPhone}
                  onChange={(event) => setOrganizationForm((current) => ({ ...current, centralPhone: event.target.value }))}
                  aria-label="Zentrale Telefon-Nr"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Zentrales Fax</span>
                <Input
                  type="tel"
                  value={organizationForm.centralFax}
                  onChange={(event) => setOrganizationForm((current) => ({ ...current, centralFax: event.target.value }))}
                  aria-label="Zentrales Fax"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Steuer-Nr</span>
                <Input
                  value={organizationForm.taxNumber}
                  onChange={(event) => setOrganizationForm((current) => ({ ...current, taxNumber: event.target.value }))}
                  aria-label="Steuer-Nr"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Steuersatz</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={organizationForm.taxRate}
                  onChange={(event) => setOrganizationForm((current) => ({ ...current, taxRate: event.target.value }))}
                  aria-label="Steuersatz"
                />
              </label>
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-medium">Öffnungszeiten (optional)</span>
                <Input
                  value={organizationForm.openingHours}
                  onChange={(event) => setOrganizationForm((current) => ({ ...current, openingHours: event.target.value }))}
                  aria-label="Öffnungszeiten"
                />
              </label>
              <div className="sm:col-span-2">
                <Button type="button" onClick={() => setShowOpeningDays((show) => !show)}>
                  Öffnungstage verwalten
                </Button>
                {showOpeningDays && (
                  <fieldset className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-border p-3 sm:grid-cols-4">
                    <legend className="px-1 text-xs text-muted-foreground">Öffnungstage</legend>
                    {weekdays.map((day) => (
                      <label key={day} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={organizationForm.openingDays.includes(day)}
                          onChange={(event) => setOrganizationForm((current) => ({
                            ...current,
                            openingDays: event.target.checked
                              ? [...current.openingDays, day]
                              : current.openingDays.filter((item) => item !== day),
                          }))}
                          className="h-4 w-4 rounded border-input"
                        />
                        {day}
                      </label>
                    ))}
                  </fieldset>
                )}
              </div>
              <fieldset className="grid gap-2 sm:col-span-2">
                <legend className="text-sm font-medium">Länder in der Verwaltung</legend>
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3 sm:grid-cols-4">
                  {availableCountries.map((country) => (
                    <label key={country} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={organizationForm.managementCountries.includes(country)}
                        onChange={(event) => setOrganizationForm((current) => ({
                          ...current,
                          managementCountries: event.target.checked
                            ? [...current.managementCountries, country]
                            : current.managementCountries.filter((item) => item !== country),
                        }))}
                        className="h-4 w-4 rounded border-input"
                      />
                      {country}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={organizationForm.hasStore}
                  onChange={(event) => setOrganizationForm((current) => ({ ...current, hasStore: event.target.checked }))}
                  className="h-4 w-4 rounded border-input"
                />
                Has Store
              </label>
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-medium">Übergeordnete Organisation</span>
                <select
                  value={organizationForm.parentId}
                  onChange={(event) => setOrganizationForm((current) => ({ ...current, parentId: event.target.value }))}
                  aria-label="Übergeordnete Organisation"
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Keine</option>
                  {managedOrganizations
                    .filter((org) => !org.isArchived && canChooseAsParent(org.id, dialog?.orgId))
                    .map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
                </select>
              </label>
            </div>
          )}

          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>Abbrechen</Button>
            <Button
              type="button"
              onClick={dialog?.kind === 'owners' ? saveOwners : saveOrganization}
            >
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  )
}
