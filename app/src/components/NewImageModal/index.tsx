import {
  Button,
  CloseButton,
  Dialog,
  Icon,
  Portal,
  FileUpload,
  HStack,
  Box,
  useFileUpload,
} from "@chakra-ui/react";
import { Plus, Image, Upload } from "lucide-react";
import { useForm } from "react-hook-form";

interface Form {
  name: string;
  description: string;
  file: File;
}

export const NewImageModal = ({
  onSubmit,
}: {
  onSubmit?: (files: File[]) => void;
  loading?: boolean;
}) => {
  const { handleSubmit } = useForm<Form>();

  const fileUploader = useFileUpload({
    maxFiles: 10,
    accept: "image/*",
  });

  return (
    <Dialog.Root size={"lg"} motionPreset="slide-in-bottom">
      <Dialog.Trigger asChild>
        <Button variant="outline" size={"lg"}>
          <Icon>
            <Plus />
          </Icon>
          Nuevo
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content mx={2}>
            <Dialog.Header>
              <Dialog.Title display={"flex"} alignItems={"center"} gap={2}>
                <Icon>
                  <Image />
                </Icon>
                Nuevas imágenes
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body
              as={"form"}
              overflow={"auto"}
              onSubmit={handleSubmit(() => {
                onSubmit?.(fileUploader.acceptedFiles);
                fileUploader.clearFiles();
              })}
            >
              <FileUpload.RootProvider
                value={fileUploader}
                alignItems="stretch"
              >
                <FileUpload.HiddenInput />
                <FileUpload.Dropzone disableClick>
                  <FileUpload.DropzoneContent>
                    <Icon size="md" color="fg.muted">
                      <Upload />
                    </Icon>
                    <FileUpload.DropzoneContent>
                      <FileUpload.Trigger
                        textDecor={"underline"}
                        cursor={"pointer"}
                      >
                        Sube tus fotos aquí
                      </FileUpload.Trigger>
                      <Box color="fg.muted">
                        .png, .jpg o .jpeg hasta 5MB por imagen
                      </Box>
                    </FileUpload.DropzoneContent>
                  </FileUpload.DropzoneContent>
                </FileUpload.Dropzone>
                <FileUpload.List clearable />
              </FileUpload.RootProvider>

              <HStack justify={"flex-end"}>
                <Button type="submit" mt={2}>
                  Subir <Upload />
                </Button>
              </HStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
