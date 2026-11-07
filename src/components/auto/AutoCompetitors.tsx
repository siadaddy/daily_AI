import { ArrowUpRight } from 'lucide-react'
import { fetchCompetitorLog } from '@/lib/auto/query'
import {
  ITEM_LABEL,
  ITEM_ORDER,
  buildCompetitorMatrix,
} from '@/lib/auto/topics'

export async function AutoCompetitors() {
  const rows = await fetchCompetitorLog()
  const { brands, cells } = buildCompetitorMatrix(rows)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <p className="kicker kicker-accent">최근 90일 · 기록 {rows.length}건</p>
        <h2 className="ed-headline text-[2rem]">경쟁사 서비스 동향</h2>
        <p className="ed-lede max-w-3xl text-[0.875rem]">
          기사에 사실로 명시된 서비스 정책·가격·캠페인·리콜만 누적합니다. 칸마다
          가장 최근 기록 하나를 보여주며, 근거 기사로 이동할 수 있습니다.
        </p>
      </header>

      {brands.length === 0 ? (
        <p className="ed-lede py-16 text-center">
          아직 쌓인 경쟁사 기록이 없습니다. 기사에서 사실이 확인될 때마다 이
          표가 채워집니다.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[0.8125rem]">
            <caption className="sr-only">
              브랜드별 서비스 정책, 가격, 캠페인, 리콜 최신 기록
            </caption>
            <thead>
              <tr className="border-b-2 border-[var(--rule-strong)]">
                <th scope="col" className="kicker py-2 pr-4 font-normal">
                  브랜드
                </th>
                {ITEM_ORDER.map((item) => (
                  <th
                    key={item}
                    scope="col"
                    className="kicker py-2 pr-4 font-normal"
                  >
                    {ITEM_LABEL[item]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr
                  key={brand}
                  className="border-b border-[var(--rule)] align-top"
                >
                  <th
                    scope="row"
                    className="ed-display py-3 pr-4 text-[0.9375rem]"
                  >
                    {brand}
                  </th>
                  {ITEM_ORDER.map((item) => {
                    const cell = cells[brand]?.[item]
                    return (
                      <td key={item} className="py-3 pr-4">
                        {cell ? (
                          <>
                            <span className="kicker block">{cell.date}</span>
                            {cell.source_link ? (
                              <a
                                href={cell.source_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {cell.note}
                                <ArrowUpRight
                                  size={11}
                                  strokeWidth={2}
                                  aria-hidden="true"
                                  className="ml-0.5 inline"
                                  style={{ color: 'var(--muted)' }}
                                />
                              </a>
                            ) : (
                              cell.note
                            )}
                          </>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
