import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { getStorage } from "firebase-admin/storage";

export type ImageDetails = {
  contentType: string;
  extension: string;
};

type CloudinaryDeliveryType = "upload" | "authenticated";

export type CloudinaryReference = {
  version: 1;
  resourceType: "image";
  deliveryType: CloudinaryDeliveryType;
  publicId: string;
  format: string;
  assetVersion: number;
};

type UploadCloudinaryImageOptions = {
  buffer: Buffer;
  relativePublicId: string;
  image: ImageDetails;
  deliveryType: CloudinaryDeliveryType;
  tags?: string[];
};

const CLOUDINARY_REFERENCE_PREFIX = "cloudinary:";
const validCloudinaryPath = /^[A-Za-z0-9/_-]+$/;
const validFormat = /^[a-z0-9]+$/;

const isSafeCloudinaryPath = (value: string): boolean =>
  value.length > 0
  && value.length <= 255
  && validCloudinaryPath.test(value)
  && !value.startsWith("/")
  && !value.endsWith("/")
  && !value.includes("//");

const requiredEnvironment = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required when BACKEND_STORAGE_DRIVER=cloudinary`);
  return value;
};

const cloudinaryFolder = (): string => {
  const folder = (process.env.CLOUDINARY_FOLDER ?? "potters-central")
    .trim()
    .replace(/^\/+|\/+$/g, "");
  if (!isSafeCloudinaryPath(folder)) {
    throw new Error("CLOUDINARY_FOLDER may contain only letters, numbers, slashes, underscores, and hyphens");
  }
  return folder;
};

const configureCloudinary = (): void => {
  cloudinary.config({
    cloud_name: requiredEnvironment("CLOUDINARY_CLOUD_NAME"),
    api_key: requiredEnvironment("CLOUDINARY_API_KEY"),
    api_secret: requiredEnvironment("CLOUDINARY_API_SECRET"),
    secure: true,
    urlAnalytics: false,
  });
};

const cloudinaryPublicId = (relativePublicId: string): string => {
  const normalized = relativePublicId.replace(/^\/+|\/+$/g, "");
  if (!isSafeCloudinaryPath(normalized)) {
    throw new Error("Cloudinary public ID contains unsupported characters");
  }
  const publicId = `${cloudinaryFolder()}/${normalized}`;
  if (!isSafeCloudinaryPath(publicId)) throw new Error("Cloudinary public ID is too long");
  return publicId;
};

export const encodeCloudinaryReference = (reference: CloudinaryReference): string =>
  `${CLOUDINARY_REFERENCE_PREFIX}${Buffer.from(JSON.stringify(reference), "utf8").toString("base64url")}`;

export const decodeCloudinaryReference = (storagePath: string): CloudinaryReference | null => {
  if (!storagePath.startsWith(CLOUDINARY_REFERENCE_PREFIX)) return null;
  try {
    const value = JSON.parse(Buffer.from(storagePath.slice(CLOUDINARY_REFERENCE_PREFIX.length), "base64url").toString("utf8"));
    if (
      value?.version !== 1
      || value?.resourceType !== "image"
      || !["upload", "authenticated"].includes(value?.deliveryType)
      || typeof value?.publicId !== "string"
      || !isSafeCloudinaryPath(value.publicId)
      || typeof value?.format !== "string"
      || !validFormat.test(value.format)
      || !Number.isSafeInteger(value?.assetVersion)
      || value.assetVersion < 1
    ) return null;
    return value as CloudinaryReference;
  } catch {
    return null;
  }
};

const assertOwnedCloudinaryReference = (reference: CloudinaryReference): void => {
  if (!reference.publicId.startsWith(`${cloudinaryFolder()}/`)) {
    throw new Error("Cloudinary asset is outside the configured application folder");
  }
};

export const uploadCloudinaryImage = async ({
  buffer,
  relativePublicId,
  image,
  deliveryType,
  tags = [],
}: UploadCloudinaryImageOptions): Promise<{ storagePath: string; url: string }> => {
  configureCloudinary();
  const publicId = cloudinaryPublicId(relativePublicId);
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      public_id: publicId,
      resource_type: "image",
      type: deliveryType,
      format: image.extension,
      overwrite: false,
      unique_filename: false,
      use_filename: false,
      tags: ["potters-central", ...tags],
    }, (error, uploaded) => {
      if (error) reject(error);
      else if (!uploaded) reject(new Error("Cloudinary returned an empty upload response"));
      else resolve(uploaded);
    });
    stream.end(buffer);
  });
  const reference: CloudinaryReference = {
    version: 1,
    resourceType: "image",
    deliveryType,
    publicId: result.public_id,
    format: result.format,
    assetVersion: result.version,
  };
  return {
    storagePath: encodeCloudinaryReference(reference),
    url: result.secure_url,
  };
};

export const cloudinaryDownloadUrl = (storagePath: string): string => {
  configureCloudinary();
  const reference = decodeCloudinaryReference(storagePath);
  if (!reference) throw new Error("Stored Cloudinary reference is invalid");
  assertOwnedCloudinaryReference(reference);
  return cloudinary.url(reference.publicId, {
    resource_type: reference.resourceType,
    type: reference.deliveryType,
    version: reference.assetVersion,
    format: reference.format,
    secure: true,
    sign_url: reference.deliveryType === "authenticated",
  });
};

export const downloadCloudinaryImage = async (storagePath: string): Promise<Buffer> => {
  const url = cloudinaryDownloadUrl(storagePath);
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`Cloudinary download failed with status ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
};

