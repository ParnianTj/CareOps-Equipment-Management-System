export type Measurement = {
  index: number
  time: number
  powerDraw: number
  batteryVoltage: number
  coolingFanSpeed: number | null
}

export type UsageRecord = {
  id: number
  date: string
  timestamp: string
  batteryVoltage: number
  powerDraw: number
  serial: string
  note: string
  deviceType: string
  process: string
  deployment: string | null
  lineItem: string | null
  feedback: string | null
  gpsTimestamp: string | null
  gpsQuality: number | null
  gpsSatellites: number | null
  latitude: number | null
  longitude: number | null
  userId: number | null
  linked: boolean
  disabled: boolean
  hasCoolingFanSpeed: boolean
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

const deployments = [
  'Infusionspumpen-Rollout Station 4B',
  'Patientenmonitore Intensivstation',
  'Beatmungsgeräte Notaufnahme',
  '10342 Defibrillatoren Hauptgebäude',
  'Telemetrie-Ausbau Kardiologie',
  '1010901 Ultraschallgeräte Ambulanz',
] as const

export const usageRecordGroups = groupSeeds.map(([date, count]) => ({ date, count }))

export const sampleUsageRecords: UsageRecord[] = groupSeeds.flatMap(([date, count], groupIndex) =>
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
      batteryVoltage: id === 199 ? 101 : 98 + ((id * 13) % 92),
      powerDraw: id === 199 ? 12112 : 9400 + ((id * 173) % 6900),
      serial: `CareOps DataLogger #${String(29 + ((id - 199) % 18)).padStart(4, '0')}`,
      note: id === 199 ? 'Erstinbetriebnahme InfuMed 300' : id % 3 === 0 ? 'Funktionsprüfung' : '',
      deviceType: 'CareOps InfuMed 300',
      process: 'Einschalt-Selbsttest',
      deployment: linked ? deployments[id % deployments.length] : null,
      lineItem: linked ? `Position ${String((id % 12) + 1).padStart(2, '0')}` : null,
      feedback: linked ? 'Inbetriebnahme erfolgreich' : null,
      gpsTimestamp: id === 199 ? '2023-04-12 11:27:11' : null,
      gpsQuality: id === 199 ? 2 : null,
      gpsSatellites: id === 199 ? 12 : null,
      latitude: null,
      longitude: null,
      userId: id === 199 ? 27 : null,
      linked,
      disabled: false,
      hasCoolingFanSpeed: id % 4 === 0,
    } satisfies UsageRecord
  }),
)

export function createSampleMeasurements(usageRecord: UsageRecord): Measurement[] {
  return Array.from({ length: usageRecord.id === 199 ? 1309 : 420 }, (_, index) => {
    const progress = index / (usageRecord.id === 199 ? 1308 : 419)
    const powerDraw = Math.min(
      usageRecord.powerDraw,
      progress * usageRecord.powerDraw +
        Math.sin(progress * Math.PI * 5) * 35 +
        Math.sin(progress * Math.PI * 24) * 8,
    )
    return {
      index: index + 1,
      time: Number((index * 0.05).toFixed(2)),
      powerDraw: Number(powerDraw.toFixed(1)),
      batteryVoltage: Number((progress * usageRecord.batteryVoltage).toFixed(2)),
      coolingFanSpeed: usageRecord.hasCoolingFanSpeed ? Math.max(0, Math.round(52 + Math.sin(index / 7) * 18)) : null,
    }
  })
}

export function usageRecordDisplayValue(value: string | number | null | undefined, fallback = 'Keine Angabe') {
  return value === null || value === undefined || value === '' ? fallback : String(value)
}
