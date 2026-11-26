export type DeploymentStatus = 'created' | 'usageRecords' | 'report' | 'completed'

export type CareProvider = {
  id: string
  name: string
  parentId: string | null
  createdAt?: string
  members?: number
  accountOwners?: string
  hasStore?: boolean
  plan?: 'BASIC' | 'PREMIUM'
  isActive?: boolean
  isArchived?: boolean
  street?: string
  zip?: string
  city?: string
  country?: string
  centralPhone?: string
  centralFax?: string
  taxNumber?: string
  taxRate?: number
  openingHours?: string
  openingDays?: string[]
  managementCountries?: string[]
}

export type Deployment = {
  id: string
  name: string
  careProviderId: string
  location: string
  createdAt: string
  createdBy: string
  status: DeploymentStatus
  street?: string
  zip?: string
  country?: string
  latitude?: number
  longitude?: number
  reference?: string
  startDate?: string
  endDate?: string
  deviceTypes?: DeviceType[]
  lineItems?: EquipmentLineItem[]
}

export type DeviceType = {
  id: string
  series: string
  name: string
}

export type EquipmentLineItem = {
  id: string
  label: string
  quantity: number
}

export const countries = [
  'Deutschland',
  'Österreich',
  'Schweiz',
  'Italien',
  'Frankreich',
  'Niederlande',
  'Polen',
  'Tschechien',
]

/** English display names for the stored (German) country and weekday values. */
export const countryLabelsEn: Record<string, string> = {
  Deutschland: 'Germany',
  Österreich: 'Austria',
  Schweiz: 'Switzerland',
  Italien: 'Italy',
  Frankreich: 'France',
  Niederlande: 'Netherlands',
  Polen: 'Poland',
  Tschechien: 'Czechia',
}

export const weekdayLabelsEn: Record<string, string> = {
  Montag: 'Monday',
  Dienstag: 'Tuesday',
  Mittwoch: 'Wednesday',
  Donnerstag: 'Thursday',
  Freitag: 'Friday',
  Samstag: 'Saturday',
  Sonntag: 'Sunday',
}

export const deviceSeries = [
  'Infusion Pumps',
  'Syringe Pumps',
  'Patient Monitors',
  'Pulse Oximeters',
  'ECG Devices',
  'Defibrillators',
  'Ventilators',
  'Anesthesia Workstations',
  'Ultrasound Systems',
  'Dialysis Systems',
  'Telemetry Units',
  'Patient Beds',
  'Imaging Accessories',
  'Service Tools',
]

const deviceTypesBySeries: Record<(typeof deviceSeries)[number], string[]> = {
  'Infusion Pumps': [
    'CareOps InfuMed 300',
    'CareOps InfuMed 300 Plus',
    'CareOps InfuMed 500',
    'CareOps InfuMed 500 Dual-Channel',
    'CareOps InfuMed Mobile',
  ],
  'Syringe Pumps': [
    'CareOps SyriFlow 20',
    'CareOps SyriFlow 50',
    'CareOps SyriFlow 50 Neo',
  ],
  'Patient Monitors': [
    'CareOps VitaScan 300',
    'CareOps VitaScan 500',
    'CareOps VitaScan 700 ICU',
    'CareOps VitaScan Transport',
  ],
  'Pulse Oximeters': [
    'CareOps OxiClip 10',
    'CareOps OxiClip 20 Pediatric',
    'CareOps OxiDesk 30',
  ],
  'ECG Devices': [
    'CareOps CardioLink D12',
    'CareOps CardioLink D30',
    'CareOps CardioLink Holter 7',
  ],
  Defibrillators: [
    'CareOps PulseGuard AED',
    'CareOps PulseGuard AED Pro',
    'CareOps PulseGuard Monitor-Defi',
  ],
  Ventilators: [
    'CareOps AirFlow 400',
    'CareOps AirFlow 600 ICU',
    'CareOps AirFlow Transport',
  ],
  'Anesthesia Workstations': [
    'CareOps AnaStation 200',
    'CareOps AnaStation 400',
  ],
  'Ultrasound Systems': [
    'CareOps SonoView 5',
    'CareOps SonoView 9 Cardio',
    'CareOps SonoView Pocket',
  ],
  'Dialysis Systems': [
    'CareOps RenaFlow 4000',
    'CareOps RenaFlow Home',
  ],
  'Telemetry Units': [
    'CareOps TeleTrack T1',
    'CareOps TeleTrack T3',
    'CareOps TeleTrack Gateway',
  ],
  'Patient Beds': [
    'CareOps ComfortBed ICU',
    'CareOps ComfortBed Standard',
  ],
  'Imaging Accessories': [
    'CareOps Lead Apron Set',
    'CareOps Positioning Kit',
  ],
  'Service Tools': [
    'Kalibrierset Infusion',
    'Prüfadapter EKG',
    'Sicherheitstester SMT 1',
    'Sicherheitstester SMT 2',
  ],
}

