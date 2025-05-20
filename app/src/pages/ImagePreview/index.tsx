import {
  Blockquote,
  Box,
  Flex,
  Heading,
  Image,
  Link,
  Show,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router";

import { useParams } from "react-router";
import { axiosClient } from "../../providers/swr/client";
import axios from "axios";
import { Button, Dialog, Portal } from "@chakra-ui/react";
import { useState } from "react";
import useSWRImmutable from "swr/immutable";
import { SignInButton, useUser } from "@clerk/clerk-react";

export default function ImagePreview() {
  const { imageId } = useParams();
  const [error, setError] = useState<string | null>(null);

  const { isSignedIn } = useUser();

  const { data, isLoading } = useSWRImmutable(
    isSignedIn ? ["MyNewNewImage", imageId] : null,
    async () => {
      return axiosClient
        .get<{
          ownerId: string;
          image: {
            url: string;
            publicId: string;
            metadata: {
              width: number;
              height: number;
              originalMimeType: string;
              type: string;
              format: string;
              size: number;
              createAt: string;
            };
          };
          title: string;
          description: string;
          authorName: string;
          _id: string;
        }>(`/images/${imageId}`)
        .then((res) => res.data);
    },
    {
      shouldRetryOnError: false,
      onError: (err) => {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            setError("UNAUTHORIZED");
          }

          if (err.response?.status === 404) {
            setError("MISSING");
          }
        }
      },
    }
  );

  if (error === "UNAUTHORIZED" && !isSignedIn) {
    return (
      <Dialog.Root motionPreset="slide-in-bottom" open>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>
                  Oops, parece que tenemos un problema
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <p>
                  Parece que estás accediendo a un recurso del cual no tienes
                  permiso...
                </p>
                <p>
                  Por favor, regístrate o inicia sesión para verificar tu
                  identidad.
                </p>
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
  }

  if (error === "UNAUTHORIZED" && isSignedIn) {
    return (
      <Dialog.Root motionPreset="slide-in-bottom" open>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>
                  Oops, parece que tenemos un problema
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <p>No tienes permisos para ver la imagen.</p>
                <p>Verificar con el dueño de la imagen por permisos</p>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    );
  }

  if (error === "MISSING") {
    return (
      <Dialog.Root motionPreset="slide-in-bottom" open>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Parece que te has perdido</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <p>La imagen que estas buscando no existe.</p>

                <Link asChild fontWeight={"bolder"}>
                  <RouterLink to="/">Volver al inicio</RouterLink>
                </Link>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    );
  }

  return (
    <Box width={"100%"} maxWidth={"breakpoint-2xl"} mx={"auto"}>
      <Show when={!isLoading} fallback={<h1>Loading...</h1>}>
        <Show when={data} fallback={"Hubo un error"}>
          {(data) => {
            return (
              <>
                <Box px={2} py={4}>
                  <Heading as={"h1"} textStyle={"4xl"}>
                    {data.title}
                  </Heading>
                </Box>

                <Box as="figure">
                  <Flex
                    justify={"center"}
                    maxH={"80dvh"}
                    backgroundColor={"black"}
                  >
                    <Image objectFit={"contain"} src={data.image.url} />
                  </Flex>

                  <Box px={2} as={"figcaption"} mt={2}>
                    <Blockquote.Root as="div">
                      <Blockquote.Content>
                        {data.description}
                      </Blockquote.Content>

                      <Blockquote.Caption as={"div"}>
                        <Text>
                          Por <b>{data.authorName}</b>
                        </Text>
                      </Blockquote.Caption>
                    </Blockquote.Root>
                  </Box>
                </Box>
              </>
            );
          }}
        </Show>
      </Show>
    </Box>
  );
}
