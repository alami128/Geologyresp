import plateData from './tectonicPlateLabels.json'

export type TectonicPlateLabel = {
  code: string
  name: string
  lat: number
  lon: number
  tier: 'major' | 'minor'
  vertices: number
}

export const TECTONIC_PLATE_LABEL_SOURCE = plateData.source
export const TECTONIC_PLATES = plateData.plates as TectonicPlateLabel[]

export function getPlateByCode(code: string): TectonicPlateLabel | undefined {
  return TECTONIC_PLATES.find((plate) => plate.code === code)
}
