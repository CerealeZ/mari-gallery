import express, { Request, Response } from "express";
import {
  clerkClient,
  requireAuth,
  getAuth,
  clerkMiddleware,
} from "@clerk/express";

import { v2 as cloudinary } from "cloudinary";
import { Collection, Db, MongoClient, ObjectId } from "mongodb";
import multer from "multer";

cloudinary.config({
  cloud_name: "dkffqztdd",
  api_key: "525597456746775",
  api_secret: process.env.CLOUDINARY_API_KEY, // Click 'View API Keys' above to copy your API secret
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

const app = express();

// Middleware
app.use(clerkMiddleware());

app.use(express.json());

// Enable cors

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "*");
  next();
});

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.post(
  "/protected",
  upload.single("file"),
  requireAuth(),
  async (req, res) => {
    // Use `getAuth()` to get the user's `userId`
    const { userId } = getAuth(req);

    const file = req.file;

    if (!file) {
      res.json({ error: "No file uploaded" });
      return;
    }

    const base64String = req.file?.buffer.toString("base64");
    const mimeType = file.mimetype;
    const dataUri = `data:${mimeType};base64,${base64String}`;
    const data = await cloudinary.uploader.upload(dataUri);

    imagesCollection.insertOne({
      ownerId: userId,
      image: {
        url: data.url,
        publicId: data.public_id,
        metadata: {
          width: data.width,
          height: data.height,
          originalMimeType: mimeType,
          type: data.resource_type,
          format: data.format,
          size: data.bytes,
          createAt: data.created_at,
        },
      },
      title: req.body.name,
      description: req.body.description,
    });

    const user = await clerkClient.users.getUser(userId!);

    res.json({ user });
  }
);

app.get("/me/images", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  const images = await imagesCollection.find({ ownerId: userId }).toArray();

  const imagesWithResolutions = await Promise.all(
    images.map((image) => {
      const galleryPreview = cloudinary.url(image.image.publicId, {
        width: 150,
        crop: "scale",
      });

      const detailsPreview = cloudinary.url(image.image.publicId, {
        width: 300,
        crop: "scale",
      });

      return {
        ...image,
        resolution: {
          galleryPreview: galleryPreview,
          detailsPreview: detailsPreview,
        },
      };
    })
  );

  res.json(imagesWithResolutions);
});

app.get("/images/:id", async (req, res) => {
  const { id } = req.params;
  const { userId } = getAuth(req);
  const dbImage = await imagesCollection.findOne({ _id: new ObjectId(id) });

  if (!dbImage) {
    res.status(404).json({ error: "Image not found" });
    return;
  }
  const galleryPreview = cloudinary.url(dbImage.image.publicId, {
    width: 150,
    crop: "scale",
  });
  const detailsPreview = cloudinary.url(dbImage.image.publicId, {
    width: 300,
    crop: "scale",
  });
  const owner = await clerkClient.users.getUser(dbImage.ownerId);

  const response = {
    ...dbImage,
    authorName: owner.fullName,
    resolution: {
      galleryPreview: galleryPreview,
      detailsPreview: detailsPreview,
    },
  };

  if (dbImage.public) {
    res.json(response);
    return;
  }

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (dbImage.ownerId === userId) {
    res.json(response);
    return;
  }
  const user = await clerkClient.users.getUser(userId);

  const emails = user.emailAddresses.map((email) => email.emailAddress);

  if (emails.some((email) => dbImage.allowedEmails?.includes(email))) {
    res.json(response);
    return;
  }
  res.status(401).json({ error: "Unauthorized" });
});

app.patch("/images/:id", requireAuth(), async (req, res) => {
  const { id } = req.params;
  const { userId } = getAuth(req);

  const allowedEmails: string[] = req.body.allowedEmails;

  const shared = req.body.shared;
  const image = await imagesCollection.updateOne(
    {
      _id: new ObjectId(id),
      ownerId: userId,
    },
    {
      $set: {
        ...(req.body.title && {
          title: req.body.title,
        }),
        ...(req.body.description && {
          description: req.body.description,
        }),
        ...(allowedEmails && {
          allowedEmails: allowedEmails,
        }),
        ...(typeof req.body.public === "boolean" && {
          public: req.body.public,
        }),
        ...(typeof shared === "boolean" && {
          shared: shared,
        }),
      },
    }
  );

  res.json(image);
});

app.delete("/images/:id", requireAuth(), async (req, res) => {
  const { id } = req.params;
  const { userId } = getAuth(req);
  const image = await imagesCollection.findOneAndDelete({
    _id: new ObjectId(id),
    ownerId: userId,
  });

  if (!image) {
    res.status(404).json({ error: "Image not found" });
    return;
  }
  cloudinary.uploader.destroy(image.image.publicId);

  res.json(image);
});

app.delete("/images", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  const ids = req.body.ids;
  const images = await imagesCollection
    .find({
      ownerId: userId,
      _id: {
        $in: ids.map((id: string) => new ObjectId(id)),
      },
    })
    .toArray();

  const deleted = await imagesCollection.deleteMany({
    _id: {
      $in: ids.map((id: string) => new ObjectId(id)),
    },
  });

  cloudinary.api
    .delete_resources(images.map((image) => image.image.publicId))
    .catch((err) => {
      console.log(err);
    });

  res.json(deleted);
});

const MONGO_URI = process.env.MONGO_URI!;

const client = new MongoClient(MONGO_URI);

const db = client.db("test2");

const imagesCollection: Collection = db.collection("images");

const port = 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
