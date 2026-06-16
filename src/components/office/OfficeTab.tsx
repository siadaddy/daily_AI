import { OfficeCanvas } from './OfficeCanvas'
import { AgentStatusPanel } from './AgentStatusPanel'
import { ActivityLog } from './ActivityLog'

export function OfficeTab() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Canvas */}
        <div
          className="h-80 overflow-hidden rounded-2xl lg:col-span-2"
          style={{ border: '1px solid var(--border)' }}
        >
          <OfficeCanvas />
        </div>

        {/* Agent status */}
        <AgentStatusPanel />
      </div>

      {/* Activity log */}
      <ActivityLog />
    </div>
  )
}
