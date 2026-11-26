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
import { countryLabelsEn, stableDemoCount, weekdayLabelsEn, type CareProvider } from '@/lib/dashboard-data'
import { useT } from '@/components/app-shell'

type Row = { careProvider: CareProvider; depth: number }
type CareProviderDialog = { kind: 'create' | 'edit' | 'owners'; careProviderId?: string } | null
type CareProviderForm = {
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

const storageKey = 'careops-care-providers'
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
const initialCareProviderForm: CareProviderForm = {
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

const filterOperators: { value: FilterOperator; label: string; labelEn: string }[] = [
  { value: 'contains', label: 'enthält', labelEn: 'contains' },
  { value: 'equals', label: 'ist gleich', labelEn: 'equals' },
  { value: 'not-equals', label: 'ist ungleich', labelEn: 'does not equal' },
  { value: 'starts-with', label: 'beginnt mit', labelEn: 'starts with' },
  { value: 'ends-with', label: 'endet mit', labelEn: 'ends with' },
]

type Translate = (de: string, en: string) => string

// Display names for the filter columns (the column keys themselves are internal values).
const columnLabels: Record<FilterColumn, [string, string]> = {
  Firmenname: ['Firmenname', 'Company name'],
  'Account Besitzers': ['Account-Besitzer', 'Account owners'],
  'Has Store': ['Shop vorhanden', 'Has store'],
  Plan: ['Plan', 'Plan'],
  Status: ['Status', 'Status'],
  Aktion: ['Aktion', 'Action'],
}

// Translates the internal field values returned by getCareProviderField for display and filtering.
function translateFieldValue(value: string, t: Translate) {
  switch (value) {
    case 'YES': return t('Ja', 'Yes')
    case 'NO': return t('Nein', 'No')
    case 'Aktiv': return t('Aktiv', 'Active')
    case 'Inaktiv': return t('Inaktiv', 'Inactive')
    case 'Benutzer Bearbeiten Wiederherstellen Löschen': return t(value, 'Users Edit Restore Delete')
    case 'Benutzer Bearbeiten Archivieren Löschen': return t(value, 'Users Edit Archive Delete')
    default: return value
  }
}

const ownerExamples = [
  'Anna Huber',
  'Ralf Otto, Clara Albers, Erik Brandt',
  'Jonas Keller, Alex Berger, Lea Brunner',
  'Andrea Engel',
  'CareOps Accounting',
]

function getCareProviderField(careProvider: CareProvider, column: FilterColumn, ownerExamples: string[]) {
  if (column === 'Firmenname') return careProvider.name
  if (column === 'Account Besitzers') {
    if (careProvider.accountOwners !== undefined) return careProvider.accountOwners
    if (careProvider.id === 'careops-group') return 'Jonas Keller, Miriam Vogt, Tobias S...'
    if (careProvider.id === 'careops-clinic-central') return 'Alex Berger, Lea Brunner, Jonas Keller, CareOps Accounting'
    return ownerExamples[stableDemoCount(careProvider.id, ownerExamples.length) - 1]
  }
  if (column === 'Has Store') {
    if (careProvider.hasStore !== undefined) return careProvider.hasStore ? 'YES' : 'NO'
    if (careProvider.id === 'careops-group' || careProvider.id === 'careops-clinic-central') return 'NO'
    return stableDemoCount(`${careProvider.id}-store`, 2) === 1 ? 'YES' : 'NO'
  }
  if (column === 'Plan') {
    if (careProvider.plan) return careProvider.plan
    return careProvider.id === 'careops-group'
      || careProvider.id === 'careops-clinic-central'
      || stableDemoCount(`${careProvider.id}-plan`, 5) === 1
      ? 'PREMIUM'
      : 'BASIC'
  }
  if (column === 'Status') return careProvider.isActive ? 'Aktiv' : 'Inaktiv'
  if (careProvider.isArchived) return 'Benutzer Bearbeiten Wiederherstellen Löschen'
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

function flatten(careProviders: CareProvider[]): Row[] {
  const rows: Row[] = []
  const visit = (careProvider: CareProvider, depth: number) => {
    const children = careProviders.filter((item) => item.parentId === careProvider.id)
    rows.push({ careProvider, depth })
    children.forEach((child) => visit(child, depth + 1))
  }
  careProviders.filter((careProvider) => careProvider.parentId === null).forEach((root) => visit(root, 0))
  return rows
}

export function CareProviderTree({
  careProviders,
}: {
  careProviders: CareProvider[]
}) {
  const t = useT()
  const [managedCareProviders, setManagedCareProviders] = useState(careProviders)
  const [storageLoaded, setStorageLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [isCareOpsExpanded, setIsCareOpsExpanded] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterColumn, setFilterColumn] = useState<FilterColumn>('Firmenname')
  const [filterOperator, setFilterOperator] = useState<FilterOperator>('contains')
  const [filterValue, setFilterValue] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [dialog, setDialog] = useState<CareProviderDialog>(null)
  const [careProviderForm, setCareProviderForm] = useState<CareProviderForm>(initialCareProviderForm)
  const [ownersDraft, setOwnersDraft] = useState('')
  const [addedOwners, setAddedOwners] = useState<string[]>([])
  const [newOwnerDraft, setNewOwnerDraft] = useState('')
  const [showAddOwner, setShowAddOwner] = useState(false)
  const [showOpeningDays, setShowOpeningDays] = useState(false)
  const [formError, setFormError] = useState('')
  const ownerOptions = useMemo(() => {
    const savedOwners = managedCareProviders.flatMap((careProvider) =>
      (careProvider.accountOwners ?? '').split(',').map((owner) => owner.trim()).filter(Boolean),
    )
    return [...new Set([...ownerExamples, ...savedOwners, ...addedOwners])]
  }, [managedCareProviders, addedOwners])

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
          throw new Error('Saved care provider data has an invalid shape.')
        }
        // localStorage only exists in the browser, so saved data can only be loaded after hydration
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setManagedCareProviders(parsed as CareProvider[])
      }
    } catch (error) {
      console.error('Could not load saved care providers from local storage.', error)
    } finally {
      setStorageLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!storageLoaded) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(managedCareProviders))
    } catch (error) {
      console.error('Could not save care providers to local storage.', error)
    }
  }, [managedCareProviders, storageLoaded])

  const selectedCareProvider = dialog?.careProviderId
    ? managedCareProviders.find((careProvider) => careProvider.id === dialog.careProviderId)
    : undefined

  function openCreateDialog() {
    setCareProviderForm(initialCareProviderForm)
    setShowAddOwner(false)
    setShowOpeningDays(false)
    setFormError('')
    setDialog({ kind: 'create' })
  }

  function openEditDialog(careProvider: CareProvider) {
    const owners = careProvider.accountOwners === undefined
      ? getCareProviderField(careProvider, 'Account Besitzers', ownerExamples).split(',').map((owner) => owner.trim()).filter(Boolean)
      : careProvider.accountOwners.split(',').map((owner) => owner.trim()).filter(Boolean)
    setCareProviderForm({
      ...initialCareProviderForm,
      name: careProvider.name,
      street: careProvider.street ?? '',
      zip: careProvider.zip ?? '',
      city: careProvider.city ?? '',
      country: careProvider.country ?? '',
      parentId: careProvider.parentId ?? '',
      plan: careProvider.plan ?? getCareProviderField(careProvider, 'Plan', ownerExamples) as 'BASIC' | 'PREMIUM',
      accountOwners: owners,
      centralPhone: careProvider.centralPhone ?? '',
      centralFax: careProvider.centralFax ?? '',
      taxNumber: careProvider.taxNumber ?? '',
      taxRate: careProvider.taxRate === undefined ? '0' : String(careProvider.taxRate),
      openingHours: careProvider.openingHours ?? '',
      openingDays: careProvider.openingDays ?? [],
      managementCountries: careProvider.managementCountries ?? [],
      hasStore: careProvider.hasStore ?? getCareProviderField(careProvider, 'Has Store', ownerExamples) === 'YES',
    })
    setShowAddOwner(false)
    setShowOpeningDays(Boolean(careProvider.openingDays?.length))
    setFormError('')
    setDialog({ kind: 'edit', careProviderId: careProvider.id })
  }

  function openOwnersDialog(careProvider: CareProvider) {
    setOwnersDraft(getCareProviderField(careProvider, 'Account Besitzers', ownerExamples))
    setFormError('')
    setDialog({ kind: 'owners', careProviderId: careProvider.id })
  }

  function canChooseAsParent(candidateId: string, editedId?: string) {
    if (!editedId) return true
    let currentId: string | null = candidateId
    while (currentId) {
      if (currentId === editedId) return false
      currentId = managedCareProviders.find((careProvider) => careProvider.id === currentId)?.parentId ?? null
    }
    return true
  }

  function saveCareProvider() {
    const trimmedName = careProviderForm.name.trim()
    const requiredFields: [string, string][] = [
      ['street', careProviderForm.street],
      ['zip', careProviderForm.zip],
      ['city', careProviderForm.city],
      ['country', careProviderForm.country],
    ]
    if (!trimmedName) {
      setFormError(t('Bitte alle Pflichtfelder ausfüllen.', 'Please fill in all required fields.'))
      return
    }
    if (requiredFields.some(([, value]) => !value.trim()) || careProviderForm.accountOwners.length === 0) {
      setFormError(t('Bitte alle Pflichtfelder ausfüllen und mindestens einen Account-Besitzer auswählen.', 'Please fill in all required fields and select at least one account owner.'))
      return
    }
    const taxRate = Number(careProviderForm.taxRate)
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
      setFormError(t('Der Steuersatz muss zwischen 0 und 100 liegen.', 'The tax rate must be between 0 and 100.'))
      return
    }
    const editedId = dialog?.kind === 'edit' ? dialog.careProviderId : undefined
    if (managedCareProviders.some((careProvider) => careProvider.id !== editedId && careProvider.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase())) {
      setFormError(t('Eine Einrichtung mit diesem Namen existiert bereits.', 'A care provider with this name already exists.'))
      return
    }
    if (editedId) {
      if (careProviderForm.parentId === editedId) {
        setFormError(t('Eine Einrichtung kann nicht ihr eigener übergeordneter Eintrag sein.', 'A care provider cannot be its own parent.'))
        return
      }
      const descendants = new Set<string>()
      const pending = [editedId]
      while (pending.length) {
        const parentId = pending.pop()!
        const children = managedCareProviders.filter((careProvider) => careProvider.parentId === parentId)
        children.forEach((child) => {
          descendants.add(child.id)
          pending.push(child.id)
        })
      }
      if (careProviderForm.parentId && descendants.has(careProviderForm.parentId)) {
        setFormError(t('Eine Einrichtung kann nicht unter einem ihrer Unterbereiche verschoben werden.', 'A care provider cannot be moved under one of its own sub-units.'))
        return
      }
      setManagedCareProviders((current) => current.map((careProvider) => careProvider.id === editedId
        ? {
            ...careProvider,
            name: trimmedName,
            parentId: careProviderForm.parentId || null,
            street: careProviderForm.street.trim(),
            zip: careProviderForm.zip.trim(),
            city: careProviderForm.city.trim(),
            country: careProviderForm.country,
            accountOwners: careProviderForm.accountOwners.join(', '),
            centralPhone: careProviderForm.centralPhone.trim(),
            centralFax: careProviderForm.centralFax.trim(),
            taxNumber: careProviderForm.taxNumber.trim(),
            taxRate,
            openingHours: careProviderForm.openingHours.trim(),
            openingDays: careProviderForm.openingDays,
            managementCountries: careProviderForm.managementCountries,
            hasStore: careProviderForm.hasStore,
            plan: careProviderForm.plan,
          }
        : careProvider))
    } else {
      const id = `care-provider-${crypto.randomUUID()}`
      setManagedCareProviders((current) => [
        ...current,
        {
          id,
          name: trimmedName,
          parentId: careProviderForm.parentId || null,
          createdAt: new Date().toISOString().slice(0, 10),
          street: careProviderForm.street.trim(),
          zip: careProviderForm.zip.trim(),
          city: careProviderForm.city.trim(),
          country: careProviderForm.country,
          accountOwners: careProviderForm.accountOwners.join(', '),
          centralPhone: careProviderForm.centralPhone.trim(),
          centralFax: careProviderForm.centralFax.trim(),
          taxNumber: careProviderForm.taxNumber.trim(),
          taxRate,
          openingHours: careProviderForm.openingHours.trim(),
          openingDays: careProviderForm.openingDays,
          managementCountries: careProviderForm.managementCountries,
          hasStore: careProviderForm.hasStore,
          plan: careProviderForm.plan,
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
      setFormError(t('Bitte einen Benutzernamen eingeben.', 'Please enter a user name.'))
      return
    }
    setAddedOwners((current) => current.includes(owner) ? current : [...current, owner])
    setCareProviderForm((current) => ({
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
    if (!selectedCareProvider) return
    setManagedCareProviders((current) => current.map((careProvider) => careProvider.id === selectedCareProvider.id
      ? { ...careProvider, accountOwners: ownersDraft.trim() }
      : careProvider))
    setDialog(null)
  }

  function deleteCareProvider(careProvider: CareProvider) {
    const deletedIds = new Set([careProvider.id])
    let foundChild = true
    while (foundChild) {
      foundChild = false
      managedCareProviders.forEach((item) => {
        if (item.parentId && deletedIds.has(item.parentId) && !deletedIds.has(item.id)) {
          deletedIds.add(item.id)
          foundChild = true
        }
      })
    }
    const message = deletedIds.size > 1
      ? t(`„${careProvider.name}“ und ${deletedIds.size - 1} Untereinrichtung(en) wirklich löschen?`, `Really delete "${careProvider.name}" and ${deletedIds.size - 1} sub-unit(s)?`)
      : t(`„${careProvider.name}“ wirklich löschen?`, `Really delete "${careProvider.name}"?`)
    if (!window.confirm(message)) return
    setManagedCareProviders((current) => current.filter((item) => !deletedIds.has(item.id)))
  }

  const rows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    const matchingIds = new Set(
      managedCareProviders
        .filter((careProvider) => {
          if (careProvider.isArchived && !showArchived) return false
          const matchesSearch = !query || careProvider.name.toLocaleLowerCase().includes(query)
          const matchesColumnFilter = matchesFilter(
            translateFieldValue(getCareProviderField(careProvider, filterColumn, ownerExamples), t),
            filterOperator,
            filterValue,
          )
          return matchesSearch && matchesColumnFilter
        })
        .map((careProvider) => careProvider.id),
    )
    const visibleIds = new Set(matchingIds)
    matchingIds.forEach((id) => {
      let parent = managedCareProviders.find((item) => item.id === id)?.parentId
      while (parent) {
        visibleIds.add(parent)
        parent = managedCareProviders.find((item) => item.id === parent)?.parentId
      }
    })
    const hasActiveFilter = filterValue.trim().length > 0
    const visibleCareProviders = query || hasActiveFilter || !showArchived
      ? managedCareProviders.filter((careProvider) => visibleIds.has(careProvider.id) || (!careProvider.isArchived && !query && !hasActiveFilter))
      : managedCareProviders
    const shouldShowChildren = isCareOpsExpanded || query.length > 0 || hasActiveFilter
    const visibleRows = flatten(visibleCareProviders)
    return visibleRows.filter(({ careProvider }) => {
      if (careProvider.parentId !== 'careops-clinics') return true
      return shouldShowChildren
    })
  }, [managedCareProviders, search, isCareOpsExpanded, filterColumn, filterOperator, filterValue, showArchived, t])

  function exportCareProviders() {
    const headers = [t('Firmenname', 'Company name'), t('Account-Besitzer', 'Account owners'), t('Shop vorhanden', 'Has store'), 'Plan', 'Status', t('Übergeordnet', 'Parent')]
    const csvRows = rows.map(({ careProvider }) => [
      careProvider.name,
      getCareProviderField(careProvider, 'Account Besitzers', ownerExamples),
      translateFieldValue(getCareProviderField(careProvider, 'Has Store', ownerExamples), t),
      getCareProviderField(careProvider, 'Plan', ownerExamples),
      careProvider.isArchived ? t('Archiviert', 'Archived') : careProvider.isActive ? t('Aktiv', 'Active') : t('Inaktiv', 'Inactive'),
      managedCareProviders.find((item) => item.id === careProvider.parentId)?.name ?? '',
    ])
    const csv = [headers, ...csvRows]
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
      .join('\r\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = t('einrichtungen.csv', 'care-providers.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <Panel title={t('Einrichtungen', 'Care providers')} description={t('Einrichtungen, Zuständigkeiten und Mitglieder im Überblick', 'Care providers, responsibilities and members at a glance')}>
      <div>
        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:flex-wrap lg:items-center lg:gap-5">
          <div className="flex shrink-0 items-center gap-4">
            <button
              type="button"
              aria-expanded={filterOpen}
              aria-controls="care-provider-filters"
              onClick={() => setFilterOpen((open) => !open)}
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground/90 transition-colors hover:text-foreground"
            >
              <Filter className="size-4" aria-hidden="true" />
              Filter
            </button>
            <button
              type="button"
              onClick={exportCareProviders}
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground/90 transition-colors hover:text-foreground"
            >
              <Download className="size-4" aria-hidden="true" />
              {t('Exportieren', 'Export')}
            </button>
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:flex-1 lg:justify-end">
            <label className="relative block min-w-0 sm:min-w-[220px] sm:flex-1 lg:w-[min(28vw,325px)] lg:flex-none">
              <span className="sr-only">{t('Einrichtungen durchsuchen', 'Search care providers')}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('Suche nach Einrichtungsname', 'Search by care provider name')}
                className="h-10 pl-9"
              />
            </label>
            <label className="flex shrink-0 items-center gap-2 text-sm text-foreground/80">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(event) => setShowArchived(event.target.checked)}
                className="h-4 w-4 shrink-0 rounded border-input bg-background"
              />
              <span>{t('Archivierte Einrichtungen anzeigen', 'Show archived care providers')}</span>
            </label>
            <Button
              type="button"
              onClick={openCreateDialog}
              className="h-10 shrink-0 gap-2 rounded-xl px-4 font-semibold shadow-sm"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t('Einrichtung erstellen', 'Create care provider')}
            </Button>
          </div>
        </div>

        {filterOpen && (
          <div id="care-provider-filters" className="mx-4 mb-4 rounded-lg border border-border bg-background p-3 sm:mx-5">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <button
                type="button"
                aria-label={t('Filter entfernen', 'Remove filter')}
                title={t('Filter entfernen', 'Remove filter')}
                onClick={() => {
                  setFilterValue('')
                  setFilterOpen(false)
                }}
                className="flex size-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
              <label className="min-w-0">
                <span className="mb-1 block text-xs text-muted-foreground">{t('Spalte', 'Column')}</span>
                <select
                  value={filterColumn}
                  onChange={(event) => setFilterColumn(event.target.value as FilterColumn)}
                  aria-label={t('Filterspalte', 'Filter column')}
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  {filterColumns.map((column) => <option key={column} value={column}>{t(...columnLabels[column])}</option>)}
                </select>
              </label>
              <label className="min-w-0">
                <span className="mb-1 block text-xs text-muted-foreground">{t('Operator', 'Operator')}</span>
                <select
                  value={filterOperator}
                  onChange={(event) => setFilterOperator(event.target.value as FilterOperator)}
                  aria-label={t('Filteroperator', 'Filter operator')}
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  {filterOperators.map((operator) => (
                    <option key={operator.value} value={operator.value}>{t(operator.label, operator.labelEn)}</option>
                  ))}
                </select>
              </label>
              <label className="min-w-0">
                <span className="mb-1 block text-xs text-muted-foreground">{t('Wert', 'Value')}</span>
                <Input
                  value={filterValue}
                  onChange={(event) => setFilterValue(event.target.value)}
                  placeholder={t('Filterwert', 'Filter value')}
                  aria-label={t('Filterwert', 'Filter value')}
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
                <th scope="col" className="break-words px-2 py-3">{t('Firmenname', 'Company name')}</th>
                <th scope="col" className="break-words px-2 py-3">{t('Account-Besitzer', 'Account owners')}</th>
                <th scope="col" className="break-words px-2 py-3">{t('Shop vorhanden', 'Has store')}</th>
                <th scope="col" className="break-words px-2 py-3">Plan</th>
                <th scope="col" className="break-words px-2 py-3">Status</th>
                <th scope="col" className="break-words px-2 py-3">{t('Aktion', 'Action')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ careProvider, depth }) => {
                const accountOwner = getCareProviderField(careProvider, 'Account Besitzers', ownerExamples)
                const hasStore = translateFieldValue(getCareProviderField(careProvider, 'Has Store', ownerExamples), t)
                const plan = getCareProviderField(careProvider, 'Plan', ownerExamples)
                const isArchived = Boolean(careProvider.isArchived)

                return (
                  <tr
                    key={careProvider.id}
                    className={`border-b border-border last:border-0 transition-colors hover:bg-muted/50 ${
                      careProvider.id === 'careops-clinics' ? 'bg-muted/40' : ''
                    }`}
                  >
                    <td className="break-words px-2 py-3">
                      <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 1.25}rem` }}>
                        {careProvider.id === 'careops-clinics' ? (
                          <button
                            type="button"
                            onClick={() => setIsCareOpsExpanded((expanded) => !expanded)}
                            aria-expanded={isCareOpsExpanded || search.trim().length > 0}
                            aria-label={isCareOpsExpanded ? t('CareOps-Kliniken einklappen', 'Collapse CareOps clinics') : t('CareOps-Kliniken ausklappen', 'Expand CareOps clinics')}
                            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            {isCareOpsExpanded || search.trim().length > 0 ? (
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
                        <span className={`break-words ${careProvider.id === 'careops-clinics' || depth === 0 ? 'font-semibold' : 'font-medium'}`}>
                          {careProvider.name}
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
                        onClick={() => setManagedCareProviders((current) => current.map((item) =>
                          item.id === careProvider.id ? { ...item, isActive: !item.isActive } : item,
                        ))}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {careProvider.isActive ? t('Deaktivieren', 'Deactivate') : t('Aktivieren', 'Activate')}
                      </button>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openOwnersDialog(careProvider)}
                          aria-label={t(`Benutzer für ${careProvider.name}`, `Users for ${careProvider.name}`)}
                          title={t('Benutzer verwalten', 'Manage users')}
                          className="text-primary hover:text-primary/80"
                        >
                          <UserRound className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditDialog(careProvider)}
                          aria-label={t(`${careProvider.name} bearbeiten`, `Edit ${careProvider.name}`)}
                          title={t('Bearbeiten', 'Edit')}
                          className="text-primary hover:text-primary/80"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setManagedCareProviders((current) => current.map((item) =>
                            item.id === careProvider.id ? { ...item, isArchived: !item.isArchived } : item,
                          ))}
                          aria-label={isArchived ? t(`${careProvider.name} wiederherstellen`, `Restore ${careProvider.name}`) : t(`${careProvider.name} archivieren`, `Archive ${careProvider.name}`)}
                          title={isArchived ? t('Wiederherstellen', 'Restore') : t('Archivieren', 'Archive')}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Ban className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCareProvider(careProvider)}
                          aria-label={t(`${careProvider.name} löschen`, `Delete ${careProvider.name}`)}
                          title={t('Löschen', 'Delete')}
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
                ? t('Einrichtung erstellen', 'Create care provider')
                : dialog?.kind === 'edit'
                  ? t('Einrichtung bearbeiten', 'Edit care provider')
                  : t('Account-Besitzer verwalten', 'Manage account owners')}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'owners'
                ? t(`Account-Besitzer für ${selectedCareProvider?.name ?? 'Einrichtung'} bearbeiten.`, `Edit account owners for ${selectedCareProvider?.name ?? 'care provider'}.`)
                : t('Einrichtungsdaten bearbeiten. Änderungen werden lokal in diesem Browser gespeichert.', 'Edit care provider details. Changes are saved locally in this browser.')}
            </DialogDescription>
          </DialogHeader>

          {dialog?.kind === 'owners' ? (
            <label className="grid gap-2">
              <span className="text-sm font-medium">{t('Account-Besitzer', 'Account owners')}</span>
              <textarea
                value={ownersDraft}
                onChange={(event) => setOwnersDraft(event.target.value)}
                placeholder={t('Namen durch Kommas trennen', 'Separate names with commas')}
                rows={4}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-medium">{t('Firmenname*', 'Company name*')}</span>
                <Input
                  autoFocus
                  value={careProviderForm.name}
                  onChange={(event) => setCareProviderForm((current) => ({ ...current, name: event.target.value }))}
                  aria-label={t('Firmenname', 'Company name')}
                  required
                />
              </label>
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-medium">{t('Straße*', 'Street*')}</span>
                <Input
                  value={careProviderForm.street}
                  onChange={(event) => setCareProviderForm((current) => ({ ...current, street: event.target.value }))}
                  aria-label={t('Straße', 'Street')}
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">{t('Postleitzahl*', 'Postal code*')}</span>
                <Input
                  value={careProviderForm.zip}
                  onChange={(event) => setCareProviderForm((current) => ({ ...current, zip: event.target.value }))}
                  aria-label={t('Postleitzahl', 'Postal code')}
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">{t('Stadt*', 'City*')}</span>
                <Input
                  value={careProviderForm.city}
                  onChange={(event) => setCareProviderForm((current) => ({ ...current, city: event.target.value }))}
                  aria-label={t('Stadt', 'City')}
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">{t('Land*', 'Country*')}</span>
                <select
                  value={careProviderForm.country}
                  onChange={(event) => setCareProviderForm((current) => ({ ...current, country: event.target.value }))}
                  aria-label={t('Land', 'Country')}
                  required
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">{t('Land auswählen', 'Select country')}</option>
                  {availableCountries.map((country) => <option key={country} value={country}>{t(country, countryLabelsEn[country] ?? country)}</option>)}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Plan*</span>
                <select
                  value={careProviderForm.plan}
                  onChange={(event) => setCareProviderForm((current) => ({ ...current, plan: event.target.value as 'BASIC' | 'PREMIUM' }))}
                  aria-label="Plan"
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="BASIC">BASIC</option>
                  <option value="PREMIUM">PREMIUM</option>
                </select>
              </label>
              <div className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-medium">{t('Account-Besitzer*', 'Account owners*')}</span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value=""
                    aria-label={t('Account-Besitzer auswählen', 'Select account owner')}
                    onChange={(event) => {
                      const owner = event.target.value
                      if (!owner) return
                      setCareProviderForm((current) => ({
                        ...current,
                        accountOwners: current.accountOwners.includes(owner)
                          ? current.accountOwners
                          : [...current.accountOwners, owner],
                      }))
                    }}
                    className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">{t('Account-Besitzer auswählen', 'Select account owner')}</option>
                    {ownerOptions.map((owner) => (
                      <option key={owner} value={owner} disabled={careProviderForm.accountOwners.includes(owner)}>{owner}</option>
                    ))}
                  </select>
                  <Button type="button" className="h-10 gap-2" onClick={() => { setShowAddOwner((show) => !show); setFormError('') }}>
                    <Plus className="size-4" aria-hidden="true" />
                    {t('Benutzer hinzufügen', 'Add user')}
                  </Button>
                </div>
                {careProviderForm.accountOwners.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {careProviderForm.accountOwners.map((owner) => (
                      <span key={owner} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                        {owner}
                        <button
                          type="button"
                          aria-label={t(`${owner} entfernen`, `Remove ${owner}`)}
                          onClick={() => setCareProviderForm((current) => ({
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
                      aria-label={t('Neuer Benutzername', 'New user name')}
                      placeholder={t('Benutzername', 'User name')}
                    />
                    <Button type="button" variant="outline" onClick={addAccountOwner}>{t('Hinzufügen', 'Add')}</Button>
                  </div>
                )}
              </div>
              <label className="grid gap-2">
                <span className="text-sm font-medium">{t('Zentrale Telefon-Nr.', 'Main phone')}</span>
                <Input
                  type="tel"
                  value={careProviderForm.centralPhone}
                  onChange={(event) => setCareProviderForm((current) => ({ ...current, centralPhone: event.target.value }))}
                  aria-label={t('Zentrale Telefon-Nr.', 'Main phone')}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">{t('Zentrales Fax', 'Main fax')}</span>
                <Input
                  type="tel"
                  value={careProviderForm.centralFax}
                  onChange={(event) => setCareProviderForm((current) => ({ ...current, centralFax: event.target.value }))}
                  aria-label={t('Zentrales Fax', 'Main fax')}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">{t('Steuer-Nr.', 'Tax number')}</span>
                <Input
                  value={careProviderForm.taxNumber}
                  onChange={(event) => setCareProviderForm((current) => ({ ...current, taxNumber: event.target.value }))}
                  aria-label={t('Steuer-Nr.', 'Tax number')}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium">{t('Steuersatz', 'Tax rate')}</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={careProviderForm.taxRate}
                  onChange={(event) => setCareProviderForm((current) => ({ ...current, taxRate: event.target.value }))}
                  aria-label={t('Steuersatz', 'Tax rate')}
                />
              </label>
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-medium">{t('Öffnungszeiten (optional)', 'Opening hours (optional)')}</span>
                <Input
                  value={careProviderForm.openingHours}
                  onChange={(event) => setCareProviderForm((current) => ({ ...current, openingHours: event.target.value }))}
                  aria-label={t('Öffnungszeiten', 'Opening hours')}
                />
              </label>
              <div className="sm:col-span-2">
                <Button type="button" onClick={() => setShowOpeningDays((show) => !show)}>
                  {t('Öffnungstage verwalten', 'Manage opening days')}
                </Button>
                {showOpeningDays && (
                  <fieldset className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-border p-3 sm:grid-cols-4">
                    <legend className="px-1 text-xs text-muted-foreground">{t('Öffnungstage', 'Opening days')}</legend>
                    {weekdays.map((day) => (
                      <label key={day} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={careProviderForm.openingDays.includes(day)}
                          onChange={(event) => setCareProviderForm((current) => ({
                            ...current,
                            openingDays: event.target.checked
                              ? [...current.openingDays, day]
                              : current.openingDays.filter((item) => item !== day),
                          }))}
                          className="h-4 w-4 rounded border-input"
                        />
                        {t(day, weekdayLabelsEn[day] ?? day)}
                      </label>
                    ))}
                  </fieldset>
                )}
              </div>
              <fieldset className="grid gap-2 sm:col-span-2">
                <legend className="text-sm font-medium">{t('Länder in der Verwaltung', 'Countries managed')}</legend>
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3 sm:grid-cols-4">
                  {availableCountries.map((country) => (
                    <label key={country} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={careProviderForm.managementCountries.includes(country)}
                        onChange={(event) => setCareProviderForm((current) => ({
                          ...current,
                          managementCountries: event.target.checked
                            ? [...current.managementCountries, country]
                            : current.managementCountries.filter((item) => item !== country),
                        }))}
                        className="h-4 w-4 rounded border-input"
                      />
                      {t(country, countryLabelsEn[country] ?? country)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={careProviderForm.hasStore}
                  onChange={(event) => setCareProviderForm((current) => ({ ...current, hasStore: event.target.checked }))}
                  className="h-4 w-4 rounded border-input"
                />
                {t('Shop vorhanden', 'Has store')}
              </label>
              <label className="grid gap-2 sm:col-span-2">
                <span className="text-sm font-medium">{t('Übergeordnete Einrichtung', 'Parent care provider')}</span>
                <select
                  value={careProviderForm.parentId}
                  onChange={(event) => setCareProviderForm((current) => ({ ...current, parentId: event.target.value }))}
                  aria-label={t('Übergeordnete Einrichtung', 'Parent care provider')}
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">{t('Keine', 'None')}</option>
                  {managedCareProviders
                    .filter((careProvider) => !careProvider.isArchived && canChooseAsParent(careProvider.id, dialog?.careProviderId))
                    .map((careProvider) => <option key={careProvider.id} value={careProvider.id}>{careProvider.name}</option>)}
                </select>
              </label>
            </div>
          )}

          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>{t('Abbrechen', 'Cancel')}</Button>
            <Button
              type="button"
              onClick={dialog?.kind === 'owners' ? saveOwners : saveCareProvider}
            >
              {t('Speichern', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  )
}
