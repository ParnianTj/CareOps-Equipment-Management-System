export type ProjectStatus = 'created' | 'datasets' | 'report' | 'completed'

export type Organization = {
  id: string
  name: string
  parentId: string | null
  createdAt?: string
  members?: number
}

export type Project = {
  id: string
  name: string
  orgId: string
  location: string
  createdAt: string
  createdBy: string
  status: ProjectStatus
  street?: string
  zip?: string
  country?: string
  latitude?: number
  longitude?: number
  reference?: string
  startDate?: string
  endDate?: string
  screwTypes?: ProjectScrew[]
  positions?: ProjectPosition[]
}

export type ProjectScrew = {
  id: string
  series: string
  name: string
}

export type ProjectPosition = {
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

export const screwSeries = [
  'E-Series',
  'F-Series',
  'G-Series',
  'K-Series',
  'M-Series',
  'U-Series',
  'V-Series',
  'V-Series 5mm 114mm',
  'V-Series 5mm 89 mm',
  'V-Series 6,3mm 140mm',
  'X-Series',
  'S-Series',
  'V-Series 6,3mm 168mm',
  'Tools',
]

const screwProductsBySeries: Record<(typeof screwSeries)[number], string[]> = {
  'E-Series': [
    'KSF E 140x1300-E76-100-K SMU-315',
    'KSF E 140x3,6x1400-E76-100 SMU-044',
    'KSF E 140x3,6x1600-E76-100',
    'KSF E 140x3,6x1300-E76-100',
    'KSF E 89x3,6x1000-E60',
    'KSF E 89x3,6x800-E60',
    'KSF E 89x3,6x550-E60',
  ],
  'F-Series': [
    'KSF F 324x4300-SMU-693',
    'KSF F 140x3,6x2100-M SMU-312',
    'KSF F 406x5000 SMU-618',
    'KSF F 406x5000 SMU-617',
    'KSF F 406x6000 SMU-616',
    'KSF F 406x6000 SMU-615',
    'KSF F 140x3,6x1600-P',
    'KSF F 140x3,6x1300-P',
    'KSF F 76x3,6x1600-R',
    'KSF F 76x2,6x1300-R',
    'KSF F 76x2,6x1000-R',
    'KSF F 76x2,6x800-R',
  ],
  'G-Series': [
    'KSF G 89x3,5x2100 4xM12 SMU-721',
    'KSF G 76x3,5x1300 4xM16',
    'KSF G 89x3.5x2500-4xM12 SMU-941',
    'KSF G 89x3,6x900 4xM12',
    'KSF G 114x3,6x1300 4xM16',
    'KSF G 89x2,6x1300 4xM12',
    'KSF G 68x2,0x550-1xM8',
    'KSF G 68x2,0x650-1xM8',
    'KSF G 68x2,0x650 3xM8',
    'KSF G 60x1,5x550-1xM6',
    'KSF G 114x3,6x1000 4xM16',
    'KSF G 76x2,6x800 4xM12',
    'KSF G 89x2,6x1000 4xM12',
    'KSF G 89x2,6x800 4xM12',
  ],
  'K-Series': [
    'KSF K 34x550',
    'KSF K 42x650',
    'KSF K 60x800',
  ],
  'M-Series': [
    'KSF M 114x3,6x2100 SMU-978',
    'KSF M 140x3,6x2100 M24 SMU-409',
    'KSF M 76x1300-M24 (SW245/F15)',
    'KSF M 76x1600-M24 (SW245/F15)',
    'KSF M 76x2100-M24 (SW245/F15)',
    'KSF M 114x1300-M24 (SW245/F15)',
    'KSF M 140x1600-M24 (SW245/F15)',
    'KSF M 140x2100-M24 (SW245/F15)',
    'KSF M 140x2600-M24 (SW245/F15)',
    'KSF M 140x3000-M24 (SW245/F15)',
    'KSF M 140x3500-M24 (SW245/F15)',
    'KSF M 76x3,6x2100 M16 SMU-447',
    'KSF M 114x3,6x2100 M24',
    'KSF M 114x3,6x1600 M24',
    'KSF M 89x3,6x2100 M24',
    'KSF M 89x3,6x1600 M24',
    'KSF M 89x3,6x1300 M24',
    'KSF M 76x3,6x2100 M16',
    'KSF M 76x3,6x1600 M16',
    'KSF M 76x3,6x1300 M16',
    'KSF M 76x2,6x1300 M12',
    'KSF M 76x2,6x1000 M12',
    'KSF M 76x2,6x800 M12',
    'KSF M 60x3,6x1000 M12 SMU-398',
  ],
  'U-Series': [
    'KSF U 60x2,0x865-111',
    'KSF U 60x2,0x730-111',
    'KSF U 60x2,0x550-71',
    'KSF U 60x2,0x730-91',
    'KSF U 60x2,0x730-71',
    'KSF U 60x2,0x865-91',
  ],
  'V-Series': [
    'KSF Vi 89x5,6x300 M24',
    'KSF Vi 89x5,6x1000 E',
    'KSF Vi 168x8,0x2000 E ROH',
    'KSF Vi 168x8,0x2000 PT ROH',
    'KSF Vi 89x5,6x2000 E',
    'KSF Vi 89x5,6x2000 PT',
    'KSF V 140x5.0-M24 (SW245/F15)',
    'KSF V 76x3,6x1500EH',
    'KSF V 76x3,6x2000 PT',
    'KSF V 76x3,6x1500 PT',
    'KSF V 76x3,6x1500 ET',
    'KSF V 76x3,6x1500 E',
    'KSF V 76x3,6x300 M16',
    'KSF V 76x3,6x860 E',
    'KSF V 76 screw set M16',
  ],
  'V-Series 5mm 114mm': [
    'KSF V 114x5 M24 SMU905',
    'KSF V 114x5x550 E SMU-441',
    'KSF V 114x5,0x860 E 100µm',
    'KSF V 114x5,0x1500 PT 100µm',
    'KSF V 114x5,0x1500 EH 100µm',
    'KSF V 114x5,0x1500 E 100µm',
    'KSF V 114x5.0-M24 (SW245/F15)',
    'KSF V 114x5,0x1500 E',
    'KSF V 114x5,0x1500 PT',
    'KSF V 114x5,0x2000 PT',
    'KSF V 114x5,0x1500 EH',
    'KSF V 114x5,0x1500 ET',
    'KSF V 114x5,0x300 M24',
    'KSF V 114x5,0x860 E',
    'KSF V 114 screw set M24',
  ],
  'V-Series 5mm 89 mm': [
    'KSF V 89x5,0x1500 EH 100µm',
    'KSF V 89x5,0x1500 ET 100µm',
    'KSF V 89x5,0x1500 PT 100µm',
    'KSF V 89x5,0x300 M24 100µm',
    'KSF V 89x5,0x1500 E 100µm',
    'KSF V 89x5,0x2000 PT 100µm',
    'KSF Vi 89x5,0x2000 E',
    'KSF Vi 89 screw set',
    'KSF V 89x5,0x2000 PT',
    'KSF V 89x5.0-M24 (SW245/F15)',
    'KSF V 89x5 M24 SMU-374 (grüne Beschichtung-U-EBA-Kennzeichnung)',
    'KSF V 89x5,0x1500 EH',
    'KSF V 89x5,0x1500 PT',
    'KSF V 89x5,0x1500 ET',
    'KSF V 89x5,0x1500 E',
    'KSF V 89x5,0x300 M24',
    'KSF V 89x5,0x860 E',
    'KSF V 89 screw set M24',
  ],
  'V-Series 6,3mm 140mm': [
    'KSF V 140x6,3x860 E 100µm',
    'KSF V 140x6,3x1500 ET 100µm',
    'KSF V 140x6,3x1500 EH 100µm',
    'KSF V 140x6,3x300 M24 100µm',
    'KSF V 140x6,3x2000 PT 100µm',
    'KSF V 140 screw set SB',
    'KSF Vi 140 screw set',
    'KSF V 140x6,3x1500 E',
    'KSF Vi 140x6,3x2000 E ROH',
    'KSF Vi 140x6,3x2000 PT ROH',
    'KSF V 140x6,3x2000 PT',
    'KSF V 140x6,3x1500 EH',
    'KSF V 140x6,3x1500 ET',
    'KSF V 140x6,3x300 M24',
    'KSF V 140x6,3x860 E',
    'KSF V 140 screw set M24',
  ],
  'X-Series': [
    'KSF X 406x5500 SMU660',
    'KSF X 406x5000 SMU697',
    'KSF X 406x4500 SMU698',
    'KSF X 406x4250 SMU692',
    'KSF X 135x480 LPS',
    'KSF X 13-34x370',
  ],
  'S-Series': [
    'KSF S 60x2800 CQ + smu-646',
  ],
  'V-Series 6,3mm 168mm': [
    'KSF V 168x6,3x1260 E+ TZN',
    'KSF V 168 Vergussköcher+ TZN',
    'KSF V 168x6,3x2000 ET+ TZN',
    'KSF V 168x6,3x1500 EH+ TZN',
    'KSF Vi 168 screw set',
    'KSF V 168 screw set M24',
    'KSF V 168x6,3x1500 ET+ TZN',
    'KSF V 168x6,3x340 M30+ TZN',
    'KSF V 168x6,3x860 E+ TZN',
    'KSF V 168x6,3x2000 PT+ TZN',
    'KSF V 168x6,3x2000 PT',
    'KSF V 168x6,3x1500 E',
    'KSF V 168x6,3x860 E',
    'KSF V 168x6,3x1500 ET',
    'KSF V 168x6,3x1500 EH',
    'KSF V 168x6,3x340 M30',
  ],
  Tools: [
    'Sondierdorn 1m D60',
    'Sondierdorn 2m D60',
    'Verdränger D324',
    'Verdränger D355',
  ],
}

export const screwOptions: ProjectScrew[] = screwSeries.flatMap((series, seriesIndex) =>
  screwProductsBySeries[series].map((name, productIndex) => ({
    id: `screw-${seriesIndex + 1}-${productIndex + 1}`,
    series,
    name,
  })),
)

export type Report = {
  id: string
  projectName: string
  orgId: string
  createdAt: string
  projectId?: string
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

const dominikOrganizationNames = [
  'Roth Zaun AG',
  'G.A.O. Construction Bois Sàrl',
  'Affolter Metall Kambium Montagen GmbH',
  'ProBAS GmbH',
  'Ihre Zaunwelt AG',
  'Schmidlin Holzbau AG',
  'Wahl Glas- und Metallbau AG',
  'Trüb',
  'Easy-Fundament GmbH',
  'Mitterhuemer Energietechnik GmbH',
  'Grabmale Wachter GmbH',
  'Baumaschinen Schmitter GmbH',
  'Manfred Schlienz GmbH',
  'Glashaus Rehm GmbH',
  'Raumausstattung Heiß',
  'Formschön Clemens Buck GmbH',
  'Fersch GmbH',
  'E. SCHLEGEL GmbH Rolladen + Sonnenschutz',
  'holzbau21 GmbH',
  'GoldmannLindenberger GmbH + Co. KG',
  'Schaffert Sonnenschutz',
  'Pfeiffer Segel Service',
  'BUCHBERGER Baugeräte Handel GmbH',
  'Klaus Oßwald Drucklufttechnik',
  'VIL Bausysteme GmbH',
  'KONRAD KLEINER GmbH',
  'Schraubfundamente Lindau',
  'Holzbau Zimmerei Merz',
  'Zimmerei Pfeffer GmbH',
  'hochkant GmbH',
  'Elser Holzbau',
  'Theodor Wölpert GmbH & Co. KG',
  'Diederichs Pflasterbau GmbH',
  'Cambium GmbH',
  'Atelier Leon.hms SOLONA Sonnenschutz',
  'Florian Buchner',
  'Jutech',
  'Gmünder Gartenwelten GmbH',
  'engintec GmbH',
]

export const organizations: Organization[] = [
  { id: 'z-part-group', name: 'Z-part group', parentId: null, createdAt: '2023-01-12' },
  { id: 'schlienz-group', name: 'Schlienz', parentId: null },
  { id: 'schlienz', name: 'Schlienz GmbH', parentId: 'schlienz-group', createdAt: '2023-02-14', members: 42 },
  { id: 'schlienz-zuerich', name: 'Schlienz Zürich', parentId: 'schlienz-group', createdAt: '2024-03-08', members: 18 },
  { id: 'schlienz-basel', name: 'Schlienz Basel', parentId: 'schlienz-group', createdAt: '2024-04-22', members: 14 },
  { id: 'schlienz-ost', name: 'Schlienz Ostschweiz', parentId: 'schlienz-group', createdAt: '2024-06-11', members: 21 },
  { id: 'schlienz-bern', name: 'Schlienz Bern', parentId: 'schlienz-group', createdAt: '2025-01-17', members: 9 },
  { id: 'schlienz-bau-montage', name: 'Schlienz Bau & Montage', parentId: 'schlienz-group', createdAt: '2025-02-03', members: 6 },
  { id: 'schlienz-tiefbau', name: 'Schlienz Tiefbau', parentId: 'schlienz-group', createdAt: '2025-07-19', members: 4 },
  { id: 'schlienz-st-gallen', name: 'Schlienz St. Gallen', parentId: 'schlienz-group', createdAt: '2025-03-28', members: 8 },
  { id: 'schlienz-winterthur', name: 'Schlienz Winterthur', parentId: 'schlienz-group', createdAt: '2025-09-02', members: 5 },
  { id: 'schlienz-luzern', name: 'Schlienz Luzern', parentId: 'schlienz-group', createdAt: '2026-02-10', members: 3 },
  ...dominikOrganizationNames.map((name, index) => ({
    id: `dominik-org-${index + 1}`,
    name,
    parentId: name === 'Manfred Schlienz GmbH' ? 'schlienz-group' : null,
    ...(name === 'Manfred Schlienz GmbH' ? {} : { members: stableDemoCount(name, 5) }),
  })),
]

export const initialProjects: Project[] = [
  { id: 'p1', name: 'Testung Kirche Knooper Weg', orgId: 'schlienz-basel', location: 'Kiel', latitude: 54.3233, longitude: 10.1228, createdAt: '2026-10-01T06:04', createdBy: 'M. Hansen', status: 'report' },
  { id: 'p2', name: 'DE-26 Hörnerbahn Raupenabspannung', orgId: 'schlienz-zuerich', location: 'Bolsterlang', latitude: 47.4622, longitude: 10.2340, createdAt: '2026-09-30T14:22', createdBy: 'D. Züger', status: 'datasets' },
  { id: 'p3', name: 'Solarpark Wels Ost', orgId: 'schlienz-ost', location: 'Wels', latitude: 48.1575, longitude: 14.0288, createdAt: '2026-09-28T09:15', createdBy: 'J. Gruber', status: 'created' },
  { id: 'p4', name: '10342 Winden', orgId: 'schlienz', location: 'Straßkirchen', latitude: 48.8330, longitude: 12.7200, createdAt: '2026-09-25T01:02', createdBy: 'D. Züger', status: 'datasets' },
  { id: 'p5', name: 'Carport Anlage Zürich-Nord', orgId: 'schlienz-luzern', location: 'Zürich', latitude: 47.3769, longitude: 8.5417, createdAt: '2026-09-23T11:40', createdBy: 'S. Meier', status: 'created' },
  { id: 'p6', name: '1010901 Lärmschutzwand A8', orgId: 'schlienz-bau-montage', location: 'Rosenheim', latitude: 47.8564, longitude: 12.1282, createdAt: '2026-09-20T02:01', createdBy: 'T. Huber', status: 'report' },
  { id: 'p7', name: 'Messestand Wien Prater', orgId: 'schlienz-st-gallen', location: 'Wien', latitude: 48.2082, longitude: 16.3738, createdAt: '2026-09-17T16:30', createdBy: 'A. Novak', status: 'datasets' },
  { id: 'p8', name: '1310007 Zaunanlage Hafen', orgId: 'schlienz-basel', location: 'Hamburg', latitude: 53.5511, longitude: 9.9937, createdAt: '2026-09-14T03:04', createdBy: 'M. Hansen', status: 'report' },
  { id: 'p9', name: 'PV Freifläche Kempten', orgId: 'schlienz-tiefbau', location: 'Kempten', latitude: 47.7267, longitude: 10.3139, createdAt: '2026-09-11T08:50', createdBy: 'F. Wagner', status: 'created' },
  { id: 'p10', name: '1310029 Beschilderung B15', orgId: 'schlienz-zuerich', location: 'Landshut', latitude: 48.5442, longitude: 12.1469, createdAt: '2026-09-08T03:04', createdBy: 'D. Züger', status: 'report' },
  { id: 'p11', name: 'Terrassenbau Graz Andritz', orgId: 'schlienz-winterthur', location: 'Graz', latitude: 47.0707, longitude: 15.4395, createdAt: '2026-09-06T10:12', createdBy: 'P. Steiner', status: 'created' },
  { id: 'p12', name: 'BA Living Circles', orgId: 'schlienz', location: 'Regensburg', latitude: 49.0134, longitude: 12.1016, createdAt: '2026-09-04T11:05', createdBy: 'K. Weber', status: 'datasets' },
].map((project) => {
  const positionCount = 3 + stableDemoCount(`${project.id}-positions`, 3)
  const positions = Array.from({ length: positionCount }, (_, index) => ({
    id: `${project.id}-position-${index + 1}`,
    label: `Position ${String(index + 1).padStart(2, '0')}`,
    quantity: 2 + stableDemoCount(`${project.id}-quantity-${index}`, 8),
  }))
  const screwTypes = Array.from({ length: 2 }, (_, index) => {
    const option = screwOptions[stableDemoCount(`${project.id}-screw-${index}`, screwOptions.length) - 1]
    return { ...option, id: `${project.id}-${option.id}` }
  })

  return {
    ...project,
    positions: project.positions?.length ? project.positions : positions,
    screwTypes: project.screwTypes?.length ? project.screwTypes : screwTypes,
  }
})

export const reports: Report[] = [
  { id: 'r1', projectName: 'Testung Kirche Knooper Weg', orgId: 'schlienz-basel', createdAt: '2026-10-01T06:04' },
  { id: 'r2', projectName: 'DE-26 Hörnerbahn Raupenabspannung', orgId: 'schlienz-zuerich', createdAt: '2026-10-01T02:04' },
  { id: 'r3', projectName: '1010901 Lärmschutzwand A8', orgId: 'schlienz-bau-montage', createdAt: '2026-09-27T13:10' },
  { id: 'r4', projectName: '1310007 Zaunanlage Hafen', orgId: 'schlienz-basel', createdAt: '2026-09-24T09:30' },
  { id: 'r5', projectName: '1310029 Beschilderung B15', orgId: 'schlienz-zuerich', createdAt: '2026-09-21T15:45' },
  { id: 'r6', projectName: '10342 Winden', orgId: 'schlienz', createdAt: '2026-09-19T08:00' },
  { id: 'r7', projectName: 'Messestand Wien Prater', orgId: 'schlienz-st-gallen', createdAt: '2026-09-18T12:20' },
  { id: 'r8', projectName: 'Solarpark Wels Ost', orgId: 'schlienz-ost', createdAt: '2026-09-15T10:05' },
  { id: 'r9', projectName: 'BA Living Circles', orgId: 'schlienz', createdAt: '2026-09-12T07:40' },
  { id: 'r10', projectName: 'DE-26 Hörnerbahn Raupenabspannung', orgId: 'schlienz-zuerich', createdAt: '2026-09-09T17:55' },
]

export const statusLabels: Record<ProjectStatus, string> = {
  created: 'Erstellt',
  datasets: 'Daten erhalten',
  report: 'Bericht fertig',
  completed: 'Erledigt',
}

export function getOrgName(orgId: string) {
  return organizations.find((org) => org.id === orgId)?.name ?? 'Unknown'
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
