import {
  Button,
  HStack,
  Grid,
  For,
  Show,
  Flex,
  Image,
  Box,
  IconButton,
  Group,
  Text,
  Table,
  Span,
  Tabs,
  Heading,
  GridItem,
  Checkbox,
  Center,
  Icon,
  VStack,
} from "@chakra-ui/react";
import { SignedIn, useAuth, UserButton, useUser } from "@clerk/clerk-react";
import { Menu, Portal } from "@chakra-ui/react";
import { confirmDialog } from "./components/ConfirmModal";
import { ImageActionBar } from "./components/ImageActionBar";
import { useState } from "react";
import { useHold } from "./hooks/useHold";
import { UploadHome } from "./components/HomeDragAndDrop";
import { toaster } from "./components/Toaster/functions";
import { axiosClient } from "./providers/swr/client";

import useSWR from "swr";

import { NewImageModal } from "./components/NewImageModal";
import {
  EllipsisVertical,
  List,
  Grid as GridIcon,
  Info,
  ImageIcon,
} from "lucide-react";
import { ImageDetailsDrawer } from "./components/ImagePreview";
import { PermissionManager } from "./components/PermissionManager";
import axios from "axios";
import { Keys } from "./providers/swr/keys";
import { useDeleteImage } from "./hooks/useDeleteImage";
import { clipboardLink, downloadImage } from "./utils";
import { LoginGuard } from "./components/LoginAuth";

interface ImageResponse {
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
  resolution: {
    galleryPreview: string;
    detailsPreview: string;
  };
  title: string;
  description: string;
  _id: string;
}

function App() {
  const {
    data = [],
    isLoading,
    mutate: invalidateImages,
  } = useSWR([Keys.IMAGE_GALLERY], async () => {
    const token = await getToken();
    if (!token) {
      return [];
    }

    return axiosClient
      .get<ImageResponse[]>("/me/images")
      .then((res) => res.data);
  });

  const { deleteImage } = useDeleteImage({
    onDelete: (imageId) => {
      setSelectedImages(selectedImages.filter((id) => id !== imageId));
    },
  });
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const { getToken } = useAuth();
  const { isSignedIn, isLoaded } = useUser();

  const deleteBulkImage = () => {
    confirmDialog.open("deleteBulkImage", {
      title: "Eliminar imagenes",
      content: "Estas seguro de eliminar las imagenes?",
      onAccept: async () => {
        await axiosClient.delete("/images", {
          data: {
            ids: selectedImages,
          },
        });
        setSelectedImages([]);
        invalidateImages();
        confirmDialog.close("deleteBulkImage");
      },
    });
  };

  const selectImage = (image: ImageResponse, selected: boolean) => {
    if (selected) {
      setSelectedImages([...selectedImages, image._id]);
    } else {
      setSelectedImages(selectedImages.filter((id) => id !== image._id));
    }
  };

  const uploadImages = async (files: File[]) => {
    await Promise.all(
      files.map((file) => {
        return new Promise((resolve) => {
          toaster.promise(
            axiosClient.post(
              "/protected",
              {
                name: file.name,
                description: "",
                file: file,
              },
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            ),
            {
              loading: {
                title: `Subiendo ${file.name}`,
                description: "Esto puede tardar unos segundos",
              },
              success: {
                title: "Imagen subida",
                description: "La imagen se ha subido exitosamente",
              },
              error: {
                title: "Error subiendo la imagen " + file.name,
                description: "Hubo un error al subir la imagen",
              },
              finally: () => {
                resolve(true);
              },
            }
          );
        });
      })
    );

    invalidateImages();
  };

  const shareInBulk = async () => {
    const links = selectedImages.map((imageId) => {
      return `${window.location.origin}/gallery/${imageId}`;
    });
    await navigator.clipboard.writeText(links.join("\n"));

    toaster.create({
      title: "Copiado",
      description: "Los links de las imágenes fueron copiados al portapapeles",
      type: "success",
    });
  };

  const downloadInBulk = async () => {
    const { default: JSzip } = await import("jszip");
    const zipper = new JSzip();
    const links = data.filter((image) => selectedImages.includes(image._id));
    const blobs = await Promise.all(
      links.map(async (link) => {
        const response = await axios.get(`${link.image.url}`, {
          responseType: "blob",
        });
        return response.data;
      })
    );

    blobs.forEach((blob, index) => {
      zipper.file(
        `${links[index].title}.${links[index].image.metadata.format}`,
        blob
      );
    });

    zipper.generateAsync({ type: "blob" }).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "archivos.zip";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <Flex direction={"column"} minH={"100dvh"} gap={2}>
      {!isSignedIn && isLoaded && <LoginGuard />}

      <Box borderBottom={"1px solid {colors.gray.200}"}>
        <HStack
          w={"full"}
          maxW={"breakpoint-2xl"}
          mx={"auto"}
          minH={"10"}
          alignItems={"center"}
          p={2}
        >
          <Heading textStyle={"2xl"}>Mari Gallery</Heading>

          <SignedIn>
            <Flex marginLeft={"auto"} alignItems={"center"}>
              <UserButton />
            </Flex>
          </SignedIn>
        </HStack>
      </Box>

      <Show
        when={!isLoading}
        fallback={
          <Center flexGrow={1}>
            <VStack>
              <Icon size={"2xl"} animation={"spin"}>
                <ImageIcon />
              </Icon>
              <Text fontWeight={"bold"}>Cargando imagenes...</Text>
            </VStack>
          </Center>
        }
      >
        <Show
          when={data.length}
          fallback={
            <Flex
              flexDir={"column"}
              maxW={"breakpoint-2xl"}
              mx={"auto"}
              w={"full"}
              flexGrow={1}
            >
              <UploadHome onUpload={uploadImages} />
            </Flex>
          }
        >
          <Grid
            gridTemplateColumns={"1fr auto"}
            gridTemplateRows={"auto 1fr auto"}
            maxW={"breakpoint-2xl"}
            mx={"auto"}
            w={"full"}
            gap={2}
            data-type="gallery"
            border={"1px solid {colors.gray.200}"}
            rounded={"l3"}
            p={1}
            flexGrow={1}
            mb={2}
          >
            <GridItem alignSelf={"center"} justifySelf={"end"}>
              <NewImageModal onSubmit={uploadImages} />
            </GridItem>

            <Tabs.Root
              defaultValue="tab-2"
              display={"contents"}
              variant={"plain"}
            >
              <Tabs.List
                justifyContent={"end"}
                bg="bg.muted"
                rounded="l3"
                p="1"
              >
                <Tabs.Trigger value="tab-1">
                  <List />
                </Tabs.Trigger>
                <Tabs.Trigger value="tab-2">
                  <GridIcon />
                </Tabs.Trigger>
                <Tabs.Indicator rounded="l2" />
              </Tabs.List>
              <Tabs.Content value="tab-1" gridColumn={"1 / -1"}>
                <PhotosTable
                  data={data}
                  onDelete={(image) => deleteImage(image._id)}
                  selectedImages={selectedImages}
                  onSelectImage={selectImage}
                />
              </Tabs.Content>
              <Tabs.Content value="tab-2" gridColumn={"1 / -1"}>
                <Grid
                  templateColumns={"repeat(auto-fill, minmax(200px, 1fr))"}
                  gap={4}
                >
                  <Show when={!isLoading} fallback={"Cargando..."}>
                    <For each={data}>
                      {(image) => (
                        <ArticleImage
                          key={image._id}
                          image={image}
                          selected={selectedImages.includes(image._id)}
                          onImageSelect={(selected) =>
                            selectImage(image, selected)
                          }
                          onDelete={(image) => deleteImage(image._id)}
                        />
                      )}
                    </For>
                  </Show>
                </Grid>
              </Tabs.Content>
            </Tabs.Root>

            <GridItem
              data-type="placeholder"
              gridColumn={"1 / -1"}
              position={"sticky"}
              bottom={2}
            >
              <ImageActionBar
                items={selectedImages}
                onClear={() => setSelectedImages([])}
                onDelete={deleteBulkImage}
                onDownload={downloadInBulk}
                onShare={shareInBulk}
              />
            </GridItem>
          </Grid>
        </Show>
      </Show>
    </Flex>
  );
}

