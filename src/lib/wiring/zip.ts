import JSZip from "jszip";
import { generateWiringPack } from "./generator";

export async function generateWiringPackZip(): Promise<Buffer> {
  const zip = new JSZip();
  const pack = generateWiringPack();
  const folder = zip.folder("openclaw-wiring-pack")!;

  for (const file of pack) {
    folder.file(file.filename, file.content);
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return buffer;
}