export const deviceTypeOptions: DeviceType[] = deviceSeries.flatMap((series, seriesIndex) =>
  deviceTypesBySeries[series].map((name, productIndex) => ({
    id: `device-type-${seriesIndex + 1}-${productIndex + 1}`,
    series,
    name,
  })),
)

export type Report = {
  id: string
  deploymentName: string
  careProviderId: string
  createdAt: string
  deploymentId?: string
  reportName?: string
  documentHtml?: string
}

export function stableDemoCount(key: string, range: number, seed = 0) {
  let hash = 2166136261 ^ seed
  for (let index = 0; index < key.length; index += 1) {
    hash = Math.imul(hash ^ key.charCodeAt(index), 16777619)
  }
  return (hash >>> 0) % range + 1
}

export const REFERENCE_DATE = new Date('2026-10-03T12:00:00Z')
export const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000

const affiliatedCareProviderNames = [
  'Praxis am Rosenpark',
  'Hausarztpraxis Lindenhof',
  'Physiotherapie Seeblick',
  'MVZ Am Stadtgarten',
  'Zahnklinik Sonnenberg',
  'Kinderarztpraxis Wolkenstein',
  'Augenzentrum Talblick',
  'Praxisgemeinschaft Mühlbach',
  'Dialysezentrum Ostring',
  'Reha-Klinik Waldesruh',
  'Pflegeheim Abendrot',
  'Orthopädie am Markt',
  'CareOps Ambulanz Ost',
  'Radiologie Glashaus',
  'Hautarztpraxis Heidegrund',
  'Kardiologie Formenhof',
  'Praxis Feldrain',
  'Geriatrie-Zentrum Schlehenweg',
  'Gesundheitszentrum Holzmarkt',
  'Ärztehaus Lindenberg',
  'Pflegedienst Sonnenschein',
  'Logopädie Segelhof',
  'Sanitätshaus Buchberg',
  'Atemtherapie Lufthof',
  'Labor Nordstern',
  'Klinik Kleinfeld',
  'Rehazentrum Lindau',
  'Hebammenpraxis Merzhof',
  'Psychotherapie Pfefferhaus',
  'Notfallpraxis Hochfeld',
  'Tagesklinik Elsertal',
  'Hospiz Abendstern',
  'Diabetologie am Brunnen',
  'Kurklinik Bergsee',
  'Schmerzambulanz Sonnhalde',
  'Praxis Birkenweg',
  'Telemedizin Nordlicht',
  'Klinik Gartenblick',
  'Medizintechnik-Service Süd',
]

