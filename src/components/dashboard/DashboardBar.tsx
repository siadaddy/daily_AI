'use client'

import { useState } from 'react'
import { ExchangeWidget } from './ExchangeWidget'
import { DxyWidget } from './DxyWidget'
import { KospiWidget } from './KospiWidget'
import { KosdaqWidget } from './KosdaqWidget'
import { NasdaqWidget } from './NasdaqWidget'
import { Sp500Widget } from './Sp500Widget'
import { VixWidget } from './VixWidget'
import { BtcWidget } from './BtcWidget'
import { EthWidget } from './EthWidget'
import { GoldWidget } from './GoldWidget'
import { OilWidget } from './OilWidget'

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
  // 터치 기기는 :hover로 마퀴를 멈출 수 없으므로, 탭할 때마다 정지/재생을 토글한다.
  const [paused, setPaused] = useState(false)

  return (
    <div className="dash-bar">
      <div
        className={['dash-scroll', paused && 'dash-scroll--paused']
          .filter(Boolean)
          .join(' ')}
        onTouchStart={() => setPaused((p) => !p)}
        aria-label="실시간 시장 지표 (탭하여 정지/재생)"
      >
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
