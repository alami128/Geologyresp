type ExplorerLightingProps = {
  flat?: boolean
}

export function ExplorerLighting({ flat = false }: ExplorerLightingProps) {
  if (flat) {
    return (
      <>
        <color attach="background" args={['#5a9fd4']} />
        <ambientLight intensity={1.1} />
        <directionalLight position={[2, 4, 5]} intensity={0.35} />
      </>
    )
  }

  return (
    <>
      <color attach="background" args={['#020408']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 4, 5]} intensity={1.05} color="#ffffff" />
      <directionalLight position={[-4, -1, -3]} intensity={0.25} color="#8ab4d4" />
      <hemisphereLight args={['#b8d4f0', '#0a1020', 0.35]} />
    </>
  )
}
