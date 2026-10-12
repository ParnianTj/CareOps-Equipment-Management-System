export type Measurement = {
  index: number
  time: number
  torque: number
  travel: number
  rpm: number | null
}

export type Dataset = {
  id: number
  date: string
  timestamp: string
  distance: number
  torque: number
  serial: string
  note: string
  screw: string
  process: string
  project: string | null
  position: string | null
  feedback: string | null
  gpsTimestamp: string | null
  gpsQuality: number | null
  gpsSatellites: number | null
  latitude: number | null
  longitude: number | null
  userId: number | null
  linked: boolean
  disabled: boolean
  hasRpm: boolean
}

const groupSeeds = [
  ['2023-04-12', 2],
  ['2023-05-31', 2],
  ['2024-04-25', 2],
  ['2024-06-14', 5],
  ['2024-12-12', 3],
  ['2025-04-26', 21],
  ['2025-04-29', 3],
  ['2025-05-12', 1],
  ['2025-05-21', 1],
  ['2026-07-04', 1],
] as const

const projects = [
  'Testung Kirche Knooper Weg',
  'DE-26 Hörnerbahn Raupenabspannung',
  'Solarpark Wels Ost',
  '10342 Winden',
  'Carport Anlage Zürich-Nord',
  '1010901 Lärmschutzwand A8',
] as const

export const datasetGroups = groupSeeds.map(([date, count]) => ({ date, count }))

export const sampleDatasets: Dataset[] = groupSeeds.flatMap(([date, count], groupIndex) =>
  Array.from({ length: count }, (_, rowIndex) => {
    const id = 199 + groupSeeds.slice(0, groupIndex).reduce((total, [, previousCount]) => total + previousCount, 0) + rowIndex
    const hour = 11 + Math.floor(rowIndex / 4)
    const minute = (3 + rowIndex * 7) % 60
    const second = (11 + rowIndex * 13) % 60
    const linked = id % 5 === 0 && id !== 200

    return {
      id,
      date,
      timestamp: `${date} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`,
      distance: id === 199 ? 101 : 98 + ((id * 13) % 92),
      torque: id === 199 ? 12112 : 9400 + ((id * 173) % 6900),
      serial: `KRINNER Doku-Kit #${String(29 + ((id - 199) % 18)).padStart(4, '0')}`,
      note: id === 199 ? 'KSF 406 x 6000' : id % 3 === 0 ? 'Prüfung Fundament' : '',
      screw: 'KSF F 406x6000 SMU-616',
      process: 'Einschrauben',
      project: linked ? projects[id % projects.length] : null,
      position: linked ? `Position ${String((id % 12) + 1).padStart(2, '0')}` : null,
      feedback: linked ? 'Montage erfolgreich' : null,
      gpsTimestamp: id === 199 ? '2023-04-12 11:27:11' : null,
      gpsQuality: id === 199 ? 2 : null,
      gpsSatellites: id === 199 ? 12 : null,
      latitude: null,
      longitude: null,
      userId: id === 199 ? 27 : null,
      linked,
      disabled: false,
      hasRpm: id % 4 === 0,
    } satisfies Dataset
  }),
)

export function createSampleMeasurements(dataset: Dataset): Measurement[] {
  return Array.from({ length: dataset.id === 199 ? 1309 : 420 }, (_, index) => {
    const progress = index / (dataset.id === 199 ? 1308 : 419)
    const torque = Math.min(
      dataset.torque,
      progress * dataset.torque +
        Math.sin(progress * Math.PI * 5) * 35 +
        Math.sin(progress * Math.PI * 24) * 8,
    )
    return {
      index: index + 1,
      time: Number((index * 0.05).toFixed(2)),
      torque: Number(torque.toFixed(1)),
      travel: Number((progress * dataset.distance).toFixed(2)),
      rpm: dataset.hasRpm ? Math.max(0, Math.round(52 + Math.sin(index / 7) * 18)) : null,
    }
  })
}

export function datasetDisplayValue(value: string | number | null | undefined, fallback = 'Keine Angabe') {
  return value === null || value === undefined || value === '' ? fallback : String(value)
}
