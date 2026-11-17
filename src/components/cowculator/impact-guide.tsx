'use client'

const sources = [
  {
    title: 'Poore & Nemecek (2018), Science',
    description: 'Life-cycle analysis of food production and its environmental variation.',
    href: 'https://doi.org/10.1126/science.aaq0216',
  },
  {
    title: 'Our World in Data: Environmental impacts of food',
    description: 'A plain-language overview of food footprint measures and source data.',
    href: 'https://ourworldindata.org/environmental-impacts-of-food',
  },
  {
    title: 'Mekonnen & Hoekstra (2011), Hydrology and Earth System Sciences',
    description: 'Research on green, blue, and grey water footprints for crops.',
    href: 'https://doi.org/10.5194/hess-15-1577-2011',
  },
  {
    title: 'USDA FoodData Central',
    description: 'Reference database for food and nutrient information.',
    href: 'https://fdc.nal.usda.gov/',
  },
]

export function ImpactGuide({ className = '' }: { className?: string }) {
  return (
    <details className={`impact-guide ${className}`}>
      <summary className="cursor-pointer font-bold">Sources & estimate notes</summary>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-3 text-sm leading-6 text-[#3F382F]/75">
          <p>
            <b>CO₂e</b> expresses greenhouse gases as an equivalent amount of carbon dioxide. Water
            is a volume estimate, not a measure of local water scarcity. Land is an area estimate,
            not a measure of habitat quality.
          </p>
          <p>
            Food records use rounded category estimates per 100 g. Annual projections scale each
            reported eating occasion by the replaced food&apos;s gram serving size, defaulting to
            100 g if no size is recorded. Foods stored in non-gram units are not annualized. Brands,
            recipes, production methods, and location can change the real footprint substantially.
          </p>
          <p>
            A positive value means a modeled reduction versus the food being replaced; a negative
            value means the selected alternative has a higher estimate for that measure. These are
            potential estimates, not measured savings. We do not convert food choices into a number
            of animals “spared” because the available starter data cannot support that claim.
          </p>
          <p>
            <b>Game points</b> are not environmental units. Plant swaps with a lower catalog impact
            score are scaled to match the average eligible animal-to-plant swap reward; swaps
            without an impact-score improvement earn no points. Cost is shown as a tradeoff but
            does not affect the score.
          </p>
          <p>
            Starter nutrition and price profiles are also broad estimates, not medical advice or a
            quote for a particular product. The sources below provide context; they are not a claim
            that every starter value is a direct measurement from those publications.
          </p>
        </div>

        <ul className="space-y-3">
          {sources.map((source) => (
            <li key={source.href}>
              <a
                href={source.href}
                target="_blank"
                rel="noreferrer"
                className="font-bold underline decoration-2 underline-offset-2"
              >
                {source.title}
              </a>
              <p className="mt-1 text-xs leading-5 text-[#3F382F]/65">{source.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}
