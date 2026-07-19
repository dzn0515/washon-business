export default function JsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'AUTOON',
        alternateName: '오토온',
        url: 'https://autoon.kr',
        parentOrganization: {
          '@type': 'Organization',
          name: 'Sellem Inc.',
        },
      },
      {
        '@type': 'WebSite',
        name: 'AUTOON',
        url: 'https://autoon.kr',
        description:
          '차량 관리 예약과 매장 CRM 플랫폼. 세차, 타이어, 썬팅, 디테일링, 덴트 등 자동차 서비스 매장을 연결합니다.',
        inLanguage: 'ko-KR',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'AUTOON Business',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: 'https://business.autoon.kr',
        offers: {
          '@type': 'AggregateOffer',
          lowPrice: '28000',
          highPrice: '99000',
          priceCurrency: 'KRW',
          offerCount: 3,
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
