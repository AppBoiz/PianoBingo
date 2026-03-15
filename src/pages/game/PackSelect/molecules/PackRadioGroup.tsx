import RadioOption from '../../../../shared/components/atoms/RadioOption'
import type { Pack } from '../../../../shared/types/models'

interface PackRadioGroupProps {
  packs: Pack[]
  selectedPackId: number | null
  onSelectPack: (packId: number) => void
}

export default function PackRadioGroup({ packs, selectedPackId, onSelectPack }: PackRadioGroupProps) {
  return (
    <div className="radios-container">
      {packs.map((pack) => (
        <RadioOption
          key={pack.packId}
          wrapperClassName="radio-label"
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