export const careProviders: CareProvider[] = [
  { id: 'careops-group', name: 'CareOps Gruppe', parentId: null, createdAt: '2023-01-12' },
  { id: 'careops-clinics', name: 'CareOps Kliniken', parentId: null },
  { id: 'careops-clinic-central', name: 'CareOps Klinikum', parentId: 'careops-clinics', createdAt: '2023-02-14', members: 42 },
  { id: 'careops-zuerich', name: 'CareOps Klinik Zürich', parentId: 'careops-clinics', createdAt: '2024-03-08', members: 18 },
  { id: 'careops-basel', name: 'CareOps Klinik Basel', parentId: 'careops-clinics', createdAt: '2024-04-22', members: 14 },
  { id: 'careops-ost', name: 'CareOps Klinik Ostschweiz', parentId: 'careops-clinics', createdAt: '2024-06-11', members: 21 },
  { id: 'careops-bern', name: 'CareOps Klinik Bern', parentId: 'careops-clinics', createdAt: '2025-01-17', members: 9 },
  { id: 'careops-medtech-service', name: 'CareOps Medizintechnik-Service', parentId: 'careops-clinics', createdAt: '2025-02-03', members: 6 },
  { id: 'careops-rehab', name: 'CareOps Reha-Zentrum', parentId: 'careops-clinics', createdAt: '2025-07-19', members: 4 },
  { id: 'careops-st-gallen', name: 'CareOps Klinik St. Gallen', parentId: 'careops-clinics', createdAt: '2025-03-28', members: 8 },
  { id: 'careops-winterthur', name: 'CareOps Klinik Winterthur', parentId: 'careops-clinics', createdAt: '2025-09-02', members: 5 },
  { id: 'careops-luzern', name: 'CareOps Klinik Luzern', parentId: 'careops-clinics', createdAt: '2026-02-10', members: 3 },
  ...affiliatedCareProviderNames.map((name, index) => ({
    id: `affiliated-care-provider-${index + 1}`,
    name,
    parentId: name === 'CareOps Ambulanz Ost' ? 'careops-clinics' : null,
    ...(name === 'CareOps Ambulanz Ost' ? {} : { members: stableDemoCount(name, 5) }),
  })),
]

const deploymentSeeds: Deployment[] = [
  { id: 'p1', name: 'Infusionspumpen-Rollout Station 4B', careProviderId: 'careops-basel', location: 'Kiel', latitude: 54.3233, longitude: 10.1228, createdAt: '2026-10-01T06:04', createdBy: 'M. Hansen', status: 'report' },
  { id: 'p2', name: 'Patientenmonitore Intensivstation', careProviderId: 'careops-zuerich', location: 'Bolsterlang', latitude: 47.4622, longitude: 10.2340, createdAt: '2026-09-30T14:22', createdBy: 'A. Berger', status: 'usageRecords' },
  { id: 'p3', name: 'Beatmungsgeräte Notaufnahme', careProviderId: 'careops-ost', location: 'Wels', latitude: 48.1575, longitude: 14.0288, createdAt: '2026-09-28T09:15', createdBy: 'J. Gruber', status: 'created' },
  { id: 'p4', name: '10342 Defibrillatoren Hauptgebäude', careProviderId: 'careops-clinic-central', location: 'Straßkirchen', latitude: 48.8330, longitude: 12.7200, createdAt: '2026-09-25T01:02', createdBy: 'A. Berger', status: 'usageRecords' },
  { id: 'p5', name: 'Telemetrie-Ausbau Kardiologie', careProviderId: 'careops-luzern', location: 'Zürich', latitude: 47.3769, longitude: 8.5417, createdAt: '2026-09-23T11:40', createdBy: 'S. Meier', status: 'created' },
  { id: 'p6', name: '1010901 Ultraschallgeräte Ambulanz', careProviderId: 'careops-medtech-service', location: 'Rosenheim', latitude: 47.8564, longitude: 12.1282, createdAt: '2026-09-20T02:01', createdBy: 'T. Huber', status: 'report' },
  { id: 'p7', name: 'Mobile EKG-Wagen Geriatrie', careProviderId: 'careops-st-gallen', location: 'Wien', latitude: 48.2082, longitude: 16.3738, createdAt: '2026-09-17T16:30', createdBy: 'A. Novak', status: 'usageRecords' },
  { id: 'p8', name: '1310007 Spritzenpumpen Pädiatrie', careProviderId: 'careops-basel', location: 'Hamburg', latitude: 53.5511, longitude: 9.9937, createdAt: '2026-09-14T03:04', createdBy: 'M. Hansen', status: 'report' },
  { id: 'p9', name: 'Vitaldatenmonitore Reha-Zentrum', careProviderId: 'careops-rehab', location: 'Kempten', latitude: 47.7267, longitude: 10.3139, createdAt: '2026-09-11T08:50', createdBy: 'F. Wagner', status: 'created' },
  { id: 'p10', name: '1310029 Pulsoximeter Stationen', careProviderId: 'careops-zuerich', location: 'Landshut', latitude: 48.5442, longitude: 12.1469, createdAt: '2026-09-08T03:04', createdBy: 'A. Berger', status: 'report' },
  { id: 'p11', name: 'Dialysegeräte Nephrologie', careProviderId: 'careops-winterthur', location: 'Graz', latitude: 47.0707, longitude: 15.4395, createdAt: '2026-09-06T10:12', createdBy: 'P. Steiner', status: 'created' },
  { id: 'p12', name: 'OP-Bildgebung Zentral-OP', careProviderId: 'careops-clinic-central', location: 'Regensburg', latitude: 49.0134, longitude: 12.1016, createdAt: '2026-09-04T11:05', createdBy: 'K. Weber', status: 'usageRecords' },
]

