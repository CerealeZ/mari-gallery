import {
  Button,
  createOverlay,
  Dialog,
  DialogActionTrigger,
  Portal,
} from "@chakra-ui/react";
import type React from "react";
import { useState } from "react";

interface DialogProps {
  title: string;
  content: React.ReactNode;
  inverted?: boolean;
  onAccept?: () => Promise<void>;
}

export const confirmDialog = createOverlay<DialogProps>((props) => {
  const { title, content, inverted, onAccept, ...rest } = props;
  const [loading, setLoading] = useState(false);

  const acceptHandler = async () => {
    setLoading(true);
    await onAccept?.();
    setLoading(false);
  };

  return (
    <Dialog.Root {...rest}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            {title && (
              <Dialog.Header>
                <Dialog.Title>{title}</Dialog.Title>
              </Dialog.Header>
            )}
            <Dialog.Body spaceY="4">
              <Dialog.Description>{content}</Dialog.Description>
            </Dialog.Body>

            <Dialog.Footer>
              {inverted ? (
                <>
                  <DialogActionTrigger asChild>
                    <Button disabled={loading}>Cancelar</Button>
                  </DialogActionTrigger>

                  <Button
                    variant="outline"
                    loading={loading}
                    onClick={acceptHandler}
                  >
                    Ok
                  </Button>
                </>
              ) : (
                <>
                  <DialogActionTrigger asChild>
                    <Button disabled={loading} variant="outline">
                      Cancelar
                    </Button>
                  </DialogActionTrigger>
                  <Button loading={loading} onClick={acceptHandler}>
                    Ok
                  </Button>
                </>
              )}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
});
