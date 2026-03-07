import path from "path"

import sharp from "sharp"

import type { PersistedChatAttachmentInput } from "@/lib/services/chat"

const MAX_IMAGES_PER_MESSAGE = 5
const MAX_IMAGE_BYTES = 1_000_000
const MAX_AUDIO_BYTES = 8_000_000
const MAX_IMAGE_WIDTH = 1600
const IMAGE_QUALITY_STEPS = [60, 52, 45, 38, 32]
const SUPPORTED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/aac",
  "audio/mpeg",
])

function toBuffer(file: File) {
  return file.arrayBuffer().then((value) => Buffer.from(value))
}

function baseName(fileName: string | undefined, fallback: string) {
  if (!fileName) {
    return fallback
  }

  return path.basename(fileName, path.extname(fileName)) || fallback
}

async function compressImage(file: File): Promise<PersistedChatAttachmentInput> {
  const source = await toBuffer(file)
  let resizeWidth: number | undefined

  const sourceMeta = await sharp(source).metadata()
  if (sourceMeta.width && sourceMeta.width > MAX_IMAGE_WIDTH) {
    resizeWidth = MAX_IMAGE_WIDTH
  }

  for (const quality of IMAGE_QUALITY_STEPS) {
    const pipeline = sharp(source).rotate()
    if (resizeWidth) {
      pipeline.resize({ width: resizeWidth, withoutEnlargement: true })
    }

    const output = await pipeline.avif({ quality, effort: 4 }).toBuffer()
    const outputMeta = await sharp(output).metadata()

    if (output.length <= MAX_IMAGE_BYTES) {
      return {
        kind: "image",
        fileName: `${baseName(file.name, "image")}.avif`,
        mimeType: "image/avif",
        sizeBytes: output.length,
        width: outputMeta.width,
        height: outputMeta.height,
        binary: output,
      }
    }

    if (resizeWidth && resizeWidth > 720) {
      resizeWidth = Math.round(resizeWidth * 0.84)
    } else if (!resizeWidth && (outputMeta.width ?? 0) > 720) {
      resizeWidth = Math.round((outputMeta.width ?? MAX_IMAGE_WIDTH) * 0.84)
    }
  }

  throw new Error(
    `Unable to compress ${file.name} under 1 MB. Use a smaller image.`,
  )
}

async function prepareAudio(file: File): Promise<PersistedChatAttachmentInput> {
  if (!SUPPORTED_AUDIO_TYPES.has(file.type)) {
    throw new Error(
      `${file.name} is not a supported audio format. Use WebM, OGG, MP4, AAC, or MP3.`,
    )
  }

  if (file.size > MAX_AUDIO_BYTES) {
    throw new Error(`${file.name} is too large. Keep audio under 8 MB.`)
  }

  return {
    kind: "audio",
    fileName: file.name || "voice-message.webm",
    mimeType: file.type || "audio/webm",
    sizeBytes: file.size,
    binary: await toBuffer(file),
  }
}

export async function prepareChatAttachments(files: File[]) {
  const validFiles = files.filter((file) => file.size > 0)
  const imageFiles = validFiles.filter((file) => file.type.startsWith("image/"))
  const audioFiles = validFiles.filter((file) => file.type.startsWith("audio/"))
  const unsupportedFiles = validFiles.filter(
    (file) => !file.type.startsWith("image/") && !file.type.startsWith("audio/"),
  )

  if (unsupportedFiles.length > 0) {
    throw new Error("Only image and audio attachments are supported in task chat.")
  }

  if (imageFiles.length > MAX_IMAGES_PER_MESSAGE) {
    throw new Error("You can upload up to 5 images in a single message.")
  }

  if (audioFiles.length > 1) {
    throw new Error("Only one audio attachment can be sent per message.")
  }

  const preparedImages = await Promise.all(imageFiles.map((file) => compressImage(file)))
  const preparedAudio = await Promise.all(audioFiles.map((file) => prepareAudio(file)))

  return [...preparedImages, ...preparedAudio]
}
