import { useCallback, useState } from 'react'
import { EarthView } from './EarthView'
import { SolarSystemView } from './SolarSystemView'

const SCREEN_FADE_MS = 550
const EARTH_ENTER_DELAY_MS = 120

type AppScreen = 'solar-system' | 'earth'

export function TectonicsApp() {
  const [screen, setScreen] = useState<AppScreen>('solar-system')
  const [fading, setFading] = useState(false)
  const [earthReady, setEarthReady] = useState(false)

  const changeScreen = useCallback((next: AppScreen) => {
    if (next === 'earth') {
      setFading(true)
      setEarthReady(false)
      window.setTimeout(() => {
        setScreen('earth')
        window.setTimeout(() => {
          setFading(false)
          window.setTimeout(() => setEarthReady(true), EARTH_ENTER_DELAY_MS)
        }, SCREEN_FADE_MS)
      }, 80)
      return
    }

    setEarthReady(false)
    setFading(true)
    window.setTimeout(() => {
      setScreen(next)
      setFading(false)
    }, SCREEN_FADE_MS)
  }, [])

  return (
    <div className={`tectonics-root${fading ? ' tectonics-root--fade' : ''}`}>
      {screen === 'solar-system' ? (
        <SolarSystemView onSelectEarth={() => changeScreen('earth')} />
      ) : (
        <EarthView ready={earthReady} onBack={() => changeScreen('solar-system')} />
      )}
    </div>
  )
}
