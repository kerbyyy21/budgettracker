import { useCallback, useRef, useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
}

// Promise-based confirmation step for destructive actions:
//   const { confirm, dialog } = useConfirm();
//   if (await confirm({ title, message })) { ...delete... }
//   return <>... {dialog}</>
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setOptions(opts);
      }),
    []
  );

  const close = (answer: boolean) => {
    resolver.current?.(answer);
    resolver.current = null;
    setOptions(null);
  };

  const dialog = (
    <Modal open={options !== null} onClose={() => close(false)} title={options?.title ?? ''} size="sm">
      <p className="text-ink-soft">{options?.message}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => close(false)}>Cancel</Button>
        <Button variant="danger" onClick={() => close(true)}>{options?.confirmLabel ?? 'Delete'}</Button>
      </div>
    </Modal>
  );

  return { confirm, dialog };
}
