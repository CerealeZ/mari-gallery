import axios from "axios";
import { toaster } from "../components/Toaster/functions";
import { axiosClient } from "../providers/swr/client";

export const clipboardLink = (sourceId: string) => {
  toaster.create({
    title: "Copiado",
    description: "El link de la imagen fue copiado al portapapeles",
    type: "success",
  });

  return navigator.clipboard.writeText(
    window.location.origin + "/gallery/" + sourceId
  );
};

export const downloadImage = async (source: string, name: string) => {
  const image = await axios.get(source, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(image.data);
  const link = document.createElement("a");
  link.download = name;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
};

export const updatePermissions = async (
  data: { permission: string; allowedEmails: { email: string }[] },
  id: string
) => {
  try {
    if (data.permission === "public") {
      await axiosClient.patch(`/images/${id}`, {
        public: true,
        shared: false,
      });
    }

    if (data.permission === "shared") {
      await axiosClient.patch(`/images/${id}`, {
        allowedEmails: data.allowedEmails.map((e) => e.email),
        public: false,
        shared: true,
      });
    }

    if (data.permission === "private") {
      await axiosClient.patch(`/images/${id}`, {
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
