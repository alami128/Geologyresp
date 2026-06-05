import { execSync } from 'node:child_process'

const ports = [5173, 5174, 5175, 5176, 5177]

for (const port of ports) {
  try {
    const pids = execSync(`lsof -ti :${port}`, { encoding: 'utf8' }).trim()
    if (pids) {
      execSync(`kill -9 ${pids.split('\n').join(' ')}`)
      console.log(`Stopped process on port ${port}`)
    }
  } catch {
    // no process on this port
  }
}

console.log('Ports cleared. Starting a single dev server…')
