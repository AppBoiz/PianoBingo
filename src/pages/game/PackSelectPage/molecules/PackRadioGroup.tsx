import RadioOption from '../../../../shared/components/atoms/RadioOption'
import type { Pack } from '../../../../shared/types/models'

interface PackRadioGroupProps {
  packs: Pack[]
  selectedPackId: number | null
  onSelectPack: (packId: number) => void
}

export default function PackRadioGroup({ packs, selectedPackId, onSelectPack }: PackRadioGroupProps) {
  return (
    <div className="radios-container mx-auto flex w-fit flex-col gap-5 text-left text-xl font-medium text-zinc-700 md:text-[25px]" data-testid="list">
      {packs.map((pack) => (
        <RadioOption
          key={pack.packId}
          wrapperClassName="radio-label grid grid-cols-[1em,max-content] items-start gap-3"
          inputClassName="mt-1 accent-brand-pink"
          data-testid={`option-${pack.packId}`}
          name="radio"
          value={pack.packId}
          checked={selectedPackId === pack.packId}
          onChange={() => onSelectPack(pack.packId)}
          label={pack.packName}
        />
      ))}
    </div>
  )
}
