import { readdirSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'

const PLUGINS_DIR = process.env.PLUGINS_DIR || '/apps/iachat-v1/app/plugins'

/**
 * Scan a plugin type folder and load all manifest.json files.
 * Returns an array of plugin manifests with their slug and type.
 */
function scanPluginType(type) {
  const dir = join(PLUGINS_DIR, type)
  if (!existsSync(dir)) return []

  return readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const manifestPath = join(dir, d.name, 'manifest.json')
      if (!existsSync(manifestPath)) return null
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
        return { ...manifest, slug: d.name, type }
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

/**
 * Returns all available plugins grouped by type.
 */
export function getAvailablePlugins() {
  return {
    agents: scanPluginType('agents'),
    stt: scanPluginType('stt'),
    tts: scanPluginType('tts'),
  }
}
