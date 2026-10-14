'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react'
import {
  Check,
  Download,
  LocateFixed,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  countries,
  screwOptions,
  screwSeries,
  type Organization,
  type Project,
  type ProjectPosition,
  type ProjectScrew,
} from '@/lib/dashboard-data'

export type NewProjectInput = {
  name: string
  street: string
  zip: string
  city: string
  country: string
  latitude: number
  longitude: number
  orgId: string
  reference?: string
  startDate?: string
  endDate?: string
}

type CreateProjectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizations: Organization[]
  onCreate: (input: NewProjectInput) => string
  onUpdate: (id: string, patch: Partial<Project>) => void
  editingProject: Project | null
}

const steps = [
  'Projektinformationen',
  'Schraubentypen',
  'Positionen',
] as const

type InfoForm = Record<
  | 'name'
  | 'street'
  | 'zip'
  | 'city'
  | 'country'
  | 'latitude'
  | 'longitude'
  | 'orgId'
  | 'reference'
  | 'startDate'
  | 'endDate',
  string
>

const emptyInfo: InfoForm = {
  name: '',
  street: '',
  zip: '',
  city: '',
  country: '',
  latitude: '',
  longitude: '',
  orgId: '',
  reference: '',
  startDate: '',
  endDate: '',
}

const fieldClass =
  'h-10 rounded-lg bg-background px-3 text-sm dark:bg-input/20'

const selectClass = cn(
  fieldClass,
  'w-full border border-input outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20',
)

function validateInfo(
  form: InfoForm,
  organizations: Organization[],
  editing = false,
) {
  const errors: Partial<Record<keyof InfoForm, string>> = {}

  const required: [keyof InfoForm, string][] = editing
    ? [
        ['name', 'Projektname ist erforderlich.'],
        ['city', 'Stadt ist erforderlich.'],
      ]
    : [
        ['name', 'Projektname ist erforderlich.'],
        ['street', 'Straße ist erforderlich.'],
        ['zip', 'Postleitzahl ist erforderlich.'],
        ['city', 'Stadt ist erforderlich.'],
      ]

  for (const [key, message] of required) {
    if (!form[key].trim()) {
      errors[key] = message
    }
  }

  if (
    (!editing || form.country) &&
    !countries.includes(form.country)
  ) {
    errors.country = 'Bitte ein Land wählen.'
  }

  if (!organizations.some((org) => org.id === form.orgId)) {
    errors.orgId = 'Bitte eine Organisation wählen.'
  }

  const lat = Number(form.latitude)
  const lng = Number(form.longitude)

  if (
    form.latitude.trim() === '' ||
    Number.isNaN(lat) ||
    lat < -90 ||
    lat > 90
  ) {
    errors.latitude = 'Wert zwischen -90 und 90.'
  }

  if (
    form.longitude.trim() === '' ||
    Number.isNaN(lng) ||
    lng < -180 ||
    lng > 180
  ) {
    errors.longitude = 'Wert zwischen -180 und 180.'
  }

  if (
    form.startDate &&
    form.endDate &&
    form.endDate < form.startDate
  ) {
    errors.endDate =
      'Enddatum muss nach dem Startdatum liegen.'
  }

  return errors
}

