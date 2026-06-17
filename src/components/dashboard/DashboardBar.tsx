'use client'

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

function WidgetRow() {
  return (
    <>
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
      <div className="dash-track-gap" />
    </>
  )
}

export function DashboardBar() {
  return (
    <div className="dash-bar">
      <div className="dash-scroll">
        {/*
          하나의 트랙 안에 원본+복제본을 순서대로 배치.
          translateX(0 → -50%) 하면 정확히 원본 1벌 이동 후 루프.
        */}
        <div className="dash-track">
          <WidgetRow />
          <WidgetRow />
        </div>
      </div>
    </div>
  )
}
