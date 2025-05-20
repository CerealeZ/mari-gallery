import { z } from "zod";

export const Photo = z.object({
  name: z
    .string()
    .min(1, { message: "El nombre es requerido" })
    .max(50, { message: "El nombre es demasiado largo" }),
  description: z
    .string()
    .max(200, { message: "La descripción es demasiado larga" })
    .optional(),
  mimeType: z.enum(["image/jpeg", "image/jpg", "image/png", "image/webp"]),
});

export const MongoId = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "ID de MongoDB no válido");

export const PhotoPatch = z.object({
  title: z
    .string()
    .min(1, { message: "El nombre es requerido" })
    .max(50, { message: "El nombre es demasiado largo" })
    .optional(),
  description: z
    .string()
    .max(200, { message: "La descripción es demasiado larga" })
    .optional(),
  allowedEmails: z.array(z.string().email()).optional(),
  public: z.boolean().optional(),
  shared: z.boolean().optional(),
});

export const MongoIds = z.array(MongoId);
