import type { Metadata } from 'next'
import { CommunityPage } from '@/components/cowculator/community'

export const metadata: Metadata = {
  title: 'Cowculator Community',
  description: 'Share plant-based discoveries and encourage one another.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <CommunityPage />
}
