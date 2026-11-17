'use client'

import Link from 'next/link'
import { CowMascot, Flower, Icon, colors } from './shared'

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
              <span className="inline-block h-2 w-2 bg-[#A8B99A]" /> THE COWPASSIONATE FOOD
              COWCULATOR
            </div>
            <h1 className="mt-6 max-w-2xl text-[clamp(3.6rem,8vw,7.4rem)] font-black leading-[.82] tracking-[-.07em]">
              <span className="text-[#E9D48E]">BEE</span> IN A
              <br />
              BIG <span className="text-[#A8B99A]"> MOO-</span>
              <br />
              VEMENT.
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-[#3F382F]/75">
              Discover the footprint of your plate, choose food swaps, and rack up points for the
              planet.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/calculator" className="pixel-button">
                Cowculate my impact <Icon name="arrow" />
              </Link>
              <Link href="#how-it-works" className="pixel-button secondary">
                How it works
              </Link>
            </div>
            <Link href="/journey" className="pixel-button small secondary mt-4">
              Track a plant-based journey <Icon name="leaf" size={16} />
            </Link>
            <div className="mt-8 flex items-center gap-3 text-sm font-bold">
              <span className="flex -space-x-2">
                {['M', 'S', 'J'].map((x, i) => (
                  <i
                    key={x}
                    className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#F5F0DF] text-xs not-italic"
                    style={{ background: [colors.pink, colors.yellow, colors.green][i] }}
                  >
                    {x}
                  </i>
                ))}
              </span>
              Join the moo-vement for a kinder planet!
            </div>
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
              Can you make at least 2 dietary changes to minimize harm?
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              [
                '01',
                'Tell us what you eat',
                'Tap through a few quick questions inside our cowculator.',
              ],
              [
                '02',
                'Pick your power-ups',
                'Choose realistic swaps you would actually enjoy making.',
              ],
              ['03', 'See your impact', 'Unlock your estimated savings, points and achievements.'],
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
            <div className="pixel-label mb-4">A TINY SWAP CAN SAVE</div>
            <div className="impact-number">
              1,248<span>L</span>
            </div>
            <div className="lcd-rule" />
            <div className="flex justify-between text-xs font-black">
              <span>WATER / MONTH</span>
              <span>ESTIMATED</span>
            </div>
          </div>
          <div>
            <span className="eyebrow">WHY IT MATTERS</span>
            <h2 className="section-title text-left">
              Heavy is the hand that wields the <span>fork...</span>
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-[#3F382F]/70">
              Food choices impact animals, carbon, water, and land use. Cowculator turns complex
              science into a game!
            </p>
            <Link
              href="/calculator"
              className="mt-8 inline-flex items-center gap-2 font-black underline decoration-2 underline-offset-8"
            >
              Find my first swap <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
