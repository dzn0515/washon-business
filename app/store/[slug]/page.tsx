import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import StoreFooter from '@/components/store/StoreFooter'
import StoreLandingNav from '@/components/store/StoreLandingNav'
import StoreOpenButton from '@/components/store/StoreOpenButton'
import { minMenuPrice, publicFetch, type PublicBusiness, type PublicMenu } from '@/lib/public-api'
import { getStoreWebUrl, normalizeStoreSlug } from '@/lib/store-links'

type PageProps = {
  params: { slug: string }
}

async function loadStore(slug: string): Promise<{ business: PublicBusiness; menus: PublicMenu[] } | null> {
  const encoded = encodeURIComponent(slug)
  try {
    const [business, menus] = await Promise.all([
      publicFetch<PublicBusiness>(`/public/${encoded}`, { next: { revalidate: 60 } }),
      publicFetch<PublicMenu[]>(`/public/${encoded}/menus`, { next: { revalidate: 60 } }),
    ])
    return { business, menus }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = normalizeStoreSlug(params.slug)
  const data = await loadStore(slug)

  if (!data) {
    return {
      title: '매장을 찾을 수 없습니다 | AUTOON',
      description: '요청하신 매장 정보를 찾을 수 없습니다.',
    }
  }

  const { business } = data
  const url = getStoreWebUrl(slug)
  const description = `${business.name} — AUTOON 앱에서 예약하세요. ${business.address}`

  return {
    title: `${business.name} | AUTOON`,
    description,
    openGraph: {
      title: `${business.name} | AUTOON`,
      description,
      url,
      type: 'website',
    },
  }
}

export default async function StoreLandingPage({ params }: PageProps) {
  const slug = normalizeStoreSlug(params.slug)
  const data = await loadStore(slug)

  if (!data) {
    notFound()
  }

  const { business, menus } = data
  const brandColor = business.brand_color || '#1A6DFF'
  const visibleMenus = menus.filter((m) => m.prices.length > 0)

  return (
    <>
      <StoreLandingNav />
      <main
        className="mx-auto w-full max-w-lg px-4 pt-[calc(3.75rem+env(safe-area-inset-top,0px))] pb-6"
        style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <p className="mb-1 text-xs font-semibold text-blue-600">AUTOON 입점 매장</p>
        <h1 className="mb-5 break-words text-2xl font-bold leading-snug text-gray-900 sm:text-3xl">
          {business.name}
        </h1>

        <div className="w-full max-w-full space-y-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          {business.address ? (
            <section className="min-w-0">
              <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">주소</h2>
              <p className="break-words text-sm leading-relaxed text-gray-800 sm:text-base">{business.address}</p>
            </section>
          ) : null}
          {business.phone ? (
            <section className="min-w-0">
              <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">연락처</h2>
              <p className="break-words text-sm text-gray-800 sm:text-base">{business.phone}</p>
            </section>
          ) : null}
        </div>

        {visibleMenus.length > 0 ? (
          <section className="mt-6 w-full max-w-full">
            <h2 className="mb-3 text-base font-semibold text-gray-900 sm:text-lg">대표 메뉴</h2>
            <ul className="w-full max-w-full divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {visibleMenus.map((menu) => (
                <li
                  key={menu.id}
                  className="flex min-w-0 flex-col gap-1.5 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5 sm:py-4"
                >
                  <div className="min-w-0 w-full flex-1">
                    <p className="break-words font-medium leading-snug text-gray-900">
                      {menu.name}
                      {menu.is_popular ? (
                        <span className="ml-1.5 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 align-middle">
                          인기
                        </span>
                      ) : null}
                    </p>
                    {menu.description ? (
                      <p className="mt-1 break-words text-xs leading-relaxed text-gray-500 sm:text-sm">
                        {menu.description}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-gray-900 sm:text-base">
                    {minMenuPrice(menu).toLocaleString()}원
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-2.5 break-words text-xs leading-relaxed text-gray-500 sm:text-sm">
              차량 크기·수입 여부에 따라 가격이 달라질 수 있습니다. 상세는 앱에서 확인해 주세요.
            </p>
          </section>
        ) : null}
      </main>
      <StoreFooter />
      <StoreOpenButton slug={slug} brandColor={brandColor} />
    </>
  )
}
