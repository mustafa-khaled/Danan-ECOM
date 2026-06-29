export function designImageKey(designId: string, fileId: string, ext: string): string {
  return `designs/${designId}/${fileId}.${ext}`;
}

export function collectionCoverKey(collectionId: string, ext: string): string {
  return `collections/${collectionId}/cover.${ext}`;
}

export function certificatePdfKey(certificateId: string): string {
  return `certificates/${certificateId}.pdf`;
}

export function extFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "application/pdf":
      return "pdf";
    default:
      return "bin";
  }
}
