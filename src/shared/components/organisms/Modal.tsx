import * as Dialog from "@radix-ui/react-dialog";


interface ModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({
  open,
  onOpenChange,
  title,
  children,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />

        <Dialog.Content
          className="
            fixed left-1/2 top-1/2
            w-[90vw] max-w-sm min-h-[200px]
            -translate-x-1/2 -translate-y-1/2
            rounded-lg bg-white p-6 shadow-xl flex flex-col
          "
        >
          <Dialog.Title className="text-lg font-semibold">
            {title}
          </Dialog.Title>

          <div className="mt-4 flex flex-1 items-center justify-center">
            {children}
          </div>

          <Dialog.Close className="absolute right-4 top-4">
            ×
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
