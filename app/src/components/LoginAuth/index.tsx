import { Button, Dialog, Portal } from "@chakra-ui/react";
import { SignInButton } from "@clerk/clerk-react";

export const LoginGuard = () => {
  return (
    <Dialog.Root motionPreset="slide-in-bottom" open>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Por favor, inicia sesión </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <p>Para acceder a esta sección debes iniciar sesión</p>
            </Dialog.Body>
            <Dialog.Footer>
              <Button colorPalette={"purple"} asChild>
                <SignInButton forceRedirectUrl={window.location.href}>
                  Ingresar
                </SignInButton>
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
