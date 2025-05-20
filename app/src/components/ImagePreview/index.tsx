import {
  Box,
  CloseButton,
  IconButton,
  Image,
  Portal,
  Show,
  Dialog,
  Button,
  HStack,
  Editable,
} from "@chakra-ui/react";
import { useState } from "react";

import { DataList, Stack } from "@chakra-ui/react";
import useSWR from "swr";
import { Check, Download, Info, Lock, PenLine, Trash, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { axiosClient } from "../../providers/swr/client";
import { useDeleteImage } from "../../hooks/useDeleteImage";
import { downloadImage, updatePermissions } from "../../utils";
import { PermissionManager } from "../PermissionManager";

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

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

export const ImageDetailsDrawer = ({
  imageId,
  children,
}: {
  imageId: string;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const { data, mutate } = useSWR(
    open ? ["MyNewImage", imageId] : null,
    async ([, imageId]) => {
      const { data } = await axiosClient.get<ImageResponse>(
        `/images/${imageId}`
      );
      return data;
    }
  );

  const { deleteImage } = useDeleteImage({});

  const changeImage = async ({
    description,
    title,
  }: {
    title: string;
    description: string;
  }) => {
    if (!data) return;

    mutate(
      async () => {
        await changeImageDesc(imageId, {
          title,
          description,
        });
        return {
          ...data,
          title,
          description,
        };
      },
      {
        optimisticData: {
          ...data,
          title,
          description,
        },
        revalidate: false,
        populateCache: true,
      }
    );
  };

  const { register, handleSubmit } = useForm<{
    title: string;
    description: string;
  }>();

  const submitChanges = handleSubmit((data) => {
    changeImage(data);
  });

  return (
    <Dialog.Root
      size={"full"}
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
    >
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <Portal>
        <Dialog.Positioner>
          <Dialog.Content position={"relative"} minH={"dvh"}>
            <Dialog.Header
              position={"absolute"}
              w={"full"}
              alignItems={"center"}
              backgroundColor="rgba(0,0,0,0.5)"
              zIndex={1}
            >
              <Dialog.CloseTrigger asChild>
                <CloseButton position={"static"} variant={"plain"}>
                  <X color="white" />
                </CloseButton>
              </Dialog.CloseTrigger>
              <Dialog.Title color={"white"} truncate>
                {data?.title}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body display={"contents"} onClick={() => setSelected("")}>
              <TransformWrapper>
                <TransformComponent
                  wrapperStyle={{
                    flexGrow: "1",
                    width: "100%",
                    backgroundColor: "#2c2c2c",
                  }}
                >
                  <Image
                    w={"full"}
                    maxH={"80dvh"}
                    src={data?.image.url}
                    objectFit={"contain"}
                  />
                </TransformComponent>
              </TransformWrapper>
            </Dialog.Body>
            <Dialog.Footer
              display={"block"}
              position={"absolute"}
              bottom={0}
              w={"full"}
              px={0}
              backgroundColor="rgba(0,0,0,0.5)"
              css={{
                "&:has([data-type='more-details'])": {
                  backgroundColor: "rgba(0,0,0,0.9)",
                },
              }}
            >
              <HStack>
                <Button
                  onClick={() =>
                    setSelected((prev) => {
                      if (prev === "details") {
                        return "";
                      }
                      return "details";
                    })
                  }
                  variant={"plain"}
                  color={"white"}
                  flexGrow={"1"}
                >
                  <Info />
                </Button>
                <Button
                  variant={"plain"}
                  color={"white"}
                  flexGrow={"1"}
                  onClick={() => deleteImage(imageId)}
                >
                  <Trash />
                </Button>

                <PermissionManager
                  imageId={imageId}
                  onSubmit={async (data, mutate) => {
                    await updatePermissions(
                      {
                        allowedEmails: data.allowedEmails,
                        permission: data.permission,
                      },
                      imageId
                    );
                    mutate();
                  }}
                >
                  {(Trigger) => {
                    return (
                      <Trigger asChild>
                        <Button
                          variant={"plain"}
                          color={"white"}
                          flexGrow={"1"}
                        >
                          <Lock />
                        </Button>
                      </Trigger>
                    );
                  }}
                </PermissionManager>

                <Button
                  variant={"plain"}
                  color={"white"}
                  flexGrow={"1"}
                  onClick={() => {
                    if (!data) return;

                    downloadImage(data?.image.url, data?.title);
                  }}
                >
                  <Download />
                </Button>
              </HStack>

              <Show when={selected === "details"}>
                <Stack
                  gap="8"
                  color={"white"}
                  data-type="more-details"
                  maxH={"70dvh"}
                  overflowY={"auto"}
                  px={2}
                >
                  <DataList.Root variant={"bold"}>
                    <DataList.Item>
                      <DataList.ItemLabel>Título</DataList.ItemLabel>
                      <DataList.ItemValue>
                        <Box
                          display={"contents"}
                          as="form"
                          onSubmit={(e) => e.preventDefault()}
                        >
                          <Editable.Root
                            data-input="description"
                            activationMode="dblclick"
                            selectOnFocus={false}
                            value={data?.title}
                            onValueCommit={() => submitChanges()}
                            css={{
                              "&:has(input[hidden])": {
                                gap: 0,
                              },
                            }}
                          >
                            <Editable.Preview
                              minH={"fit-content"}
                              p={0}
                              _hover={{
                                cursor: "auto",
                                backgroundColor: "transparent",
                              }}
                            />
                            <Editable.Input
                              color={"white"}
                              backgroundColor={"black"}
                              {...register("title")}
                            />
                            <Editable.Control>
                              <Editable.EditTrigger asChild>
                                <IconButton
                                  height={"fit-content"}
                                  variant={"plain"}
                                  color={"white"}
                                >
                                  <PenLine />
                                </IconButton>
                              </Editable.EditTrigger>
                              <Editable.CancelTrigger asChild>
                                <IconButton variant="outline">
                                  <X />
                                </IconButton>
                              </Editable.CancelTrigger>
                              <Editable.SubmitTrigger asChild type="submit">
                                <IconButton variant="outline">
                                  <Check />
                                </IconButton>
                              </Editable.SubmitTrigger>
                            </Editable.Control>
                          </Editable.Root>
                        </Box>
                      </DataList.ItemValue>
                    </DataList.Item>

                    <DataList.Item>
                      <DataList.ItemLabel>Descripción</DataList.ItemLabel>
                      <DataList.ItemValue>
                        <Box
                          display={"contents"}
                          as="form"
                          onSubmit={(e) => e.preventDefault()}
                        >
                          <Editable.Root
                            activationMode="dblclick"
                            selectOnFocus={false}
                            onValueCommit={() => submitChanges()}
                            value={data?.description}
                            css={{
                              "&:has(input[hidden])": {
                                gap: 0,
                              },
                            }}
                          >
                            <Editable.Preview
                              minH={"fit-content"}
                              p={0}
                              _hover={{
                                cursor: "auto",
                                backgroundColor: "transparent",
                              }}
                            />
                            <Editable.Textarea
                              color={"white"}
                              backgroundColor={"black"}
                              {...register("description")}
                            />
                            <Editable.Control>
                              <Editable.EditTrigger asChild>
                                <IconButton
                                  height={"fit-content"}
                                  variant={"plain"}
                                  color={"white"}
                                >
                                  <PenLine />
                                </IconButton>
                              </Editable.EditTrigger>
                              <Editable.CancelTrigger asChild>
                                <IconButton variant="outline">
                                  <X />
                                </IconButton>
                              </Editable.CancelTrigger>
                              <Editable.SubmitTrigger asChild type="submit">
                                <IconButton variant="outline">
                                  <Check />
                                </IconButton>
                              </Editable.SubmitTrigger>
                            </Editable.Control>
                          </Editable.Root>
                        </Box>
                      </DataList.ItemValue>
                    </DataList.Item>

                    <DataList.Item>
                      <DataList.ItemLabel>Resolución</DataList.ItemLabel>
                      <DataList.ItemValue>
                        {data?.image.metadata.width}x
                        {data?.image.metadata.height}
                      </DataList.ItemValue>
                    </DataList.Item>

                    <DataList.Item>
                      <DataList.ItemLabel>Tipo</DataList.ItemLabel>
                      <DataList.ItemValue>
                        {data?.image.metadata.type}
                      </DataList.ItemValue>
                    </DataList.Item>

                    <DataList.Item>
                      <DataList.ItemLabel>Formato</DataList.ItemLabel>
                      <DataList.ItemValue>
                        {data?.image.metadata.format}
                      </DataList.ItemValue>
                    </DataList.Item>

                    <DataList.Item>
                      <DataList.ItemLabel>Tamaño</DataList.ItemLabel>
                      <DataList.ItemValue>
                        {(Number(data?.image.metadata.size) / 1024).toFixed(2)}
                        KB
                      </DataList.ItemValue>
                    </DataList.Item>

                    <DataList.Item>
                      <DataList.ItemLabel>Creado en</DataList.ItemLabel>
                      <DataList.ItemValue>
                        {new Date(
                          data?.image.metadata.createAt ?? new Date()
                        ).toLocaleDateString()}
                      </DataList.ItemValue>
                    </DataList.Item>
                  </DataList.Root>
                </Stack>
              </Show>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

const changeImageDesc = (
  id: string,
  { title, description }: { title: string; description: string }
) =>
  axiosClient.patch("/images/" + id, {
    title,
    description,
  });
