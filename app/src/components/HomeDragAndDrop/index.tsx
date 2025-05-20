import {
  EmptyState,
  FileUpload,
  useFileUpload,
  VStack,
} from "@chakra-ui/react";
import { Image } from "lucide-react";

export const UploadHome = ({
  onUpload,
}: {
  onUpload: (files: File[]) => void;
}) => {
  const fileUploader = useFileUpload({
    maxFiles: 10,
    onFileAccept: (files) => {
      if (!files.files.length) {
        return;
      }
      onUpload(files.files);
      fileUploader.clearFiles();
    },
  });

  return (
    <FileUpload.RootProvider alignItems="stretch" value={fileUploader} flexGrow={'1'}>
      <FileUpload.HiddenInput />
      <FileUpload.Dropzone disableClick flexGrow={1} m="2">
        <FileUpload.DropzoneContent>
          <EmptyState.Root gridColumn={"1 / -1"}>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Image />
              </EmptyState.Indicator>
              <VStack textAlign="center">
                <EmptyState.Title>Tu galería está vacía</EmptyState.Title>
                <EmptyState.Description>
                  <FileUpload.Trigger
                    textDecor={"underline"}
                    cursor={"pointer"}
                  >
                    Sube fotos para empezar
                  </FileUpload.Trigger>
                </EmptyState.Description>
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
        </FileUpload.DropzoneContent>
      </FileUpload.Dropzone>
    </FileUpload.RootProvider>
  );
};
