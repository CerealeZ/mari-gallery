import {
  Button,
  CloseButton,
  Dialog,
  Field,
  Icon,
  Input,
  Portal,
  HStack,
  Flex,
  Show,
  Box,
  Fieldset,
  Text,
  For,
  Tag,
} from "@chakra-ui/react";
import { Lock, PersonStanding, Plus } from "lucide-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { RadioGroup } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { Clipboard, IconButton, InputGroup } from "@chakra-ui/react";
import { useAuth } from "@clerk/clerk-react";
import useSWRImmutable from "swr/immutable";
import { axiosClient } from "../../providers/swr/client";

interface Form {
  permission: string;
  email: string;
  allowedEmails: { email: string }[];
}

interface ImageResponse {
  description: string;
  ownerId: string;
  title: string;
  url: string;
  _id: string;
  public?: boolean;
  shared?: boolean;
  allowedEmails?: string[];
}

export const PermissionManager = ({
  onSubmit,
  imageId,
  children,
}: {
  onSubmit?: (form: Form, mutate: () => void) => void;
  imageId: string;
  children: (Trigger: typeof Dialog.Trigger) => React.ReactNode;
}) => {
  const { register, handleSubmit, control, setValue, watch, reset, getValues } =
    useForm<Form>({
      defaultValues: {
        permission: "",
        email: "",
        allowedEmails: [],
      },
    });

  const {
    fields: formEmails,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "allowedEmails",
  });

  const permission = watch("permission");

  const [open, setOpen] = useState(false);
  const { getToken } = useAuth();

  const { data, isLoading, mutate } = useSWRImmutable(
    open ? ["image", imageId] : null,
    async ([, imageId]) => {
      const token = await getToken();
      return axiosClient
        .get<ImageResponse>(`/images/${imageId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => res.data);
    },
    {
      onSuccess: (data) => {
        if (data.allowedEmails) {
          setValue(
            "allowedEmails",
            data.allowedEmails.map((email) => ({ email }))
          );
          return;
        }

        if (data.shared) {
          setValue("permission", "shared");
          return;
        }

        if (data.public) {
          setValue("permission", "public");
          return;
        }

        setValue("permission", "private");
      },
      keepPreviousData: true,
    }
  );

  const allowedEmails = data?.allowedEmails ?? [];

  useEffect(() => {
    if (data) {
      reset({
        permission: data.shared ? "shared" : data.public ? "public" : "private",
        allowedEmails: data.allowedEmails
          ? data.allowedEmails.map((email) => ({ email }))
          : [],
        email: "",
      });
    }
  }, [open, reset, data]);

  return (
    <Dialog.Root
      motionPreset="slide-in-bottom"
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
    >
      {children(Dialog.Trigger)}
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title display={"flex"} alignItems={"center"} gap={2}>
                <Icon>
                  <Lock />
                </Icon>
                Editar permisos de {data?.title}
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body
              as={"form"}
              overflow={"auto"}
              onSubmit={handleSubmit((data) => {
                onSubmit?.(data, () => mutate());
              })}
            >
              <Fieldset.Root size={"lg"} disabled={isLoading}>
                <Fieldset.Legend>
                  ¿Quienes pueden ver esta imagen?
                </Fieldset.Legend>
                <Controller
                  name="permission"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup.Root
                      name={field.name}
                      value={field.value}
                      onValueChange={({ value }) => {
                        field.onChange(value);
                      }}
                    >
                      <Flex gap="6" flexDir={"column"}>
                        {items.map((item) => (
                          <RadioGroup.Item key={item.value} value={item.value}>
                            <RadioGroup.ItemHiddenInput onBlur={field.onBlur} />
                            <RadioGroup.ItemIndicator />
                            <RadioGroup.ItemText>
                              {item.label}
                            </RadioGroup.ItemText>
                          </RadioGroup.Item>
                        ))}
                      </Flex>
                    </RadioGroup.Root>
                  )}
                />
              </Fieldset.Root>

              <Show when={permission === "public" || permission === "shared"}>
                <Fieldset.Root mt={4} size={"lg"}>
                  <Fieldset.Legend>Configuraciones</Fieldset.Legend>

                  <Show when={permission === "shared"}>
                    <Box>
                      <Box>
                        <Text fontWeight={"bold"}>
                          Personas que actualmente pueden ver la imagen
                        </Text>
                        <For
                          each={allowedEmails}
                          fallback={<Text>Sin usuarios permitidos</Text>}
                        >
                          {(email) => {
                            const wasExcluded = !formEmails.some(
                              ({ email: formEmail }) => formEmail === email
                            );

                            console.log(wasExcluded);

                            return (
                              <Tag.Root size={"lg"} key={email}>
                                <Tag.StartElement>
                                  <PersonStanding />
                                </Tag.StartElement>
                                <Tag.Label
                                  data-excluded={wasExcluded}
                                  css={{
                                    "&[data-excluded=true]": {
                                      textDecoration: "line-through",
                                    },
                                  }}
                                >
                                  {email}
                                </Tag.Label>
                                <Tag.EndElement>
                                  {wasExcluded ? (
                                    <Button
                                      unstyled
                                      aria-label="Agregar nuevamente el permiso"
                                      onClick={() => {
                                        append({ email });
                                      }}
                                    >
                                      <Plus />
                                    </Button>
                                  ) : (
                                    <Tag.CloseTrigger
                                      aria-label="Quitar permisos del usuario"
                                      type="button"
                                      onClick={() => {
                                        console.log(formEmails);

                                        remove(
                                          formEmails.findIndex(
                                            (e) => e.email === email
                                          )
                                        );
                                      }}
                                    />
                                  )}
                                </Tag.EndElement>
                              </Tag.Root>
                            );
                          }}
                        </For>
                      </Box>

                      <Box
                        css={{
                          "&:not(:has([data-type=new]))": {
                            display: "none",
                          },
                        }}
                      >
                        <Text fontWeight={"bold"}>
                          Nuevo usuarios para añadir
                        </Text>

                        <Flex flexWrap={"wrap"} gap={2}>
                          <For
                            each={formEmails.filter(
                              (e) => !allowedEmails.includes(e.email)
                            )}
                          >
                            {(email) => (
                              <Tag.Root
                                size={"lg"}
                                data-type={"new"}
                                key={email.id}
                              >
                                <Tag.StartElement>
                                  <PersonStanding />
                                </Tag.StartElement>
                                <Tag.Label>{email.email}</Tag.Label>
                                <Tag.EndElement>
                                  <Tag.CloseTrigger
                                    aria-label="Quitar permisos del usuario"
                                    type="button"
                                    onClick={() => {
                                      remove(
                                        formEmails.findIndex(
                                          (e) => e.email === email.email
                                        )
                                      );
                                    }}
                                  />
                                </Tag.EndElement>
                              </Tag.Root>
                            )}
                          </For>
                        </Flex>
                      </Box>

                      <Field.Root>
                        <Field.Label>Email del invitado</Field.Label>
                        <Input
                          type="email"
                          {...register("email")}
                          placeholder="ex: world@gmail.com"
                        />
                        <Field.HelperText>
                          La persona requerirá registrase para ver la imagen
                        </Field.HelperText>
                      </Field.Root>

                      <Button
                        onClick={() => {
                          append({ email: getValues("email") });
                          setValue("email", "");
                        }}
                      >
                        Añadir
                      </Button>
                    </Box>
                  </Show>
                </Fieldset.Root>
              </Show>

              <Clipboard.Root
                maxW="300px"
                value={
                  new URL(window.location.origin).toString() +
                  "gallery/" +
                  imageId
                }
              >
                <Clipboard.Label textStyle="label">
                  El link de la imagen. Solamente quienes tienen permiso pueden
                  acceder
                </Clipboard.Label>
                <InputGroup endElement={<ClipboardIconButton />}>
                  <Clipboard.Input asChild>
                    <Input />
                  </Clipboard.Input>
                </InputGroup>
              </Clipboard.Root>

              <HStack mt={2} justifyContent={"flex-end"}>
                <Button type="submit">Guardar</Button>
              </HStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

const items = [
  { label: "Solamente yo", value: "private" },
  { label: "Yo y...", value: "shared" },
  { label: "Todo el mundo", value: "public" },
];

const ClipboardIconButton = () => {
  return (
    <Clipboard.Trigger asChild>
      <IconButton variant="surface" size="xs" me="-2">
        <Clipboard.Indicator />
      </IconButton>
    </Clipboard.Trigger>
  );
};
