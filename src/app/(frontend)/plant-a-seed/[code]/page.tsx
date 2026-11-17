import { notFound, redirect } from 'next/navigation'

export default async function PlantASeedPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  if (!/^[a-f0-9]{24}$/i.test(code)) notFound()

  redirect(`/signup?ref=${encodeURIComponent(code.toLowerCase())}`)
}
