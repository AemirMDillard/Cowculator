'use client'

import Link from 'next/link'
import { Icon, colors } from './shared'
import { ErrorMessage, LoadingMessage, StatCard, formatSignedNumber, useImpactData } from './impact'
import { ImpactGuide } from './impact-guide'

export function ResultsPage() {
  const { data, loading, error } = useImpactData()

  if (loading) {
    return (
      <main className="page-shell results-bg">
        <div className="mx-auto max-w-[1180px] px-5 py-14">
          <LoadingMessage />
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="page-shell results-bg">
        <div className="mx-auto max-w-[1180px] px-5 py-14">
          <ErrorMessage message={error || 'Impact data is unavailable.'} />
        </div>
      </main>
    )
  }

  const impact = data.projectedImpact
  const isVegan = data.estimateBasis === 'not-applicable'
  const isAnnual = data.estimateBasis !== 'per-100g'
  const hasImpact = data.quantifiedSwapCount > 0 && !isVegan
  const basis = isAnnual ? 'annual' : 'per-100g'

  return (
    <main className="page-shell results-bg">
      <div className="mx-auto max-w-[1180px] px-5 py-14 lg:px-8">
        <div className="result-banner">
          <div>
            <span className="pixel-label text-[#E9D48E]">
              {isVegan ? 'PLANT-BASED EXPLORER' : 'SWAPS COMPLETE'}
            </span>
            <h1>
              {isVegan ? (
                <>
                  YOUR PLANT-BASED
                  <br />
                  JOURNEY CONTINUES.
                </>
              ) : (
                <>
                  LOOK AT YOU,
                  <br />
                  PLANET PAL!
                </>
              )}
            </h1>
            <p>
              {isVegan
                ? 'Explore more plant foods without inventing avoided impact for choices you already make.'
                : 'Your selected swaps are a starting point for exploring possible changes.'}
            </p>
          </div>

          <div className="result-score">
            <span>OPTIMIZATION POINTS</span>
            <b>{data.points === null ? '—' : data.points.toLocaleString()}</b>
            <small>
              {data.personalPoints ?? 0} from your swaps
              {data.referralPoints > 0 ? ` · ${data.referralPoints} from friends` : ''}
            </small>
          </div>

          <div className="confetti c1" />
          <div className="confetti c2" />
          <div className="confetti c3" />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black">
            {isVegan
              ? 'YOUR IMPACT'
              : isAnnual
                ? 'POTENTIAL ANNUAL CHANGE'
                : 'IMPACT CHANGE PER 100 G'}
          </h2>
          <span className="estimate-label">CATEGORY-LEVEL ESTIMATE</span>
        </div>

        {isVegan ? (
          <div className="mt-5 border-2 border-[#3F382F] bg-white p-8 text-center">
            <h3 className="text-xl font-black">You&apos;re already eating fully plant-based.</h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#3F382F]/65">
              We won&apos;t claim avoided emissions for choices you already make. Explore plant
              foods, compare their nutrition estimates, and learn how the category-level figures
              work.
            </p>
            <Link href="/swaps" className="pixel-button mt-5">
              Explore plant foods <Icon name="arrow" />
            </Link>
          </div>
        ) : hasImpact ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon="leaf"
              value={formatSignedNumber(impact.co2eSaved)}
              unit="kg"
              label="CO₂e CHANGE"
              color={colors.green}
              basis={basis}
            />
            <StatCard
              icon="water"
              value={formatSignedNumber(impact.waterSaved, 0)}
              unit="L"
              label="WATER CHANGE"
              color="#AFC7CE"
              basis={basis}
            />
            <StatCard
              icon="chart"
              value={formatSignedNumber(impact.landSaved, 2)}
              unit="m²"
              label="LAND USE CHANGE"
              color={colors.yellow}
              basis={basis}
            />
          </div>
        ) : (
          <div className="mt-5 border-2 border-[#3F382F] bg-white p-8 text-center">
            <Icon name="sprout" size={36} />
            <h3 className="mt-3 text-xl font-black">No comparable estimate yet</h3>
            <p className="mt-2 text-[#3F382F]/65">
              Select an alternative with environmental data to compare estimates. Annual comparisons
              also need a frequency answer and a gram serving size. Custom suggestions are not
              assigned impact values.
            </p>
            <div className="mt-7 flex justify-center">
              <Link href="/swaps" className="pixel-button">
                Explore more swaps <Icon name="arrow" />
              </Link>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <article className="achievement-card">
            <div className="achievement-medal">
              <Icon name="trophy" size={36} />
            </div>
            <div>
              <span className="pixel-label">YOUR PROGRESS</span>
              <h3>{data.selectedSwapCount} choices made</h3>
              <p>
                Optimization points are a game score. Environmental changes are estimated
                separately.
              </p>
            </div>
          </article>

          <article className="reality-card">
            <Icon name="spark" />
            <div>
              <h3>Potential, not a promise</h3>
              <p>
                {isAnnual
                  ? 'Annual changes scale each reported occasion by the recorded gram portion, defaulting to 100 g when needed. They are estimates, not measured savings.'
                  : 'These are per-100 g comparisons because no food-frequency answers are available. They are not annual estimates.'}
              </p>
            </div>
          </article>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link className="pixel-button" href="/signup">
            Save my progress <Icon name="arrow" />
          </Link>
          <Link className="pixel-button secondary" href="/dashboard">
            View my dashboard
          </Link>
        </div>

        <ImpactGuide className="mt-10 border-t border-[#3F382F]/15 pt-5" />
      </div>
    </main>
  )
}