const PhotosTable = ({
  data,
  selectedImages,
  onSelectImage,
  onDelete,
}: {
  data: ImageResponse[];
  selectedImages: string[];
  onSelectImage: (image: ImageResponse, selected: boolean) => void;
  onDelete: (image: ImageResponse) => void;
}) => {
  return (
    <Table.Root size="sm" striped tableLayout={"fixed"}>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader w={'2rem'}></Table.ColumnHeader>
          <Table.ColumnHeader>Nombre</Table.ColumnHeader>
          <Table.ColumnHeader>Descripción</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="end">Detalles</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {data.map((image) => (
          <Table.Row key={image._id}>
            <Table.Cell>
              <Checkbox.Root
                aria-label="Selecciona la imagen"
                checked={selectedImages.includes(image._id)}
                onCheckedChange={(checked) => {
                  if (typeof checked.checked === "string") return;
                  onSelectImage(image, checked.checked);
                }}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
              </Checkbox.Root>
            </Table.Cell>

            <Table.Cell truncate>
              <Span>{image.title}</Span>
            </Table.Cell>
            <Table.Cell truncate>
              <Span>{image.description}</Span>
            </Table.Cell>
            <Table.Cell textAlign="end">
              <Menu.Root unmountOnExit={false} lazyMount={false}>
                <Menu.Trigger asChild>
                  <IconButton variant={"ghost"} size={"sm"}>
                    <EllipsisVertical />
                  </IconButton>
                </Menu.Trigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content>
                      <Menu.Item
                        value="export"
                        onClick={() =>
                          downloadImage(image.image.url, image.title)
                        }
                      >
                        Descargar
                      </Menu.Item>
                      <Menu.Item
                        value="share"
                        onClick={() => clipboardLink(image._id)}
                      >
                        Copiar enlace
                      </Menu.Item>

                      <Menu.Item value="delete" onClick={() => onDelete(image)}>
                        Borrar
                      </Menu.Item>

                      <PermissionManager
                        children={(Trigger) => {
                          return (
                            <Menu.Item value="permissions" asChild>
                              <Trigger asChild>
                                <Button unstyled>Editar permisos</Button>
                              </Trigger>
                            </Menu.Item>
                          );
                        }}
                        imageId={image._id}
                        onSubmit={async (data, mutate) => {
                          await updatePermissions(data, image);
                          mutate();
                        }}
                      />
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
              <ImageDetailsDrawer imageId={image._id}>
                <IconButton variant="ghost">
                  <Info />
                </IconButton>
              </ImageDetailsDrawer>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};

const ArticleImage = ({
  image,
  onImageSelect,
  onDelete,
  selected,
}: {
  image: ImageResponse;
  onImageSelect?: (selected: boolean) => void;
  selected?: boolean;
  onDelete?: (image: ImageResponse) => void;
}) => {
  const { handlers } = useHold({ onHold: async () => {} });

  return (
    <Flex
      as={"article"}
      flexDir={"column"}
      borderRadius={"md"}
      {...handlers}
      pt={1}
      pb={2}
      px={2}
      backgroundColor={"gray.100"}
      css={{
        "&:has(input:checked)": {
          backgroundColor: "gray.200",
        },
      }}
      gap={2}
    >
      <Box as="figure" data-image="bruh" flexGrow={1}>
        <Group w={"full"}>
          <Box
            as={"figcaption"}
            display={"inline-flex"}
            flexGrow={1}
            overflow={"hidden"}
            gap={1}
          >
            <Checkbox.Root
              aria-label="Selecciona la imagen"
              opacity={"0"}
              checked={selected}
              onCheckedChange={({ checked }) => {
                if (typeof checked === "string") return;
                onImageSelect?.(checked);
              }}
              css={{
                "[data-image='bruh']:hover &, &:has(input:checked), &:has(input:focus)":
                  {
                    opacity: 1,
                  },
              }}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
            </Checkbox.Root>

            <Text truncate>{image.title}</Text>
          </Box>
          <Menu.Root unmountOnExit={false} lazyMount={false}>
            <Menu.Trigger asChild>
              <IconButton variant={"ghost"} size={"sm"}>
                <EllipsisVertical />
              </IconButton>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item
                    value="export"
                    onClick={() => downloadImage(image.image.url, image.title)}
                  >
                    Descargar
                  </Menu.Item>
                  <Menu.Item
                    value="share"
                    onClick={() => {
                      clipboardLink(image._id);
                    }}
                  >
                    Copiar enlace
                  </Menu.Item>

                  <Menu.Item value="delete" onClick={() => onDelete?.(image)}>
                    Borrar
                  </Menu.Item>

                  <PermissionManager
                    children={(Trigger) => {
                      return (
                        <Trigger asChild>
                          <Menu.Item value="permissions">
                            Editar permisos
                          </Menu.Item>
                        </Trigger>
                      );
                    }}
                    imageId={image._id}
                    onSubmit={async (data, mutate) => {
                      await updatePermissions(data, image);
                      mutate();
                    }}
                  />
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Group>
        <ImageDetailsDrawer imageId={image._id}>
          <Button
            unstyled
            display={"contents"}
            aria-haspopup={"dialog"}
            aria-label="Abrir detalles de la imagen"
          >
            <Flex
              as="picture"
              mt={1}
              justifyContent={"center"}
              h="36"
              backgroundColor={"white"}
              rounded={"md"}
            >
              <Image
                flexGrow={1}
                objectFit={"contain"}
                loading="lazy"
                src={image.resolution.galleryPreview}
                alt={image.description}
              />
            </Flex>
          </Button>
        </ImageDetailsDrawer>
      </Box>
    </Flex>
  );
};

const updatePermissions = async (
  data: { permission: string; allowedEmails: { email: string }[] },
  image: ImageResponse
) => {
  try {
    if (data.permission === "public") {
      await axiosClient.patch(`/images/${image._id}`, {
        public: true,
        shared: false,
      });
    }

    if (data.permission === "shared") {
      await axiosClient.patch(`/images/${image._id}`, {
        allowedEmails: data.allowedEmails.map((e) => e.email),
        public: false,
        shared: true,
      });
    }

    if (data.permission === "private") {
      await axiosClient.patch(`/images/${image._id}`, {
        public: false,
        shared: false,
      });
    }

    toaster.create({
      title: "Actualizado",
      description: "Los permisos fueron actualizados con exito",
      type: "success",
    });
  } catch {
    toaster.create({
      title: "Error",
      description: "Hubo un error actualizando los permisos",
      type: "error",
    });
  }
};

export default App;
