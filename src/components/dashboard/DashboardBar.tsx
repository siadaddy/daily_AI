import { ClockWidget } from './ClockWidget'
import { WeatherWidget } from './WeatherWidget'
import { ExchangeWidget } from './ExchangeWidget'
import { BtcWidget } from './BtcWidget'
import { KospiWidget } from './KospiWidget'

export function DashboardBar() {
  return (
    <div className="dash-bar">
      <div className="dash-scroll">
        <ClockWidget />
        <div className="dash-divider" />
        <WeatherWidget />
        <div className="dash-divider" />
        <ExchangeWidget />
        <div className="dash-divider" />
        <BtcWidget />
        <div className="dash-divider" />
        <KospiWidget />
        <div className="dash-live">
          <span className="dash-live-dot" />
          LIVE
        </div>
      </div>
    </div>
  )
}
