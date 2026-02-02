async function extractRawAttachments(pdfDoc, PDFArray, PDFDict, PDFName) {
  if (!pdfDoc.catalog.has(PDFName.of("Names"))) return [];
  const Names = pdfDoc.catalog.lookup(PDFName.of("Names"), PDFDict);

  if (!Names.has(PDFName.of("EmbeddedFiles"))) return [];
  const EmbeddedFiles = Names.lookup(PDFName.of("EmbeddedFiles"), PDFDict);

  if (!EmbeddedFiles.has(PDFName.of("Names"))) return [];
  const EFNames = EmbeddedFiles.lookup(PDFName.of("Names"), PDFArray);

  const rawAttachments = [];

  for (let idx = 0, len = EFNames.size(); idx < len; idx += 2) {
    const fileName = EFNames.lookup(idx);
    const fileSpec = EFNames.lookup(idx + 1, PDFDict);

    rawAttachments.push({ fileName, fileSpec });
  }

  return rawAttachments;
}

/**
 * Extract attachments from PDF
 *
 * @param {File|ArrayBuffer} payload
 *
 * @returns {Promise<{ name: string, data: any }[]>}
 */
export async function extractAttachments(payload) {
  const pdfLib =
    // @ts-ignore
    await import("https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm");
  const {
    PDFDocument,
    PDFName,
    PDFDict,
    PDFArray,
    PDFStream,
    decodePDFRawStream,
  } = pdfLib;

  let pdfBytes;

  if (payload instanceof File) {
    pdfBytes = await payload.arrayBuffer();
  }

  if (payload instanceof ArrayBuffer) {
    pdfBytes = payload;
  }

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const rawAttachments = await extractRawAttachments(
    pdfDoc,
    PDFArray,
    PDFDict,
    PDFName,
  );

  return rawAttachments.map(({ fileName, fileSpec }) => {
    const stream = fileSpec
      .lookup(PDFName.of("EF"), PDFDict)
      .lookup(PDFName.of("F"), PDFStream);

    return {
      name: fileName.decodeText(),
      data: decodePDFRawStream(stream).decode(),
    };
  });
}
