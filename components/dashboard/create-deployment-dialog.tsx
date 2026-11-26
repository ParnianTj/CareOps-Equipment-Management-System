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
import { useT } from '@/components/app-shell'
import { cn } from '@/lib/utils'
import {
  countries,
  deviceTypeOptions,
  deviceSeries,
  type CareProvider,
  type Deployment,
  type EquipmentLineItem,
  type DeviceType,
} from '@/lib/dashboard-data'

export type NewDeploymentInput = {
  name: string
  street: string
  zip: string
  city: string
  country: string
  latitude: number
  longitude: number
  careProviderId: string
  reference?: string
  startDate?: string
  endDate?: string
}

type CreateDeploymentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  careProviders: CareProvider[]
  onCreate: (input: NewDeploymentInput) => string
  onUpdate: (id: string, patch: Partial<Deployment>) => void
  editingDeployment: Deployment | null
}

const steps = [
  'Bereitstellungsinformationen',
  'Gerätetypen',
  'Gerätepositionen',
] as const

const stepLabelsEn = ['Deployment information', 'Device types', 'Line items'] as const

type Translate = (de: string, en: string) => string

type InfoForm = Record<
  | 'name'
  | 'street'
  | 'zip'
  | 'city'
  | 'country'
  | 'latitude'
  | 'longitude'
  | 'careProviderId'
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
  careProviderId: '',
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
  careProviders: CareProvider[],
  t: Translate,
  editing = false,
) {
  const errors: Partial<Record<keyof InfoForm, string>> = {}

  const required: [keyof InfoForm, string][] = editing
    ? [
        ['name', t('Bereitstellungsname ist erforderlich.', 'Deployment name is required.')],
        ['city', t('Stadt ist erforderlich.', 'City is required.')],
      ]
    : [
        ['name', t('Bereitstellungsname ist erforderlich.', 'Deployment name is required.')],
        ['street', t('Straße ist erforderlich.', 'Street is required.')],
        ['zip', t('Postleitzahl ist erforderlich.', 'Postal code is required.')],
        ['city', t('Stadt ist erforderlich.', 'City is required.')],
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
    errors.country = t('Bitte ein Land wählen.', 'Please select a country.')
  }

  if (!careProviders.some((careProvider) => careProvider.id === form.careProviderId)) {
    errors.careProviderId = t('Bitte eine Einrichtung wählen.', 'Please select a care provider.')
  }

  const lat = Number(form.latitude)
  const lng = Number(form.longitude)

  if (
    form.latitude.trim() === '' ||
    Number.isNaN(lat) ||
    lat < -90 ||
    lat > 90
  ) {
    errors.latitude = t('Wert zwischen -90 und 90.', 'Value between -90 and 90.')
  }

  if (
    form.longitude.trim() === '' ||
    Number.isNaN(lng) ||
    lng < -180 ||
    lng > 180
  ) {
    errors.longitude = t('Wert zwischen -180 und 180.', 'Value between -180 and 180.')
  }

  if (
    form.startDate &&
    form.endDate &&
    form.endDate < form.startDate
  ) {
    errors.endDate =
      t('Enddatum muss nach dem Startdatum liegen.', 'End date must be after the start date.')
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

export function CreateDeploymentDialog({
  open,
  onOpenChange,
  careProviders,
  onCreate,
  onUpdate,
  editingDeployment,
}: CreateDeploymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        <CreateDeploymentForm
          key={`${open ? 'open' : 'closed'}-${editingDeployment?.id ?? 'new'}`}
          careProviders={careProviders}
          onCreate={onCreate}
          onUpdate={onUpdate}
          editingDeployment={editingDeployment}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function CreateDeploymentForm({
  careProviders,
  onCreate,
  onUpdate,
  editingDeployment,
  onClose,
}: Omit<
  CreateDeploymentDialogProps,
  'open' | 'onOpenChange'
> & {
  onClose: () => void
}) {
  const t = useT()
  const [step, setStep] = useState(0)
  const [summaryOpen, setSummaryOpen] = useState(false)

  const [deploymentId, setDeploymentId] = useState<string | null>(
    editingDeployment?.id ?? null,
  )

  const [savedSteps, setSavedSteps] = useState<boolean[]>(
    editingDeployment
      ? [true, true, true]
      : [false, false, false],
  )

  const [info, setInfo] = useState<InfoForm>(() =>
    editingDeployment
      ? {
          name: editingDeployment.name,
          street: editingDeployment.street ?? '',
          zip: editingDeployment.zip ?? '',
          city: editingDeployment.location,
          country: editingDeployment.country ?? '',
          latitude:
            editingDeployment.latitude === undefined
              ? ''
              : String(editingDeployment.latitude),
          longitude:
            editingDeployment.longitude === undefined
              ? ''
              : String(editingDeployment.longitude),
          careProviderId: editingDeployment.careProviderId,
          reference: editingDeployment.reference ?? '',
          startDate: editingDeployment.startDate ?? '',
          endDate: editingDeployment.endDate ?? '',
        }
      : emptyInfo,
  )

  const [errors, setErrors] = useState<
    Partial<Record<keyof InfoForm, string>>
  >({})

  const [selectedSeries, setSelectedSeries] = useState('')
  const [selectedDeviceTypeId, setSelectedDeviceTypeId] = useState('')
  const [customDeviceTypeName, setCustomDeviceTypeName] = useState('')

  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>(
    editingDeployment?.deviceTypes ?? [],
  )

  const [lineItems, setLineItems] = useState<EquipmentLineItem[]>(
    editingDeployment?.lineItems ?? [],
  )

  const [editingLineItemId, setEditingLineItemId] =
    useState<string | null>(null)

  const [editingLineItemLabel, setEditingLineItemLabel] =
    useState('')

  const [editingLineItemQuantity, setEditingLineItemQuantity] =
    useState('')

  const [lineItemName, setLineItemName] = useState('')
  const [lineItemQuantity, setLineItemQuantity] = useState('0')

  const [lineItemMode, setLineItemMode] = useState<
    'import' | 'manual'
  >('import')

  const [lineItemSearch, setLineItemSearch] = useState('')

  const [stepError, setStepError] = useState('')
  const [locationError, setLocationError] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [locating, setLocating] = useState(false)

  const importInput = useRef<HTMLInputElement>(null)

  const availableDeviceTypes = deviceTypeOptions.filter(
    (deviceType) => deviceType.series === selectedSeries,
  )

  const filteredLineItems = useMemo(() => {
    const query = lineItemSearch
      .trim()
      .toLocaleLowerCase('de')

    if (!query) {
      return lineItems
    }

    return lineItems.filter((lineItem) =>
      lineItem.label
        .toLocaleLowerCase('de')
        .includes(query),
    )
  }, [lineItems, lineItemSearch])

  const totalLineItemQuantity = useMemo(
    () =>
      lineItems.reduce(
        (total, lineItem) => total + lineItem.quantity,
        0,
      ),
    [lineItems],
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
        t('Standortermittlung wird von diesem Browser nicht unterstützt.', 'Location detection is not supported by this browser.'),
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
            ? t('Der Standortzugriff wurde nicht erlaubt.', 'Location access was not allowed.')
            : error.code === error.TIMEOUT
              ? t('Die Standortermittlung hat zu lange gedauert.', 'Location detection took too long.')
              : t('Der aktuelle Standort konnte nicht ermittelt werden.', 'The current location could not be determined.'),
        )

        setLocating(false)
      },
      {
        timeout: 10000,
      },
    )
  }

  async function importLineItems(
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

      const imported: EquipmentLineItem[] = []
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
        200 - lineItems.length,
      )

      const accepted = imported.slice(0, remaining)

      setLineItems((current) => [
        ...current,
        ...accepted,
      ])

      markDirty()

      setImportMessage(
        accepted.length
          ? `${t(
              `${accepted.length} Geräteposition${accepted.length === 1 ? '' : 'en'} importiert`,
              `${accepted.length} line item${accepted.length === 1 ? '' : 's'} imported`,
            )}${
              invalidRows
                ? t(
                    `, ${invalidRows} ungültige Zeile${invalidRows === 1 ? '' : 'n'} übersprungen`,
                    `, ${invalidRows} invalid row${invalidRows === 1 ? '' : 's'} skipped`,
                  )
                : ''
            }${
              accepted.length < imported.length
                ? t('; maximal 200 Gerätepositionen', '; maximum 200 line items')
                : ''
            }.`
          : t('Keine gültigen Gerätepositionen in der Datei gefunden. Erwartetes Format: Name;Menge.', 'No valid line items found in the file. Expected format: Name;Quantity.'),
      )
    } catch {
      setImportMessage(
        t('Die Datei konnte nicht gelesen werden.', 'The file could not be read.'),
      )
    }
  }

  function downloadLineItemTemplate() {
    const csv = [
      t('Name;Menge', 'Name;Quantity'),
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
    link.download = 'line-items-template.csv'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  function addDeviceType() {
    const deviceType =
      availableDeviceTypes.find(
        (item) => item.id === selectedDeviceTypeId,
      ) ??
      (selectedSeries &&
      !availableDeviceTypes.length &&
      customDeviceTypeName.trim()
        ? {
            id: crypto.randomUUID(),
            series: selectedSeries,
            name: customDeviceTypeName
              .trim()
              .slice(0, 120),
          }
        : undefined)

    if (!deviceType) {
      setStepError(
        t('Bitte wählen Sie einen Gerätetyp aus.', 'Please select a device type.'),
      )
      return
    }

    if (
      deviceTypes.some(
        (item) =>
          item.id === deviceType.id ||
          (item.series === deviceType.series &&
            item.name === deviceType.name),
      )
    ) {
      setStepError(
        t('Dieser Gerätetyp wurde bereits zur Liste hinzugefügt.', 'This device type has already been added to the list.'),
      )
      return
    }

    setDeviceTypes((current) => [
      ...current,
      deviceType,
    ])

    setSelectedDeviceTypeId('')
    setCustomDeviceTypeName('')
    setStepError('')

    markDirty()
  }

  function addLineItem() {
    const quantity = Number(lineItemQuantity)

    if (!lineItemName.trim()) {
      setStepError(
        t('Bitte geben Sie einen Gerätepositionsnamen ein.', 'Please enter a line item name.'),
      )
      return
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      quantity > 100000
    ) {
      setStepError(
        t('Die Menge muss eine ganze Zahl zwischen 0 und 100000 sein.', 'The quantity must be a whole number between 0 and 100000.'),
      )
      return
    }

    if (lineItems.length >= 200) {
      setStepError(
        t('Es können maximal 200 Gerätepositionen angelegt werden.', 'A maximum of 200 line items can be created.'),
      )
      return
    }

    setLineItems((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        label: lineItemName
          .trim()
          .slice(0, 60),
        quantity,
      },
    ])

    setLineItemName('')
    setLineItemQuantity('0')
    setStepError('')
    setImportMessage('')

    markDirty()
  }

  function startEditingLineItem(
    lineItem: EquipmentLineItem,
  ) {
    setEditingLineItemId(lineItem.id)
    setEditingLineItemLabel(lineItem.label)
    setEditingLineItemQuantity(
      String(lineItem.quantity),
    )
    setStepError('')
  }

  function saveLineItemEdit() {
    const label =
      editingLineItemLabel.trim()

    const quantity = Number(
      editingLineItemQuantity,
    )

    if (!label) {
      setStepError(
        t('Bitte geben Sie einen Gerätepositionsnamen ein.', 'Please enter a line item name.'),
      )
      return
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      quantity > 100000
    ) {
      setStepError(
        t('Die Menge muss eine ganze Zahl zwischen 0 und 100000 sein.', 'The quantity must be a whole number between 0 and 100000.'),
      )
      return
    }

    setLineItems((current) =>
      current.map((lineItem) =>
        lineItem.id === editingLineItemId
          ? {
              ...lineItem,
              label: label.slice(0, 60),
              quantity,
            }
          : lineItem,
      ),
    )

    setEditingLineItemId(null)
    setStepError('')

    markDirty()
  }

  function save() {
    if (step === 0) {
      const nextErrors = validateInfo(
        info,
        careProviders,
        t,
        Boolean(editingDeployment),
      )

      setErrors(nextErrors)

      if (Object.keys(nextErrors).length > 0) {
        return
      }

      const payload: NewDeploymentInput = {
        name: info.name
          .trim()
          .slice(0, 120),

        street:
          info.street
            .trim()
            .slice(0, 120) ||
          editingDeployment?.street ||
          '',

        zip:
          info.zip
            .trim()
            .slice(0, 12) ||
          editingDeployment?.zip ||
          '',

        city: info.city
          .trim()
          .slice(0, 80),

        country:
          info.country ||
          editingDeployment?.country ||
          '',

        latitude: Number(info.latitude),
        longitude: Number(info.longitude),

        careProviderId: info.careProviderId,

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

      if (deploymentId) {
        onUpdate(deploymentId, {
          ...payload,
          location: payload.city,
        })
      } else {
        setDeploymentId(onCreate(payload))
      }
    } else if (deploymentId && step === 1) {
      onUpdate(deploymentId, {
        deviceTypes: deviceTypes,
      })
    } else if (deploymentId && step === 2) {
      onUpdate(deploymentId, {
        lineItems,
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
          {editingDeployment
            ? t('Bereitstellung bearbeiten', 'Edit deployment')
            : t('Bereitstellung erstellen', 'Create deployment')}
        </DialogTitle>

        <DialogDescription className="sr-only">
          {t('Bereitstellung in drei Schritten anlegen: Bereitstellungsinformationen, Gerätetypen und Gerätepositionen.', 'Create a deployment in three steps: deployment information, device types and line items.')}
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
                  {t(label, stepLabelsEn[index])}
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
              label={t('Bereitstellungsname', 'Deployment name')}
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
              label={t('Straße', 'Street')}
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
              label={t('Postleitzahl', 'Postal code')}
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
              label={t('Stadt', 'City')}
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
              label={t('Land', 'Country')}
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
                  {t('Land wählen', 'Select country')}
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
                {t('GPS-Koordinaten*', 'GPS coordinates*')}
              </legend>

              <div className="flex items-start gap-3">
                <Field
                  id="cp-lat"
                  label={t('Breitengrad', 'Latitude')}
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
                  label={t('Längengrad', 'Longitude')}
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
                  aria-label={t('Aktuellen Standort übernehmen', 'Use current location')}
                  title={t('Aktuellen Standort übernehmen', 'Use current location')}
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
              id="cp-care-provider"
              label={t('Einrichtung', 'Care provider')}
              required
              error={errors.careProviderId}
            >
              <select
                id="cp-care-provider"
                className={selectClass}
                value={info.careProviderId}
                aria-invalid={!!errors.careProviderId}
                onChange={(e) =>
                  updateInfo(
                    'careProviderId',
                    e.target.value,
                  )
                }
              >
                <option
                  value=""
                  disabled
                >
                  {t('Einrichtung wählen', 'Select care provider')}
                </option>

                {careProviders.map(
                  (careProvider) => (
                    <option
                      key={careProvider.id}
                      value={careProvider.id}
                    >
                      {careProvider.name}
                    </option>
                  ),
                )}
              </select>
            </Field>

            <Field
              id="cp-ref"
              label={t('Referenz-Nr.', 'Reference no.')}
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
                label={t('Startdatum', 'Start date')}
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
                label={t('Enddatum', 'End date')}
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
            {/* Device type / series summary */}
            <div className="flex items-center gap-5 text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground">
                  {deviceTypes.length}
                </strong>{' '}
                {deviceTypes.length === 1
                  ? t('Gerätetyp', 'Device type')
                  : t('Gerätetypen', 'Device types')}
              </span>

              <span>
                <strong className="text-foreground">
                  {
                    new Set(
                      deviceTypes.map(
                        (deviceType) =>
                          deviceType.series,
                      ),
                    ).size
                  }
                </strong>{' '}
                {
                  new Set(
                    deviceTypes.map(
                      (deviceType) =>
                        deviceType.series,
                    ),
                  ).size === 1
                    ? t('Serie', 'Series')
                    : t('Serien', 'Series')
                }
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-end">
              <Field
                id="cp-series"
                label={t('Serie', 'Series')}
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
                    setSelectedDeviceTypeId('')
                    setStepError('')
                  }}
                >
                  <option value="">
                    {t('Serie wählen', 'Select series')}
                  </option>

                  {deviceSeries.map(
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
                id="cp-device-type"
                label={t('Gerätetyp', 'Device type')}
                required
                hint={
                  selectedSeries &&
                  !availableDeviceTypes.length
                    ? t('Für diese Serie ist kein Katalog hinterlegt. Bezeichnung bitte manuell eingeben.', 'No catalogue is available for this series. Please enter the name manually.')
                    : undefined
                }
              >
                {availableDeviceTypes.length ? (
                  <select
                    id="cp-device-type"
                    className={selectClass}
                    value={
                      selectedDeviceTypeId
                    }
                    disabled={
                      !selectedSeries
                    }
                    onChange={(
                      event,
                    ) => {
                      setSelectedDeviceTypeId(
                        event.target
                          .value,
                      )
                      setStepError('')
                    }}
                  >
                    <option value="">
                      {t('Gerätetyp wählen', 'Select device type')}
                    </option>

                    {availableDeviceTypes.map(
                      (deviceType) => (
                        <option
                          key={deviceType.id}
                          value={deviceType.id}
                        >
                          {deviceType.name}
                        </option>
                      ),
                    )}
                  </select>
                ) : (
                  <Input
                    id="cp-device-type"
                    className={fieldClass}
                    value={
                      customDeviceTypeName
                    }
                    disabled={
                      !selectedSeries
                    }
                    placeholder={
                      selectedSeries
                        ? t('Gerätetypbezeichnung eingeben', 'Enter device type name')
                        : t('Zuerst Serie wählen', 'Select a series first')
                    }
                    maxLength={120}
                    onChange={(
                      event,
                    ) => {
                      setCustomDeviceTypeName(
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
                onClick={addDeviceType}
              >
                <Plus
                  className="size-4"
                  aria-hidden="true"
                />
                {t('Zur Liste hinzufügen', 'Add to list')}
              </Button>
            </div>

            <section aria-label={t('Gerätetypübersicht', 'Device type overview')}>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                {t('Übersicht', 'Overview')}
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
                        {t('Serie', 'Series')}
                      </th>

                      <th
                        scope="col"
                        className="px-4 py-3"
                      >
                        {t('Gerätetyp', 'Device type')}
                      </th>

                      <th
                        scope="col"
                        className="px-4 py-3"
                      >
                        <div className="flex justify-center">
                          {t('Aktion', 'Action')}&nbsp;&nbsp;&nbsp;
                        </div>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {deviceTypes.length ? (
                      deviceTypes.map(
                        (deviceType, index) => (
                          <tr
                            key={deviceType.id}
                            className="border-t border-border"
                          >
                            <td className="px-4 py-3 tabular-nums">
                              {index + 1}
                            </td>

                            <td className="break-words px-2 py-3">
                              {deviceType.series}
                            </td>

                            <td className="break-words px-2 py-3">
                              {deviceType.name}
                            </td>

                            <td className="px-4 py-2 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={t(`${deviceType.name} entfernen`, `Remove ${deviceType.name}`)}
                                onClick={() => {
                                  setDeviceTypes(
                                    (
                                      current,
                                    ) =>
                                      current.filter(
                                        (
                                          item,
                                        ) =>
                                          item.id !==
                                          deviceType.id,
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
                          {t('Noch keine Gerätetypen hinzugefügt', 'No device types added yet')}
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
                  lineItemMode ===
                    'import'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => {
                  setLineItemMode(
                    'import',
                  )
                  setStepError('')
                }}
                disabled={
                  !!editingLineItemId
                }
              >
                Import
              </button>

              <button
                type="button"
                className={cn(
                  'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  lineItemMode ===
                    'manual'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => {
                  setLineItemMode(
                    'manual',
                  )
                  setStepError('')
                }}
                disabled={
                  !!editingLineItemId
                }
              >
                {t('Manuell', 'Manual')}
              </button>
            </div>

            {/* Import mode */}
            {lineItemMode === 'import' && (
              <>
              {/* CSV template - only visible in Import mode */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9"
                    onClick={
                      downloadLineItemTemplate
                    }
                    disabled={
                      !!editingLineItemId
                    }
                  >
                    <Download
                      className="size-4"
                      aria-hidden="true"
                    />
                    {t('Vorlage herunterladen', 'Download template')}
                  </Button>
                </div>

                {/* Import box */}
                <section className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">
                        {t('Gerätepositionen importieren', 'Import line items')}
                      </h3>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('Importieren Sie eine CSV-Datei mit den Spalten', 'Import a CSV file with the columns')}
                        <span className="font-medium">
                          {' '}
                          Name{' '}
                        </span>
                        {t('und', 'and')}
                        <span className="font-medium">
                          {' '}
                          {t('Menge', 'Quantity')}
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
                        aria-label={t('Gerätepositionsliste als CSV importieren', 'Import line item list as CSV')}
                        onChange={
                          importLineItems
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
                          !!editingLineItemId ||
                          lineItems.length >=
                            200
                        }
                      >
                        <Upload
                          className="size-4"
                          aria-hidden="true"
                        />
                        {t('Datei auswählen', 'Choose file')}
                      </Button>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* Manual mode */}
            {lineItemMode ===
              'manual' && (
              <section className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px_auto] sm:items-end">
                  <Field
                    id="cp-line-item-name"
                    label={t('Gerätepositionsname', 'Line item name')}
                    required
                  >
                    <Input
                      id="cp-line-item-name"
                      className={
                        fieldClass
                      }
                      placeholder={t('z. B. Position 1', 'e.g. Position 1')}
                      value={
                        lineItemName
                      }
                      maxLength={60}
                      aria-invalid={
                        !!stepError
                      }
                      onChange={(
                        event,
                      ) => {
                        setLineItemName(
                          event.target
                            .value,
                        )
                        setStepError('')
                      }}
                    />
                  </Field>

                  <Field
                    id="cp-line-item-quantity"
                    label={t('Menge', 'Quantity')}
                    required
                  >
                    <Input
                      id="cp-line-item-quantity"
                      type="number"
                      min={0}
                      max={100000}
                      step={1}
                      className={
                        fieldClass
                      }
                      value={
                        lineItemQuantity
                      }
                      onChange={(
                        event,
                      ) => {
                        setLineItemQuantity(
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
                      addLineItem
                    }
                    disabled={
                      lineItems.length >=
                        200 ||
                      !!editingLineItemId
                    }
                  >
                    <Plus
                      className="size-4"
                      aria-hidden="true"
                    />
                    {t('Hinzufügen', 'Add')}
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
                  {t('Gerätepositionen', 'Line items')}
                </p>

                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {lineItems.length}
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}
                    / 200
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs text-muted-foreground">
                  {t('Gesamtmenge', 'Total quantity')}
                </p>

                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {totalLineItemQuantity.toLocaleString(
                    t('de-DE', 'en-GB'),
                  )}
                </p>
              </div>
            </div>

            {/* Map + line items */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.9fr)]">
              {/* Map */}
              <section className="min-w-0">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  {t('Kartenposition', 'Map position')}
                </h3>

                {info.latitude &&
                info.longitude ? (
                  <EquipmentLineItemMap
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
                    {t('Für die Kartenansicht zuerst gültige Koordinaten in den Bereitstellungsinformationen speichern.', 'To show the map, first save valid coordinates in the deployment information.')}
                  </p>
                )}
              </section>

              {/* Line item list */}
              <section className="min-w-0">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t('Gerätepositionen', 'Line items')}
                  </h3>

                  <span className="text-xs text-muted-foreground">
                    {filteredLineItems.length}{' '}
                    {t('von', 'of')}{' '}
                    {lineItems.length}
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
                      lineItemSearch
                    }
                    onChange={(
                      event,
                    ) =>
                      setLineItemSearch(
                        event.target
                          .value,
                      )
                    }
                    placeholder={t('Geräteposition suchen...', 'Search line items...')}
                    className="h-10 pl-9"
                    aria-label={t('Gerätepositionen durchsuchen', 'Search line items')}
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
                          {t('Menge', 'Quantity')}
                        </th>

                        <th
                          scope="col"
                          className="px-3 py-3 text-right"
                        >
                          {t('Aktion', 'Action')}
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredLineItems.length ? (
                        filteredLineItems.map(
                          (
                            lineItem,
                            index,
                          ) => (
                            <tr
                              key={
                                lineItem.id
                              }
                              className="border-t border-border"
                            >
                              <td className="px-3 py-2.5 tabular-nums">
                                {index + 1}
                              </td>

                              <td className="max-w-[140px] px-2 py-2">
                                {editingLineItemId ===
                                lineItem.id ? (
                                  <Input
                                    aria-label={t('Gerätepositionsname bearbeiten', 'Edit line item name')}
                                    className="h-8 min-w-0 px-2 text-xs"
                                    value={
                                      editingLineItemLabel
                                    }
                                    maxLength={
                                      60
                                    }
                                    onChange={(
                                      event,
                                    ) => {
                                      setEditingLineItemLabel(
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
                                      lineItem.label
                                    }
                                  </span>
                                )}
                              </td>

                              <td className="px-2 py-2">
                                {editingLineItemId ===
                                lineItem.id ? (
                                  <Input
                                    aria-label={t('Gerätepositionsmenge bearbeiten', 'Edit line item quantity')}
                                    type="number"
                                    min={0}
                                    max={
                                      100000
                                    }
                                    step={1}
                                    className="h-8 w-20 px-2 text-right text-xs"
                                    value={
                                      editingLineItemQuantity
                                    }
                                    onChange={(
                                      event,
                                    ) => {
                                      setEditingLineItemQuantity(
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
                                      lineItem.quantity
                                    }
                                  </span>
                                )}
                              </td>

                              <td className="px-2 py-1 text-right">
                                {editingLineItemId ===
                                lineItem.id ? (
                                  <span className="inline-flex">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      aria-label={t('Geräteposition speichern', 'Save line item')}
                                      onClick={
                                        saveLineItemEdit
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
                                      aria-label={t('Bearbeitung abbrechen', 'Cancel editing')}
                                      onClick={() => {
                                        setEditingLineItemId(
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
                                      aria-label={t(`Geräteposition ${lineItem.label} bearbeiten`, `Edit line item ${lineItem.label}`)}
                                      disabled={
                                        !!editingLineItemId
                                      }
                                      onClick={() =>
                                        startEditingLineItem(
                                          lineItem,
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
                                      aria-label={t(`Geräteposition ${lineItem.label} entfernen`, `Remove line item ${lineItem.label}`)}
                                      disabled={
                                        !!editingLineItemId
                                      }
                                      onClick={() => {
                                        setLineItems(
                                          (
                                            current,
                                          ) =>
                                            current.filter(
                                              (
                                                item,
                                              ) =>
                                                item.id !==
                                                lineItem.id,
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
                            {lineItems.length
                              ? t('Keine Gerätepositionen gefunden', 'No line items found')
                              : t('Noch keine Gerätepositionen hinzugefügt', 'No line items added yet')}
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
        {/* Deployment Summary */}
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
            {t('Bereitstellungsübersicht ·', 'Deployment summary ·')}{' '}
            <span className="text-foreground">
              {info.name || t('Name', 'name')}
            </span>
          </span>
        </button>

        {summaryOpen && (
          <div className="mt-4 flex flex-col gap-3 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
              <span>
                {careProviders.find(
                  (careProvider) =>
                    careProvider.id === info.careProviderId,
                )?.name || '—'}
              </span>

              <span>
                {deviceTypes.length}{' '}
                {deviceTypes.length === 1
                  ? t('Gerätetyp', 'device type')
                  : t('Gerätetypen', 'device types')}
              </span>

              <span>
                {lineItems.length}{' '}
                {lineItems.length === 1
                  ? t('Geräteposition', 'line item')
                  : t('Gerätepositionen', 'line items')}
              </span>

              <span>
                {totalLineItemQuantity.toLocaleString(
                  t('de-DE', 'en-GB'),
                )}{' '}
                {t('Gesamtmenge', 'total quantity')}
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
            {t('Schließen', 'Close')}
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
                !!editingLineItemId
              }
            >
              {t('Zurück', 'Back')}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {savedSteps[step] &&
            !editingLineItemId && (
              <span
                role="status"
                className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex"
              >
                <Check
                  className="size-3.5 text-success"
                  aria-hidden="true"
                />
                {t('Gespeichert', 'Saved')}
              </span>
            )}

          <Button
            type="button"
            className="h-10 px-5 font-semibold hover:bg-primary/90"
            onClick={save}
            disabled={
              !!editingLineItemId
            }
          >
            {t('Speichern', 'Save')}
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="h-10 px-5 font-semibold"
            onClick={next}
            disabled={
              !savedSteps[step] ||
              !!editingLineItemId
            }
          >
            {isLastStep
              ? t('Fertig', 'Done')
              : t('Weiter', 'Next')}
          </Button>
        </div>
      </div>
    </div>
  )
}

function EquipmentLineItemMap({
  latitude,
  longitude,
  title,
}: {
  latitude: number
  longitude: number
  title: string
}) {
  const t = useT()
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
          'Unable to load deployment line item map.',
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
        aria-label={t(`Karte für ${title}`, `Map of ${title}`)}
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