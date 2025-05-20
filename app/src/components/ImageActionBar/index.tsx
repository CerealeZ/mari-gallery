"use client";

import { ActionBar, Button, HStack, Portal } from "@chakra-ui/react";
import { Download, Link, Trash, X } from "lucide-react";

interface ImageActionBarProps {
  items: string[];
  onClear?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

export const ImageActionBar: React.FC<ImageActionBarProps> = ({
  items,
  onClear,
  onDelete,
  onDownload,
  onShare,
}) => {
  const container = document.querySelector(
    '[data-type="placeholder"]'
  ) as HTMLElement;

  if (!container) {
    return null;
  }

  return (
    <>
      <ActionBar.Root open={items.length > 0} closeOnInteractOutside={false}>
        <Portal container={{ current: container }}>
          <ActionBar.Positioner
            position={"static"}
            gridColumn={"1 / -1"}
            px={2}
          >
            <ActionBar.Content flexDir={"column"} w={"full"} maxW={"md"}>
              <ActionBar.SelectionTrigger>
                <b>{items.length}</b> seleccionados
              </ActionBar.SelectionTrigger>

              <HStack w={"full"}>
                <Button
                  variant="outline"
                  size="sm"
                  flexGrow={1}
                  onClick={onShare}
                >
                  <Link />
                </Button>
                <Button
                  variant="solid"
                  size="sm"
                  onClick={onDelete}
                  colorPalette={"red"}
                  flexGrow={1}
                >
                  <Trash />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  flexGrow={1}
                  onClick={onDownload}
                >
                  <Download />
                </Button>

                <Button
                  variant="subtle"
                  size="sm"
                  onClick={onClear}
                  flexGrow={1}
                >
                  <X />
                </Button>
              </HStack>
            </ActionBar.Content>
          </ActionBar.Positioner>
        </Portal>
      </ActionBar.Root>
    </>
  );
};
