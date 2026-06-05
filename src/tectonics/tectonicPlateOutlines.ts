import outlineData from './tectonicPlateOutlines.json'

export type PlateOutlinePath = [number, number][]

export const TECTONIC_PLATE_OUTLINE_SOURCE = outlineData.source
export const TECTONIC_PLATE_OUTLINES = outlineData.paths as PlateOutlinePath[]
