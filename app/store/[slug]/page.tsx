import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LandingFooter from '@/components/landing/LandingFooter'
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
      <main className="pb-32 pt-24">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <p className="mb-2 text-sm font-semibold text-blue-600">AUTOON 입점 매장</p>
          <h1 className="mb-6 text-3xl font-bold text-gray-900">{business.name}</h1>

          <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {business.address ? (
              <section>
                <h2 className="mb-2 text-sm font-semibold text-gray-500">주소</h2>
                <p className="text-base text-gray-800">{business.address}</p>
              </section>
            ) : null}
            {business.phone ? (
              <section>
                <h2 className="mb-2 text-sm font-semibold text-gray-500">연락처</h2>
                <p className="text-base text-gray-800">{business.phone}</p>
              </section>
            ) : null}
          </div>

          {visibleMenus.length > 0 ? (
            <section className="mt-8">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">대표 메뉴</h2>
              <ul className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {visibleMenus.map((menu) => (
                  <li key={menu.id} className="flex items-start justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">
                        {menu.name}
                        {menu.is_popular ? (
                          <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                            인기
                          </span>
                        ) : null}
                      </p>
                      {menu.description ? (
                        <p className="mt-1 text-sm text-gray-500">{menu.description}</p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-base font-semibold text-gray-900">
                      {minMenuPrice(menu).toLocaleString()}원
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-gray-500">
                차량 크기·수입 여부에 따라 가격이 달라질 수 있습니다. 상세는 앱에서 확인해 주세요.
              </p>
            </section>
          ) : null}

          <p className="mt-12 text-center text-xs text-gray-400">powered by AUTOON</p>
        </div>
      </main>
      <LandingFooter />
      <StoreOpenButton slug={slug} brandColor={brandColor} />
    </>
  )
}
