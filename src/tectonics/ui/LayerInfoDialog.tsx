import { Dialog } from '@base-ui/react/dialog'
import type { EarthLayerInfo } from '../earthStructureLayers'

type LayerInfoDialogProps = {
  layer: EarthLayerInfo | null
  onClose: () => void
}

export function LayerInfoDialog({ layer, onClose }: LayerInfoDialogProps) {
  return (
    <Dialog.Root
      open={layer !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="layer-dialog__backdrop" />
        <Dialog.Viewport className="layer-dialog__viewport">
          <Dialog.Popup className="layer-dialog__popup">
            {layer ? (
              <>
                <span
                  className="layer-dialog__swatch"
                  style={{ backgroundColor: layer.color }}
                  aria-hidden="true"
                />
                <p className="layer-dialog__depth">{layer.depth}</p>
                <Dialog.Title className="layer-dialog__title">{layer.title}</Dialog.Title>
                <Dialog.Description className="layer-dialog__description">
                  {layer.description}
                </Dialog.Description>
                <p className="layer-dialog__fact">
                  <span className="layer-dialog__fact-label">Did you know?</span>
                  {layer.fact}
                </p>
                <Dialog.Close className="layer-dialog__close">Close</Dialog.Close>
              </>
            ) : null}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
