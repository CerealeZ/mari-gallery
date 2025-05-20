import { mutate } from "swr";
import { Keys } from "../providers/swr/keys";
import { confirmDialog } from "../components/ConfirmModal";
import { axiosClient } from "../providers/swr/client";

export function useDeleteImage({
  onDelete,
}: {
  onDelete?: (id: string) => void;
}) {
  const deleteImage = (id: string) => {
    confirmDialog.open("deleteImage", {
      title: "Eliminar imagen",
      content: "Estas seguro de eliminar la imagen?",
      onAccept: async () => {
        await axiosClient.delete("/images/" + id);
        mutate((key: unknown) => {
          if (Array.isArray(key)) {
            return key.some((k) => k === Keys.IMAGE_GALLERY);
          }
          return key === Keys.IMAGE_GALLERY;
        });
        onDelete?.(id);
        confirmDialog.close("deleteImage");
      },
    });
  };

  return {
    deleteImage,
  };
}