export const deleteStoredImage = async (storagePath: string, expectedCloudinaryNamespace?: string): Promise<void> => {
  if (!storagePath) return;
  const cloudinaryReference = decodeCloudinaryReference(storagePath);
  if (cloudinaryReference) {
    configureCloudinary();
    assertOwnedCloudinaryReference(cloudinaryReference);
    if (expectedCloudinaryNamespace) {
      const expectedPrefix = `${cloudinaryFolder()}/${expectedCloudinaryNamespace.replace(/^\/+|\/+$/g, "")}/`;
      if (!cloudinaryReference.publicId.startsWith(expectedPrefix)) {
        throw new Error("Cloudinary asset is outside the expected application namespace");
      }
    }
    const result = await cloudinary.uploader.destroy(cloudinaryReference.publicId, {
      resource_type: cloudinaryReference.resourceType,
      type: cloudinaryReference.deliveryType,
      invalidate: true,
    });
    if (!["ok", "not found"].includes(String(result.result))) {
      throw new Error(`Cloudinary deletion failed: ${String(result.result)}`);
    }
    return;
  }

  const driver = process.env.BACKEND_STORAGE_DRIVER ?? "local";
  if (driver === "firebase") {
    await getStorage().bucket().file(storagePath).delete({ ignoreNotFound: true });
    return;
  }
  if (driver === "local") {
    const uploadRoot = path.resolve(process.env.BACKEND_UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));
    const target = path.resolve(uploadRoot, storagePath);
    if (!target.startsWith(`${uploadRoot}${path.sep}`)) throw new Error("Stored image path is invalid");
    await rm(target, { force: true });
  }
};

export const storeLocalPublicImage = async (
  storagePath: string,
  buffer: Buffer,
): Promise<{ target: string; relativePath: string }> => {
  const uploadRoot = path.resolve(process.env.BACKEND_UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));
  const relativePath = storagePath.split("/").join(path.sep);
  const target = path.resolve(uploadRoot, relativePath);
  if (!target.startsWith(`${uploadRoot}${path.sep}`)) throw new Error("Public upload path is invalid");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, buffer, { flag: "wx", mode: 0o600 });
  return { target, relativePath };
};

export const storeLocalPrivateImage = async (
  relativePath: string,
  buffer: Buffer,
): Promise<void> => {
  const privateRoot = path.resolve(process.env.BACKEND_PRIVATE_UPLOAD_DIR ?? path.join(process.cwd(), "private-uploads"));
  const target = path.resolve(privateRoot, relativePath);
  if (!target.startsWith(`${privateRoot}${path.sep}`)) throw new Error("Private upload path is invalid");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, buffer, { flag: "wx", mode: 0o600 });
};

export const readLocalPrivateImage = async (relativePath: string): Promise<Buffer> => {
  const privateRoot = path.resolve(process.env.BACKEND_PRIVATE_UPLOAD_DIR ?? path.join(process.cwd(), "private-uploads"));
  const target = path.resolve(privateRoot, relativePath);
  if (!target.startsWith(`${privateRoot}${path.sep}`)) throw new Error("Stored payment proof path is invalid");
  return readFile(target);
};

export const deleteLocalPrivateImage = async (relativePath: string): Promise<void> => {
  const privateRoot = path.resolve(process.env.BACKEND_PRIVATE_UPLOAD_DIR ?? path.join(process.cwd(), "private-uploads"));
  const target = path.resolve(privateRoot, relativePath);
  if (!target.startsWith(`${privateRoot}${path.sep}`)) throw new Error("Stored payment proof path is invalid");
  await rm(target, { force: true });
};
