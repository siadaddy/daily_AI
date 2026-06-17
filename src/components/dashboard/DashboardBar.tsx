'use client'

import { ClockWidget }   from './ClockWidget'
import { WeatherWidget }  from './WeatherWidget'
import { ExchangeWidget } from './ExchangeWidget'
import { DxyWidget }     from './DxyWidget'
import { KospiWidget }   from './KospiWidget'
import { KosdaqWidget }  from './KosdaqWidget'
import { NasdaqWidget }  from './NasdaqWidget'
import { Sp500Widget }   from './Sp500Widget'
import { VixWidget }     from './VixWidget'
import { BtcWidget }     from './BtcWidget'
import { EthWidget }     from './EthWidget'
import { GoldWidget }    from './GoldWidget'
import { OilWidget }     from './OilWidget'

const Divider = () => <div className="dash-divider" />

// 위젯 목록을 컴포넌트 배열로 정의해 두 번 렌더링 (무한 루프용 복제)
function WidgetRow() {
  return (
    <>
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
      <div className="dash-track-gap" />
    </>
  )
}

export function DashboardBar() {
  return (
    <div className="dash-bar">
      <div className="dash-scroll">
        {/* 원본 + 복제본을 이어 붙여 끊김 없는 루프 구현 */}
        <div className="dash-track" aria-hidden="false">
          <WidgetRow />
        </div>
        <div className="dash-track" aria-hidden="true">
          <WidgetRow />
        </div>
      </div>
    </div>
  )
}
