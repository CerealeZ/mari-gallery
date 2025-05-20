//                              ...,?77??!~~~~!???77?<~....
//                         ..?7`                           `7!..
//                     .,=`          ..~7^`   I                  ?1.
//        ........  ..^            ?`  ..?7!1 .               ...??7
//       .        .7`        .,777.. .I.    . .!          .,7!
//       ..     .?         .^      .l   ?i. . .`       .,^
//        b    .!        .= .?7???7~.     .>r .      .=
//        .,.?4         , .^         1        `     4...
//         J   ^         ,            5       `         ?<.
//        .%.7;         .`     .,     .;                   .=.
//        .+^ .,       .%      MML     F       .,             ?,
//         P   ,,      J      .MMN     F        6               4.
//         l    d,    ,       .MMM!   .t        ..               ,,
//         ,    JMa..`         MMM`   .         .!                .;
//          r   .M#            .M#   .%  .      .~                 .,
//        dMMMNJ..!                 .P7!  .>    .         .         ,,
//        .WMMMMMm  ?^..       ..,?! ..    ..   ,  Z7`        `?^..  ,,
//           ?THB3       ?77?!        .Yr  .   .!   ?,              ?^C
//             ?,                   .,^.` .%  .^      5.
//               7,          .....?7     .^  ,`        ?.
//                 `<.                 .= .`'           1
//                 ....dn... ... ...,7..J=!7,           .,
//              ..=     G.,7  ..,o..  .?    J.           F
//            .J.  .^ ,,,t  ,^        ?^.  .^  `?~.      F
//           r %J. $    5r J             ,r.1      .=.  .%
//           r .77=?4.    ``,     l ., 1  .. <.       4.,
//           .$..    .X..   .n..  ., J. r .`  J.       `'
//         .?`  .5        `` .%   .% .' L.'    t
//         ,. ..1JL          .,   J .$.?`      .
//                 1.          .=` ` .J7??7<.. .;
//                  JS..    ..^      L        7.:
//                    `> ..       J.  4.
//                     +   r `t   r ~=..G.
//                     =   $  ,.  J
//                     2   r   t  .;
//               .,7!  r   t`7~..  j..
//               j   7~L...$=.?7r   r ;?1.
//                8.      .=    j ..,^   ..
//               r        G              .
//             .,7,        j,           .>=.
//          .J??,  `T....... %             ..
//       ..^     <.  ~.    ,.             .D
//     .?`        1   L     .7.........?Ti..l
//    ,`           L  .    .%    .`!       `j,
//  .^             .  ..   .`   .^  .?7!?7+. 1
// .`              .  .`..`7.  .^  ,`      .i.;
// .7<..........~<<3?7!`    4. r  `          G%
//                           J.` .!           %
//                             JiJ           .`
//                               .1.         J
//                                  ?1.     .'
//                                      7<..%
// Servidor protegido por Sonic.

import express, { ErrorRequestHandler, Request, Response } from "express";
import {
  clerkClient,
  requireAuth,
  getAuth,
  clerkMiddleware,
} from "@clerk/express";

import { v2 as cloudinary } from "cloudinary";
import { Collection, Db, MongoClient, ObjectId } from "mongodb";
import multer from "multer";
import { MongoId, MongoIds, Photo, PhotoPatch } from "validations";
import { fileTypeFromBuffer } from "file-type";

cloudinary.config({
  cloud_name: "dkffqztdd",
  api_key: "525597456746775",
  api_secret: process.env.CLOUDINARY_API_KEY, // Click 'View API Keys' above to copy your API secret
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

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
Photo;
app.post(
  "/protected",
  upload.single("file"),
  requireAuth(),
  async (req, res) => {
    const { name, description } = req.body;
    const file = req.file;
    if (!file) {
      res.json({ error: "No file uploaded" });
      return;
    }
    const type = await fileTypeFromBuffer(file.buffer);
    const photo = Photo.parse({ name, description, mimeType: type?.mime });
    const { userId } = getAuth(req);
    const base64String = req.file?.buffer.toString("base64");
    const mimeType = file.mimetype;
    const dataUri = `data:${mimeType};base64,${base64String}`;
    const data = await cloudinary.uploader.upload(dataUri);

    await imagesCollection.insertOne({
      ownerId: userId,
      image: {
        url: data.url,
        publicId: data.public_id,
        metadata: {
          width: data.width,
          height: data.height,
          originalMimeType: photo.mimeType,
          type: data.resource_type,
          format: data.format,
          size: data.bytes,
          createAt: data.created_at,
        },
      },
      title: photo.name,
      description: photo.description,
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
  const idMongo = MongoId.safeParse(id);

  if (idMongo.error) {
    res.status(404).json({ error: "Invalid id" });
    return;
  }

  const dbImage = await imagesCollection.findOne({
    _id: new ObjectId(idMongo.data),
  });

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
  const mongoId = MongoId.parse(id);
  const information = PhotoPatch.parse({
    title: req.body.title,
    description: req.body.description,
    allowedEmails: req.body.allowedEmails,
    public: req.body.public,
    shared: req.body.shared,
  });

  const image = await imagesCollection.updateOne(
    {
      _id: new ObjectId(mongoId),
      ownerId: userId,
    },
    {
      $set: {
        ...(information.title && {
          title: information.title,
        }),
        ...(information.description && {
          description: information.description,
        }),
        ...(information.allowedEmails && {
          allowedEmails: information.allowedEmails,
        }),
        ...(typeof information.public === "boolean" && {
          public: information.public,
        }),
        ...(typeof information.shared === "boolean" && {
          shared: information.shared,
        }),
      },
    }
  );

  res.json(image);
});

app.delete("/images/:id", requireAuth(), async (req, res) => {
  const { id } = req.params;

  const mongoId = MongoId.parse(id);
  const { userId } = getAuth(req);
  const image = await imagesCollection.findOneAndDelete({
    _id: new ObjectId(mongoId),
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
  const mongoIds = MongoIds.parse(ids);
  const images = await imagesCollection
    .find({
      ownerId: userId,
      _id: {
        $in: mongoIds.map((id: string) => new ObjectId(id)),
      },
    })
    .toArray();

  const deleted = await imagesCollection.deleteMany({
    _id: {
      $in: mongoIds.map((id: string) => new ObjectId(id)),
    },
  });

  cloudinary.api
    .delete_resources(images.map((image) => image.image.publicId))
    .catch((err) => {
      console.log(err);
    });

  res.json(deleted);
});

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.log(err);

  res.status(500).json({ error: "server error" });
};

app.use(errorHandler);

const MONGO_URI = process.env.MONGO_URI!;

const client = new MongoClient(MONGO_URI);

const db = client.db("test2");

const imagesCollection: Collection = db.collection("images");

const port = 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
