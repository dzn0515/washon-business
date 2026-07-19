import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://autoon.kr', lastModified: new Date(), priority: 1.0 },
    { url: 'https://autoon.kr/pricing', lastModified: new Date(), priority: 0.9 },
    { url: 'https://autoon.kr/join', lastModified: new Date(), priority: 0.9 },
    { url: 'https://autoon.kr/about', lastModified: new Date(), priority: 0.7 },
    { url: 'https://autoon.kr/privacy', lastModified: new Date(), priority: 0.3 },
    { url: 'https://autoon.kr/terms', lastModified: new Date(), priority: 0.3 },
  ]
}