export const initialDeployments: Deployment[] = deploymentSeeds.map((deployment) => {
  const lineItemCount = 3 + stableDemoCount(`${deployment.id}-line-items`, 3)
  const lineItems = Array.from({ length: lineItemCount }, (_, index) => ({
    id: `${deployment.id}-line-item-${index + 1}`,
    label: `Position ${String(index + 1).padStart(2, '0')}`,
    quantity: 2 + stableDemoCount(`${deployment.id}-quantity-${index}`, 8),
  }))
  const deviceTypes = Array.from({ length: 2 }, (_, index) => {
    const option = deviceTypeOptions[stableDemoCount(`${deployment.id}-device-type-${index}`, deviceTypeOptions.length) - 1]
    return { ...option, id: `${deployment.id}-${option.id}` }
  })

  return {
    ...deployment,
    lineItems: deployment.lineItems?.length ? deployment.lineItems : lineItems,
    deviceTypes: deployment.deviceTypes?.length ? deployment.deviceTypes : deviceTypes,
  }
})

export const reports: Report[] = [
  { id: 'r1', deploymentName: 'Infusionspumpen-Rollout Station 4B', careProviderId: 'careops-basel', createdAt: '2026-10-01T06:04' },
  { id: 'r2', deploymentName: 'Patientenmonitore Intensivstation', careProviderId: 'careops-zuerich', createdAt: '2026-10-01T02:04' },
  { id: 'r3', deploymentName: '1010901 Ultraschallgeräte Ambulanz', careProviderId: 'careops-medtech-service', createdAt: '2026-09-27T13:10' },
  { id: 'r4', deploymentName: '1310007 Spritzenpumpen Pädiatrie', careProviderId: 'careops-basel', createdAt: '2026-09-24T09:30' },
  { id: 'r5', deploymentName: '1310029 Pulsoximeter Stationen', careProviderId: 'careops-zuerich', createdAt: '2026-09-21T15:45' },
  { id: 'r6', deploymentName: '10342 Defibrillatoren Hauptgebäude', careProviderId: 'careops-clinic-central', createdAt: '2026-09-19T08:00' },
  { id: 'r7', deploymentName: 'Mobile EKG-Wagen Geriatrie', careProviderId: 'careops-st-gallen', createdAt: '2026-09-18T12:20' },
  { id: 'r8', deploymentName: 'Beatmungsgeräte Notaufnahme', careProviderId: 'careops-ost', createdAt: '2026-09-15T10:05' },
  { id: 'r9', deploymentName: 'OP-Bildgebung Zentral-OP', careProviderId: 'careops-clinic-central', createdAt: '2026-09-12T07:40' },
  { id: 'r10', deploymentName: 'Patientenmonitore Intensivstation', careProviderId: 'careops-zuerich', createdAt: '2026-09-09T17:55' },
]

export const statusLabels: Record<DeploymentStatus, string> = {
  created: 'Erstellt',
  usageRecords: 'Daten erhalten',
  report: 'Bericht fertig',
  completed: 'Erledigt',
}

export const statusLabelsEn: Record<DeploymentStatus, string> = {
  created: 'Created',
  usageRecords: 'Data received',
  report: 'Report ready',
  completed: 'Completed',
}

export function getCareProviderName(careProviderId: string) {
  return careProviders.find((careProvider) => careProvider.id === careProviderId)?.name ?? 'Unknown'
}

export function isWithinLastMonth(iso: string) {
  const time = new Date(iso).getTime()
  return REFERENCE_DATE.getTime() - time <= ONE_MONTH_MS
}

export function formatDateTime(iso: string) {
  const [date, time = ''] = iso.split('T')
  return time ? `${date} ${time.slice(0, 5)}` : date
}

export function formatDate(iso: string) {
  return iso.split('T')[0]
}
