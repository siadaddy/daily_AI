'use client'

import { useRef } from 'react'
import { ClockWidget }  from './ClockWidget'
import { WeatherWidget } from './WeatherWidget'
import { ExchangeWidget } from './ExchangeWidget'
import { DxyWidget }    from './DxyWidget'
import { KospiWidget }  from './KospiWidget'
import { KosdaqWidget } from './KosdaqWidget'
import { NasdaqWidget } from './NasdaqWidget'
import { Sp500Widget }  from './Sp500Widget'
import { VixWidget }    from './VixWidget'
import { BtcWidget }    from './BtcWidget'
import { EthWidget }    from './EthWidget'
import { GoldWidget }   from './GoldWidget'
import { OilWidget }    from './OilWidget'

const Divider = () => <div className="dash-divider" />

export function DashboardBar() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 })

  const onMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current
    if (!el) return
    drag.current = { active: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft }
    el.classList.add('dash-scroll--grabbing')
  }
  const onMouseUp = () => {
    drag.current.active = false
    scrollRef.current?.classList.remove('dash-scroll--grabbing')
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current.active || !scrollRef.current) return
    e.preventDefault()
    const x    = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - drag.current.startX) * 1.2
    scrollRef.current.scrollLeft = drag.current.scrollLeft - walk
  }

  return (
    <div className="dash-bar">
      <div
        ref={scrollRef}
        className="dash-scroll dash-scroll--draggable"
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onMouseMove={onMouseMove}
      >
        <ClockWidget />
        <Divider />
        <WeatherWidget />
        <Divider />
        <ExchangeWidget />
        <Divider />
        <DxyWidget />
        <Divider />
        <KospiWidget />
        <Divider />
        <KosdaqWidget />
        <Divider />
        <NasdaqWidget />
        <Divider />
        <Sp500Widget />
        <Divider />
        <VixWidget />
        <Divider />
        <BtcWidget />
        <Divider />
        <EthWidget />
        <Divider />
        <GoldWidget />
        <Divider />
        <OilWidget />
        <div className="dash-live">
          <span className="dash-live-dot" />
          LIVE
        </div>
      </div>
    </div>
  )
}
