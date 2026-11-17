'use client'

import Link from 'next/link'
import { CowMascot, Flower, Icon } from './shared'

export function LandingPage() {
  return (
    <main className="overflow-hidden">
      <section className="hero-grid relative">
        <div className="absolute left-[5%] top-[18%] text-[#E9D48E]">
          <Icon name="spark" size={32} />
        </div>
        <div className="absolute right-[8%] top-[14%] text-[#E9B8B0]">
          <Icon name="spark" size={24} />
        </div>
        <div className="mx-auto grid min-h-[720px] max-w-[1180px] items-center gap-12 px-5 py-16 md:grid-cols-[1.05fr_.95fr] lg:px-8">
          <div className="relative z-10">
            <div className="eyebrow">
              <span className="inline-block h-2 w-2 bg-[#A8B99A]" /> PLANT-BASED PROGRESS FOR REAL
              LIFE
            </div>
            <h1 className="mt-6 max-w-2xl text-[clamp(3.6rem,8vw,7.4rem)] font-black leading-[.82] tracking-[-.07em]">
              <span className="text-[#E9D48E]">BEE</span> IN A
              <br />
              BIG <span className="text-[#A8B99A]"> MOO-</span>
              <br />
              VEMENT.
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-[#3F382F]/75">
              Thinking about going vegan, or already there? Find realistic food swaps, compare cost
              and environmental estimates, and track the steps that fit your life.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/journey" className="pixel-button">
                Start my plant-based journey <Icon name="leaf" />
              </Link>
              <Link href="/swaps" className="pixel-button secondary">
                Explore food swaps
              </Link>
            </div>
            <p className="mt-5 text-sm leading-6 text-[#3F382F]/65">
              Explore without an account; sign in only to save check-ins. No perfect start or streak
              required.{' '}
              <Link href="/calculator" className="font-bold underline underline-offset-2">
                Prefer a numbers-first start?
              </Link>
            </p>
          </div>
          <div className="relative flex min-h-[520px] items-center justify-center">
            <div className="sun-disc" />
            <CowMascot />
            <Flower className="absolute bottom-8 left-5" />
            <Flower className="absolute right-2 top-20 scale-75" />
          </div>
        </div>
        <div className="pixel-grass" />
      </section>

      <section id="how-it-works" className="bg-white px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">HOW IT WORKS</span>
            <h2 className="section-title">
              FROM COMPASSION TO <span>ACTION</span>
            </h2>
            <p className="mt-4 text-[#3F382F]/65">
              Start where you are. There is no required number of changes.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              [
                '01',
                'Choose your starting point',
                'Try one plant-based meal, explore a transition, or optimize a vegan routine.',
              ],
              [
                '02',
                'Find swaps that fit',
                'Compare foods by cost and environmental estimates, then choose what works for you.',
              ],
              [
                '03',
                'Learn and grow',
                'Track optional check-ins, explore sources, and connect with friends at your own pace.',
              ],
            ].map(([n, title, copy], i) => (
              <article className="step-card" key={n}>
                <span className="step-number">{n}</span>
                <div className={`step-icon step-${i}`}>
                  <Icon name={i === 0 ? 'chart' : i === 1 ? 'leaf' : 'trophy'} size={34} />
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 lg:px-8">
        <div className="mx-auto grid max-w-[1180px] items-center gap-14 md:grid-cols-2">
          <div className="impact-preview">
            <div className="pixel-label mb-4">NO PERFECT START REQUIRED</div>
            <div className="impact-number">
              ONE <span>STEP</span>
            </div>
            <div className="lcd-rule" />
            <div className="flex justify-between text-xs font-black">
              <span>YOUR PACE</span>
              <span>YOUR CHOICE</span>
            </div>
          </div>
          <div>
            <span className="eyebrow">WHY IT MATTERS</span>
            <h2 className="section-title text-left">
              Make choices with <span>care...</span>
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-[#3F382F]/70">
              Food can affect animals and the environment, but no single estimate captures every
              person&apos;s budget, culture, access, or health needs. Explore the assumptions and
              sources, then choose practical next steps without chasing a perfect score.
            </p>
            <Link
              href="/swaps"
              className="mt-8 inline-flex items-center gap-2 font-black underline decoration-2 underline-offset-8"
            >
              Explore food swaps <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