function parseCsvRow(row: string) {
  const fields: string[] = []
  let value = ''
  let quoted = false

  for (let index = 0; index < row.length; index += 1) {
    const character = row[index]

    if (
      character === '"' &&
      row[index + 1] === '"' &&
      quoted
    ) {
      value += '"'
      index += 1
    } else if (character === '"') {
      quoted = !quoted
    } else if (
      (character === ',' ||
        character === ';' ||
        character === '\t') &&
      !quoted
    ) {
      fields.push(value.trim())
      value = ''
    } else {
      value += character
    }
  }

  fields.push(value.trim())

  return fields
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  organizations,
  onCreate,
  onUpdate,
  editingProject,
}: CreateProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        <CreateProjectForm
          key={`${open ? 'open' : 'closed'}-${editingProject?.id ?? 'new'}`}
          organizations={organizations}
          onCreate={onCreate}
          onUpdate={onUpdate}
          editingProject={editingProject}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function CreateProjectForm({
  organizations,
  onCreate,
  onUpdate,
  editingProject,
  onClose,
}: Omit<
  CreateProjectDialogProps,
  'open' | 'onOpenChange'
> & {
  onClose: () => void
}) {
  const [step, setStep] = useState(0)
  const [summaryOpen, setSummaryOpen] = useState(false)

  const [projectId, setProjectId] = useState<string | null>(
    editingProject?.id ?? null,
  )

  const [savedSteps, setSavedSteps] = useState<boolean[]>(
    editingProject
      ? [true, true, true]
      : [false, false, false],
  )

  const [info, setInfo] = useState<InfoForm>(() =>
    editingProject
      ? {
          name: editingProject.name,
          street: editingProject.street ?? '',
          zip: editingProject.zip ?? '',
          city: editingProject.location,
          country: editingProject.country ?? '',
          latitude:
            editingProject.latitude === undefined
              ? ''
              : String(editingProject.latitude),
          longitude:
            editingProject.longitude === undefined
              ? ''
              : String(editingProject.longitude),
          orgId: editingProject.orgId,
          reference: editingProject.reference ?? '',
          startDate: editingProject.startDate ?? '',
          endDate: editingProject.endDate ?? '',
        }
      : emptyInfo,
  )

  const [errors, setErrors] = useState<
    Partial<Record<keyof InfoForm, string>>
  >({})

  const [selectedSeries, setSelectedSeries] = useState('')
  const [selectedScrewId, setSelectedScrewId] = useState('')
  const [customScrewName, setCustomScrewName] = useState('')

  const [screws, setScrews] = useState<ProjectScrew[]>(
    editingProject?.screwTypes ?? [],
  )

  const [positions, setPositions] = useState<ProjectPosition[]>(
    editingProject?.positions ?? [],
  )

  const [editingPositionId, setEditingPositionId] =
    useState<string | null>(null)

  const [editingPositionLabel, setEditingPositionLabel] =
    useState('')

  const [editingPositionQuantity, setEditingPositionQuantity] =
    useState('')

  const [positionName, setPositionName] = useState('')
  const [positionQuantity, setPositionQuantity] = useState('0')

  const [positionMode, setPositionMode] = useState<
    'import' | 'manual'
  >('import')

  const [positionSearch, setPositionSearch] = useState('')

  const [stepError, setStepError] = useState('')
  const [locationError, setLocationError] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [locating, setLocating] = useState(false)

  const importInput = useRef<HTMLInputElement>(null)

  const availableScrews = screwOptions.filter(
    (screw) => screw.series === selectedSeries,
  )

  const filteredPositions = useMemo(() => {
    const query = positionSearch
      .trim()
      .toLocaleLowerCase('de')

    if (!query) {
      return positions
    }

    return positions.filter((position) =>
      position.label
        .toLocaleLowerCase('de')
        .includes(query),
    )
  }, [positions, positionSearch])

  const totalPositionQuantity = useMemo(
    () =>
      positions.reduce(
        (total, position) => total + position.quantity,
        0,
      ),
    [positions],
  )

  function markDirty() {
    setSavedSteps((current) =>
      current.map((saved, index) =>
        index === step ? false : saved,
      ),
    )
  }

  function updateInfo(
    key: keyof InfoForm,
    value: string,
  ) {
    setInfo((current) => ({
      ...current,
      [key]: value,
    }))

    setErrors((current) => ({
      ...current,
      [key]: undefined,
    }))

    setLocationError('')
    markDirty()
  }

  function locate() {
    if (!navigator.geolocation) {
      setLocationError(
        'Standortermittlung wird von diesem Browser nicht unterstützt.',
      )
      return
    }

    setLocating(true)
    setLocationError('')

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setInfo((current) => ({
          ...current,
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
        }))

        setErrors((current) => ({
          ...current,
          latitude: undefined,
          longitude: undefined,
        }))

        markDirty()
        setLocating(false)
      },
      (error) => {
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? 'Der Standortzugriff wurde nicht erlaubt.'
            : error.code === error.TIMEOUT
              ? 'Die Standortermittlung hat zu lange gedauert.'
              : 'Der aktuelle Standort konnte nicht ermittelt werden.',
        )

        setLocating(false)
      },
      {
        timeout: 10000,
      },
    )
  }

  async function importPositions(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    event.target.value = ''

    if (!file) return

    try {
      const text = await file.text()

      const rows = text
        .split(/\r?\n/)
        .map((row) => row.trim())
        .filter(Boolean)

      const parsedRows = rows.map(parseCsvRow)

      const firstRow = parsedRows[0]?.map(
        (field) => field.toLocaleLowerCase('de'),
      )

      const nameColumn =
        firstRow?.findIndex((field) =>
          [
            'name',
            'position',
            'positionsname',
            'positionsname*',
          ].includes(field),
        ) ?? -1

      const quantityColumn =
        firstRow?.findIndex((field) =>
          ['menge', 'quantity', 'anzahl'].includes(field),
        ) ?? -1

      const hasHeader =
        nameColumn >= 0 || quantityColumn >= 0

      const dataRows = hasHeader
        ? parsedRows.slice(1)
        : parsedRows

      const imported: ProjectPosition[] = []
      let invalidRows = 0

      for (const row of dataRows) {
        const label =
          row[
            hasHeader && nameColumn >= 0
              ? nameColumn
              : 0
          ]?.trim()

        const quantityText =
          row[
            hasHeader && quantityColumn >= 0
              ? quantityColumn
              : 1
          ]?.trim() ?? '0'

        const quantity = Number(
          quantityText.replace(',', '.'),
        )

        if (
          !label ||
          !Number.isInteger(quantity) ||
          quantity < 0 ||
          quantity > 100000
        ) {
          invalidRows += 1
          continue
        }

        imported.push({
          id: crypto.randomUUID(),
          label: label.slice(0, 60),
          quantity,
        })
      }

      const remaining = Math.max(
        0,
        200 - positions.length,
      )

      const accepted = imported.slice(0, remaining)

      setPositions((current) => [
        ...current,
        ...accepted,
      ])

      markDirty()

      setImportMessage(
        accepted.length
          ? `${accepted.length} Position${
              accepted.length === 1 ? '' : 'en'
            } importiert${
              invalidRows
                ? `, ${invalidRows} ungültige Zeile${
                    invalidRows === 1 ? '' : 'n'
                  } übersprungen`
                : ''
            }${
              accepted.length < imported.length
                ? '; maximal 200 Positionen'
                : ''
            }.`
          : 'Keine gültigen Positionen in der Datei gefunden. Erwartetes Format: Name;Menge.',
      )
    } catch {
      setImportMessage(
        'Die Datei konnte nicht gelesen werden.',
      )
    }
  }

  function downloadPositionTemplate() {
    const csv = [
      'Name;Menge',
      'Position 1;50',
      'Position 2;50',
    ].join('\r\n')

    const blob = new Blob(
      [`\uFEFF${csv}`],
      {
        type: 'text/csv;charset=utf-8;',
      },
    )

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'positions-template.csv'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  function addScrew() {
    const screw =
      availableScrews.find(
        (item) => item.id === selectedScrewId,
      ) ??
      (selectedSeries &&
      !availableScrews.length &&
      customScrewName.trim()
        ? {
            id: crypto.randomUUID(),
            series: selectedSeries,
            name: customScrewName
              .trim()
              .slice(0, 120),
          }
        : undefined)

    if (!screw) {
      setStepError(
        'Bitte wählen Sie eine Schraube aus.',
      )
      return
    }

    if (
      screws.some(
        (item) =>
          item.id === screw.id ||
          (item.series === screw.series &&
            item.name === screw.name),
      )
    ) {
      setStepError(
        'Diese Schraube wurde bereits zur Liste hinzugefügt.',
      )
      return
    }

    setScrews((current) => [
      ...current,
      screw,
    ])

    setSelectedScrewId('')
    setCustomScrewName('')
    setStepError('')

    markDirty()
  }

  function addPosition() {
    const quantity = Number(positionQuantity)

    if (!positionName.trim()) {
      setStepError(
        'Bitte geben Sie einen Positionsnamen ein.',
      )
      return
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      quantity > 100000
    ) {
      setStepError(
        'Die Menge muss eine ganze Zahl zwischen 0 und 100000 sein.',
      )
      return
    }

    if (positions.length >= 200) {
      setStepError(
        'Es können maximal 200 Positionen angelegt werden.',
      )
      return
    }

    setPositions((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        label: positionName
          .trim()
          .slice(0, 60),
        quantity,
      },
    ])

    setPositionName('')
    setPositionQuantity('0')
    setStepError('')
    setImportMessage('')

    markDirty()
  }

  function startEditingPosition(
    position: ProjectPosition,
  ) {
    setEditingPositionId(position.id)
    setEditingPositionLabel(position.label)
    setEditingPositionQuantity(
      String(position.quantity),
    )
    setStepError('')
  }

  function savePositionEdit() {
    const label =
      editingPositionLabel.trim()

    const quantity = Number(
      editingPositionQuantity,
    )

    if (!label) {
      setStepError(
        'Bitte geben Sie einen Positionsnamen ein.',
      )
      return
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      quantity > 100000
    ) {
      setStepError(
        'Die Menge muss eine ganze Zahl zwischen 0 und 100000 sein.',
      )
      return
    }

    setPositions((current) =>
      current.map((position) =>
        position.id === editingPositionId
          ? {
              ...position,
              label: label.slice(0, 60),
              quantity,
            }
          : position,
      ),
    )

    setEditingPositionId(null)
    setStepError('')

    markDirty()
  }

  function save() {
    if (step === 0) {
      const nextErrors = validateInfo(
        info,
        organizations,
        Boolean(editingProject),
      )

      setErrors(nextErrors)

      if (Object.keys(nextErrors).length > 0) {
        return
      }

      const payload: NewProjectInput = {
        name: info.name
          .trim()
          .slice(0, 120),

        street:
          info.street
            .trim()
            .slice(0, 120) ||
          editingProject?.street ||
          '',

        zip:
          info.zip
            .trim()
            .slice(0, 12) ||
          editingProject?.zip ||
          '',

        city: info.city
          .trim()
          .slice(0, 80),

        country:
          info.country ||
          editingProject?.country ||
          '',

        latitude: Number(info.latitude),
        longitude: Number(info.longitude),

        orgId: info.orgId,

        reference:
          info.reference
            .trim()
            .slice(0, 60) ||
          undefined,

        startDate:
          info.startDate || undefined,

        endDate:
          info.endDate || undefined,
      }

      if (projectId) {
        onUpdate(projectId, {
          ...payload,
          location: payload.city,
        })
      } else {
        setProjectId(onCreate(payload))
      }
    } else if (projectId && step === 1) {
      onUpdate(projectId, {
        screwTypes: screws,
      })
    } else if (projectId && step === 2) {
      onUpdate(projectId, {
        positions,
      })
    }

    setStepError('')

    setSavedSteps((current) =>
      current.map((saved, index) =>
        index === step ? true : saved,
      ),
    )
  }

  function next() {
    if (!savedSteps[step]) return

    if (step < steps.length - 1) {
      setStep(step + 1)
      setStepError('')
    } else {
      onClose()
    }
  }

  const isLastStep =
    step === steps.length - 1

  return (
    <div className="flex flex-col">
      <div className="px-6 pb-4 pt-6 sm:px-8">
        <DialogTitle className="text-center text-base font-semibold">
          {editingProject
            ? 'Projekt bearbeiten'
            : 'Projekt erstellen'}
        </DialogTitle>

        <DialogDescription className="sr-only">
          Projekt in drei Schritten anlegen:
          Projektinformationen, Schraubentypen und
          Positionen.
        </DialogDescription>

        <ol className="mt-5 flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5">
          {steps.map((label, index) => {
            const done =
              savedSteps[index] &&
              index !== step

            const active =
              index === step

            return (
              <li
                key={label}
                className="flex min-w-0 flex-1 items-center gap-2 last:flex-none"
              >
                <span
                  aria-current={
                    active
                      ? 'step'
                      : undefined
                  }
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    active || done
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted-foreground/40 text-background',
                  )}
                >
                  {done ? (
                    <Check
                      className="size-3.5"
                      aria-hidden="true"
                    />
                  ) : (
                    index + 1
                  )}
                </span>

                <span
                  className={cn(
                    'truncate text-xs sm:text-sm',
                    active
                      ? 'font-semibold text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>

                {index <
                  steps.length - 1 && (
                  <span
                    className="mx-1 hidden h-px flex-1 bg-border sm:block"
                    aria-hidden="true"
                  />
                )}
              </li>
            )
          })}
        </ol>
      </div>

      <div className="px-6 pb-6 sm:px-8">
        {/* STEP 1 */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <Field
              id="cp-name"
              label="Projektname"
              required
              error={errors.name}
            >
              <Input
                id="cp-name"
                className={fieldClass}
                value={info.name}
                maxLength={120}
                aria-invalid={!!errors.name}
                onChange={(e) =>
                  updateInfo(
                    'name',
                    e.target.value,
                  )
                }
              />
            </Field>

            <Field
              id="cp-street"
              label="Straße"
              required
              error={errors.street}
            >
              <Input
                id="cp-street"
                className={fieldClass}
                value={info.street}
                maxLength={120}
                autoComplete="street-address"
                aria-invalid={!!errors.street}
                onChange={(e) =>
                  updateInfo(
                    'street',
                    e.target.value,
                  )
                }
              />
            </Field>

            <Field
              id="cp-zip"
              label="Postleitzahl"
              required
              error={errors.zip}
            >
              <Input
                id="cp-zip"
                className={fieldClass}
                value={info.zip}
                maxLength={12}
                autoComplete="postal-code"
                inputMode="numeric"
                aria-invalid={!!errors.zip}
                onChange={(e) =>
                  updateInfo(
                    'zip',
                    e.target.value,
                  )
                }
              />
            </Field>

            <Field
              id="cp-city"
              label="Stadt"
              required
              error={errors.city}
            >
              <Input
                id="cp-city"
                className={fieldClass}
                value={info.city}
                maxLength={80}
                autoComplete="address-level2"
                aria-invalid={!!errors.city}
                onChange={(e) =>
                  updateInfo(
                    'city',
                    e.target.value,
                  )
                }
              />
            </Field>

            <Field
              id="cp-country"
              label="Land"
              required
              error={errors.country}
            >
              <select
                id="cp-country"
                className={selectClass}
                value={info.country}
                aria-invalid={!!errors.country}
                onChange={(e) =>
                  updateInfo(
                    'country',
                    e.target.value,
                  )
                }
              >
                <option
                  value=""
                  disabled
                >
                  Land wählen
                </option>

                {countries.map(
                  (country) => (
                    <option
                      key={country}
                      value={country}
                    >
                      {country}
                    </option>
                  ),
                )}
              </select>
            </Field>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-xs font-medium text-muted-foreground">
                GPS Koordinaten*
              </legend>

              <div className="flex items-start gap-3">
                <Field
                  id="cp-lat"
                  label="Latitude"
                  required
                  error={errors.latitude}
                  className="flex-1"
                >
                  <Input
                    id="cp-lat"
                    className={fieldClass}
                    value={info.latitude}
                    inputMode="decimal"
                    placeholder="48.8566"
                    aria-invalid={
                      !!errors.latitude
                    }
                    onChange={(e) =>
                      updateInfo(
                        'latitude',
                        e.target.value,
                      )
                    }
                  />
                </Field>

                <Field
                  id="cp-lng"
                  label="Longitude"
                  required
                  error={errors.longitude}
                  className="flex-1"
                >
                  <Input
                    id="cp-lng"
                    className={fieldClass}
                    value={info.longitude}
                    inputMode="decimal"
                    placeholder="12.3456"
                    aria-invalid={
                      !!errors.longitude
                    }
                    onChange={(e) =>
                      updateInfo(
                        'longitude',
                        e.target.value,
                      )
                    }
                  />
                </Field>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="mt-5 size-10 shrink-0"
                  onClick={locate}
                  disabled={locating}
                  aria-label="Aktuellen Standort übernehmen"
                  title="Aktuellen Standort übernehmen"
                >
                  <LocateFixed
                    className={cn(
                      'size-4',
                      locating &&
                        'animate-pulse',
                    )}
                    aria-hidden="true"
                  />
                </Button>
              </div>

              {locationError && (
                <p
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {locationError}
                </p>
              )}
            </fieldset>

            <Field
              id="cp-org"
              label="Organisation"
              required
              error={errors.orgId}
            >
              <select
                id="cp-org"
                className={selectClass}
                value={info.orgId}
                aria-invalid={!!errors.orgId}
                onChange={(e) =>
                  updateInfo(
                    'orgId',
                    e.target.value,
                  )
                }
              >
                <option
                  value=""
                  disabled
                >
                  Organisation wählen
                </option>

                {organizations.map(
                  (org) => (
                    <option
                      key={org.id}
                      value={org.id}
                    >
                      {org.name}
                    </option>
                  ),
                )}
              </select>
            </Field>

            <Field
              id="cp-ref"
              label="Referenz-Nr"
            >
              <Input
                id="cp-ref"
                className={fieldClass}
                value={info.reference}
                maxLength={60}
                onChange={(e) =>
                  updateInfo(
                    'reference',
                    e.target.value,
                  )
                }
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="cp-start"
                label="Startdatum"
                error={errors.startDate}
              >
                <Input
                  id="cp-start"
                  type="date"
                  className={fieldClass}
                  value={info.startDate}
                  onChange={(e) =>
                    updateInfo(
                      'startDate',
                      e.target.value,
                    )
                  }
                />
              </Field>

              <Field
                id="cp-end"
                label="Enddatum"
                error={errors.endDate}
              >
                <Input
                  id="cp-end"
                  type="date"
                  className={fieldClass}
                  value={info.endDate}
                  min={
                    info.startDate ||
                    undefined
                  }
                  aria-invalid={
                    !!errors.endDate
                  }
                  onChange={(e) =>
                    updateInfo(
                      'endDate',
                      e.target.value,
                    )
                  }
                />
              </Field>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            {/* Screw type / series summary */}
            <div className="flex items-center gap-5 text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground">
                  {screws.length}
                </strong>{' '}
                {screws.length === 1
                  ? 'Schraubentyp'
                  : 'Schraubentypen'}
              </span>

              <span>
                <strong className="text-foreground">
                  {
                    new Set(
                      screws.map(
                        (screw) =>
                          screw.series,
                      ),
                    ).size
                  }
                </strong>{' '}
                {
                  new Set(
                    screws.map(
                      (screw) =>
                        screw.series,
                    ),
                  ).size === 1
                    ? 'Serie'
                    : 'Serien'
                }
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-end">
              <Field
                id="cp-series"
                label="Serie"
                required
              >
                <select
                  id="cp-series"
                  className={selectClass}
                  value={selectedSeries}
                  onChange={(event) => {
                    setSelectedSeries(
                      event.target.value,
                    )
                    setSelectedScrewId('')
                    setStepError('')
                  }}
                >
                  <option value="">
                    Serie wählen
                  </option>

                  {screwSeries.map(
                    (series) => (
                      <option
                        key={series}
                        value={series}
                      >
                        {series}
                      </option>
                    ),
                  )}
                </select>
              </Field>

              <Field
                id="cp-screw"
                label="Schraube"
                required
                hint={
                  selectedSeries &&
                  !availableScrews.length
                    ? 'Für diese Serie ist kein Katalog hinterlegt. Bezeichnung bitte manuell eingeben.'
                    : undefined
                }
              >
                {availableScrews.length ? (
                  <select
                    id="cp-screw"
                    className={selectClass}
                    value={
                      selectedScrewId
                    }
                    disabled={
                      !selectedSeries
                    }
                    onChange={(
                      event,
                    ) => {
                      setSelectedScrewId(
                        event.target
                          .value,
                      )
                      setStepError('')
                    }}
                  >
                    <option value="">
                      Schraube wählen
                    </option>

                    {availableScrews.map(
                      (screw) => (
                        <option
                          key={screw.id}
                          value={screw.id}
                        >
                          {screw.name}
                        </option>
                      ),
                    )}
                  </select>
                ) : (
                  <Input
                    id="cp-screw"
                    className={fieldClass}
                    value={
                      customScrewName
                    }
                    disabled={
                      !selectedSeries
                    }
                    placeholder={
                      selectedSeries
                        ? 'Schraubenbezeichnung eingeben'
                        : 'Zuerst Serie wählen'
                    }
                    maxLength={120}
                    onChange={(
                      event,
                    ) => {
                      setCustomScrewName(
                        event.target
                          .value,
                      )
                      setStepError('')
                    }}
                  />
                )}
              </Field>

              <Button
                type="button"
                variant="outline"
                className="h-10 whitespace-nowrap"
                onClick={addScrew}
              >
                <Plus
                  className="size-4"
                  aria-hidden="true"
                />
                Zur Liste hinzufügen
              </Button>
            </div>

            <section aria-label="Schraubenübersicht">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Übersicht
              </h3>

              <div className="rounded-xl border border-border">
                <table className="w-full table-fixed text-left text-sm">
                  <colgroup>
                    <col className="w-10" />
                    <col className="w-[24%]" />
                    <col />
                    <col className="w-12" />
                  </colgroup>

                  <thead className="bg-muted text-xs uppercase text-muted-foreground">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3"
                      >
                        #
                      </th>

                      <th
                        scope="col"
                        className="px-4 py-3"
                      >
                        Serie
                      </th>

                      <th
                        scope="col"
                        className="px-4 py-3"
                      >
                        Schraube
                      </th>

                      <th
                        scope="col"
                        className="px-4 py-3"
                      >
                        <div className="flex justify-center">
                          Aktion&nbsp;&nbsp;&nbsp;
                        </div>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {screws.length ? (
                      screws.map(
                        (screw, index) => (
                          <tr
                            key={screw.id}
                            className="border-t border-border"
                          >
                            <td className="px-4 py-3 tabular-nums">
                              {index + 1}
                            </td>

                            <td className="break-words px-2 py-3">
                              {screw.series}
                            </td>

                            <td className="break-words px-2 py-3">
                              {screw.name}
                            </td>

                            <td className="px-4 py-2 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`${screw.name} entfernen`}
                                onClick={() => {
                                  setScrews(
                                    (
                                      current,
                                    ) =>
                                      current.filter(
                                        (
                                          item,
                                        ) =>
                                          item.id !==
                                          screw.id,
                                      ),
                                  )

                                  markDirty()
                                }}
                              >
                                <Trash2
                                  className="size-4"
                                  aria-hidden="true"
                                />
                              </Button>
                            </td>
                          </tr>
                        ),
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-5 text-center text-muted-foreground"
                        >
                          Noch keine Schrauben hinzugefügt
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {stepError && (
              <p
                role="alert"
                className="text-sm text-destructive"
              >
                {stepError}
              </p>
            )}
          </div>
        )}

        {/* STEP 3 */}
        {step === 2 && (
          <div className="flex flex-col gap-5">

            {/* Import / Manual tabs */}
            <div className="flex rounded-lg bg-muted p-1">
              <button
                type="button"
                className={cn(
                  'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  positionMode ===
                    'import'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => {
                  setPositionMode(
                    'import',
                  )
                  setStepError('')
                }}
                disabled={
                  !!editingPositionId
                }
              >
                Import
              </button>

              <button
                type="button"
                className={cn(
                  'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  positionMode ===
                    'manual'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => {
                  setPositionMode(
                    'manual',
                  )
                  setStepError('')
                }}
                disabled={
                  !!editingPositionId
                }
              >
                Manuell
              </button>
            </div>

            {/* Import mode */}
            {positionMode === 'import' && (
              <>
              {/* CSV template - only visible in Import mode */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9"
                    onClick={
                      downloadPositionTemplate
                    }
                    disabled={
                      !!editingPositionId
                    }
                  >
                    <Download
                      className="size-4"
                      aria-hidden="true"
                    />
                    Vorlage herunterladen
                  </Button>
                </div>

                {/* Import box */}
                <section className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">
                        Positionen importieren
                      </h3>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Importieren Sie eine
                        CSV-Datei mit den Spalten
                        <span className="font-medium">
                          {' '}
                          Name{' '}
                        </span>
                        und
                        <span className="font-medium">
                          {' '}
                          Menge
                        </span>
                        .
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={importInput}
                        type="file"
                        accept=".csv,.txt,text/csv,text/plain"
                        className="sr-only"
                        aria-label="Positionsliste als CSV importieren"
                        onChange={
                          importPositions
                        }
                      />

                      <Button
                        type="button"
                        variant="outline"
                        className="h-9"
                        onClick={() =>
                          importInput.current?.click()
                        }
                        disabled={
                          !!editingPositionId ||
                          positions.length >=
                            200
                        }
                      >
                        <Upload
                          className="size-4"
                          aria-hidden="true"
                        />
                        Datei auswählen
                      </Button>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* Manual mode */}
            {positionMode ===
              'manual' && (
              <section className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px_auto] sm:items-end">
                  <Field
                    id="cp-position-name"
                    label="Positionsname"
                    required
                  >
                    <Input
                      id="cp-position-name"
                      className={
                        fieldClass
                      }
                      placeholder="z. B. Position 1"
                      value={
                        positionName
                      }
                      maxLength={60}
                      aria-invalid={
                        !!stepError
                      }
                      onChange={(
                        event,
                      ) => {
                        setPositionName(
                          event.target
                            .value,
                        )
                        setStepError('')
                      }}
                    />
                  </Field>

                  <Field
                    id="cp-position-quantity"
                    label="Menge"
                    required
                  >
                    <Input
                      id="cp-position-quantity"
                      type="number"
                      min={0}
                      max={100000}
                      step={1}
                      className={
                        fieldClass
                      }
                      value={
                        positionQuantity
                      }
                      onChange={(
                        event,
                      ) => {
                        setPositionQuantity(
                          event.target
                            .value,
                        )
                        setStepError('')
                      }}
                    />
                  </Field>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-10"
                    onClick={
                      addPosition
                    }
                    disabled={
                      positions.length >=
                        200 ||
                      !!editingPositionId
                    }
                  >
                    <Plus
                      className="size-4"
                      aria-hidden="true"
                    />
                    Hinzufügen
                  </Button>
                </div>
              </section>
            )}

            {stepError && (
              <p
                role="alert"
                className="text-sm text-destructive"
              >
                {stepError}
              </p>
            )}

            {importMessage && (
              <p
                role="status"
                className="text-sm text-muted-foreground"
              >
                {importMessage}
              </p>
            )}

            {/* Counters */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground">
                  Positionen
                </p>

                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {positions.length}
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}
                    / 200
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground">
                  Gesamtmenge
                </p>

                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {totalPositionQuantity.toLocaleString(
                    'de-DE',
                  )}
                </p>
              </div>
            </div>

            {/* Map + positions */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.9fr)]">
              {/* Map */}
              <section className="min-w-0">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  Kartenposition
                </h3>

                {info.latitude &&
                info.longitude ? (
                  <ProjectPositionMap
                    latitude={Number(
                      info.latitude,
                    )}
                    longitude={Number(
                      info.longitude,
                    )}
                    title={`${info.street}, ${info.zip} ${info.city}`}
                  />
                ) : (
                  <p className="flex h-[340px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 px-5 text-center text-sm text-muted-foreground">
                    Für die Kartenansicht zuerst gültige Koordinaten in den Projektinformationen speichern.
                  </p>
                )}
              </section>

              {/* Position list */}
              <section className="min-w-0">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Positionen
                  </h3>

                  <span className="text-xs text-muted-foreground">
                    {filteredPositions.length}{' '}
                    von{' '}
                    {positions.length}
                  </span>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <Search
                    className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />

                  <Input
                    value={
                      positionSearch
                    }
                    onChange={(
                      event,
                    ) =>
                      setPositionSearch(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Position suchen..."
                    className="h-10 pl-9"
                    aria-label="Positionen durchsuchen"
                  />
                </div>

                <div className="max-h-[340px] min-h-[160px] overflow-y-auto rounded-xl border border-border">
                  <table className="w-full table-fixed text-left text-sm">
                    <colgroup>
                      <col className="w-8" />
                      <col />
                      <col className="w-16" />
                      <col className="w-20" />
                    </colgroup>

                    <thead className="sticky top-0 bg-muted text-xs uppercase text-muted-foreground">
                      <tr>
                        <th
                          scope="col"
                          className="px-3 py-3"
                        >
                          #
                        </th>

                        <th
                          scope="col"
                          className="px-3 py-3"
                        >
                          Name
                        </th>

                        <th
                          scope="col"
                          className="px-3 py-3 text-right"
                        >
                          Menge
                        </th>

                        <th
                          scope="col"
                          className="px-3 py-3 text-right"
                        >
                          Aktion
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredPositions.length ? (
                        filteredPositions.map(
                          (
                            position,
                            index,
                          ) => (
                            <tr
                              key={
                                position.id
                              }
                              className="border-t border-border"
                            >
                              <td className="px-3 py-2.5 tabular-nums">
                                {index + 1}
                              </td>

                              <td className="max-w-[140px] px-2 py-2">
                                {editingPositionId ===
                                position.id ? (
                                  <Input
                                    aria-label="Positionsname bearbeiten"
                                    className="h-8 min-w-0 px-2 text-xs"
                                    value={
                                      editingPositionLabel
                                    }
                                    maxLength={
                                      60
                                    }
                                    onChange={(
                                      event,
                                    ) => {
                                      setEditingPositionLabel(
                                        event
                                          .target
                                          .value,
                                      )
                                      setStepError(
                                        '',
                                      )
                                    }}
                                  />
                                ) : (
                                  <span className="block truncate px-1">
                                    {
                                      position.label
                                    }
                                  </span>
                                )}
                              </td>

                              <td className="px-2 py-2">
                                {editingPositionId ===
                                position.id ? (
                                  <Input
                                    aria-label="Positionsmenge bearbeiten"
                                    type="number"
                                    min={0}
                                    max={
                                      100000
                                    }
                                    step={1}
                                    className="h-8 w-20 px-2 text-right text-xs"
                                    value={
                                      editingPositionQuantity
                                    }
                                    onChange={(
                                      event,
                                    ) => {
                                      setEditingPositionQuantity(
                                        event
                                          .target
                                          .value,
                                      )
                                      setStepError(
                                        '',
                                      )
                                    }}
                                  />
                                ) : (
                                  <span className="block text-right tabular-nums">
                                    {
                                      position.quantity
                                    }
                                  </span>
                                )}
                              </td>

                              <td className="px-2 py-1 text-right">
                                {editingPositionId ===
                                position.id ? (
                                  <span className="inline-flex">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      aria-label="Position speichern"
                                      onClick={
                                        savePositionEdit
                                      }
                                    >
                                      <Check
                                        className="size-4"
                                        aria-hidden="true"
                                      />
                                    </Button>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      aria-label="Bearbeitung abbrechen"
                                      onClick={() => {
                                        setEditingPositionId(
                                          null,
                                        )
                                        setStepError(
                                          '',
                                        )
                                      }}
                                    >
                                      <X
                                        className="size-4"
                                        aria-hidden="true"
                                      />
                                    </Button>
                                  </span>
                                ) : (
                                  <span className="inline-flex">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      aria-label={`Position ${position.label} bearbeiten`}
                                      disabled={
                                        !!editingPositionId
                                      }
                                      onClick={() =>
                                        startEditingPosition(
                                          position,
                                        )
                                      }
                                    >
                                      <Pencil
                                        className="size-4"
                                        aria-hidden="true"
                                      />
                                    </Button>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      aria-label={`Position ${position.label} entfernen`}
                                      disabled={
                                        !!editingPositionId
                                      }
                                      onClick={() => {
                                        setPositions(
                                          (
                                            current,
                                          ) =>
                                            current.filter(
                                              (
                                                item,
                                              ) =>
                                                item.id !==
                                                position.id,
                                            ),
                                        )

                                        markDirty()
                                      }}
                                    >
                                      <Trash2
                                        className="size-4"
                                        aria-hidden="true"
                                      />
                                    </Button>
                                  </span>
                                )}
                              </td>
                            </tr>
                          ),
                        )
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-3 py-5 text-center text-muted-foreground"
                          >
                            {positions.length
                              ? 'Keine Positionen gefunden'
                              : 'Noch keine Positionen hinzugefügt'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        )}
        {/* Project Summary */}
      <section className="border-t border-border px-6 py-4 sm:px-8">
        <button
          type="button"
          className="flex w-full items-center gap-1 text-left text-xs text-muted-foreground"
          onClick={() =>
            setSummaryOpen((current) => !current)
          }
          aria-expanded={summaryOpen}
        >
          <span
            className={cn(
              'transition-transform',
              summaryOpen
                ? 'rotate-90'
                : '',
            )}
          >
            ▶
          </span>

          <span>
            Project summary ·{' '}
            <span className="text-foreground">
              {info.name || 'name'}
            </span>
          </span>
        </button>

        {summaryOpen && (
          <div className="mt-4 flex flex-col gap-3 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
              <span>
                {organizations.find(
                  (org) =>
                    org.id === info.orgId,
                )?.name || '—'}
              </span>

              <span>
                {screws.length}{' '}
                {screws.length === 1
                  ? 'screw type'
                  : 'screw types'}
              </span>

              <span>
                {positions.length}{' '}
                {positions.length === 1
                  ? 'position'
                  : 'positions'}
              </span>

              <span>
                {totalPositionQuantity.toLocaleString(
                  'de-DE',
                )}{' '}
                total quantity
              </span>
            </div>

            <div>
              {[
                info.street,
                info.zip,
                info.city,
                info.country,
              ]
                .filter(Boolean)
                .join(', ') || '—'}
            </div>
          </div>
        )}
      </section>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-5 sm:px-8">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 px-5 font-semibold"
            onClick={onClose}
          >
            Schließen
          </Button>

          {step > 0 && (
            <Button
              type="button"
              variant="ghost"
              className="h-10 px-4"
              onClick={() =>
                setStep(step - 1)
              }
              disabled={
                !!editingPositionId
              }
            >
              Zurück
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {savedSteps[step] &&
            !editingPositionId && (
              <span
                role="status"
                className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex"
              >
                <Check
                  className="size-3.5 text-success"
                  aria-hidden="true"
                />
                Gespeichert
              </span>
            )}

          <Button
            type="button"
            className="h-10 px-5 font-semibold hover:bg-primary/90"
            onClick={save}
            disabled={
              !!editingPositionId
            }
          >
            Speichern
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="h-10 px-5 font-semibold"
            onClick={next}
            disabled={
              !savedSteps[step] ||
              !!editingPositionId
            }
          >
            {isLastStep
              ? 'Fertig'
              : 'Weiter'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ProjectPositionMap({
  latitude,
  longitude,
  title,
}: {
  latitude: number
  longitude: number
  title: string
}) {
  const mapElement =
    useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element =
      mapElement.current

    if (!element) return

    let map:
      | import('leaflet').Map
      | undefined

    let disposed = false

    let resizeObserver:
      | ResizeObserver
      | undefined

    import('leaflet')
      .then((leaflet) => {
        if (disposed) return

        const currentMap =
          leaflet.map(element, {
            scrollWheelZoom: false,
            zoomControl: true,
          })

        map = currentMap

        leaflet
          .tileLayer(
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
              maxZoom: 19,
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            },
          )
          .addTo(currentMap)

        currentMap.setView(
          [latitude, longitude],
          15,
        )

        const marker =
          leaflet
            .circleMarker(
              [
                latitude,
                longitude,
              ],
              {
                radius: 9,
                weight: 3,
                color:
                  'var(--primary)',
                fillColor:
                  'var(--primary)',
                fillOpacity: 0.85,
              },
            )
            .addTo(currentMap)

        marker.bindTooltip(title, {
          direction: 'top',
          offset: [0, -8],
        })

        resizeObserver =
          new ResizeObserver(
            () => {
              currentMap.invalidateSize()
            },
          )

        resizeObserver.observe(
          element,
        )
      })
      .catch((error: unknown) => {
        console.error(
          'Unable to load project position map.',
          error,
        )
      })

    return () => {
      disposed = true

      resizeObserver?.disconnect()

      map?.remove()
    }
  }, [latitude, longitude, title])

  return (
    <div className="relative overflow-hidden rounded-xl border border-border">
      <div
        ref={mapElement}
        role="region"
        aria-label={`Karte für ${title}`}
        className="h-[340px] w-full bg-muted"
      />

      <div className="absolute bottom-2 right-2 rounded bg-background/90 px-2 py-1 text-[10px] text-muted-foreground shadow-sm">
        © OpenStreetMap
      </div>
    </div>
  )
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5',
        className,
      )}
    >
      <label
        htmlFor={id}
        className="text-xs font-medium text-muted-foreground"
      >
        {label}
        {required && '*'}
      </label>

      {children}

      {error && (
        <p
          className="text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      {hint && (
        <p className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  )
}