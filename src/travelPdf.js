const latin = (value = "") => String(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/[–—→]/g, "-")
  .replace(/[^\x20-\x7e]/g, "");

const pdfText = (value) => latin(value).replace(/([\\()])/g, "\\$1");

const wrap = (value, width = 88) => {
  const words = latin(value).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (!line) line = word;
    else if (`${line} ${word}`.length <= width) line += ` ${word}`;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
};

export function tripPdfLines(days = []) {
  return days.flatMap((day, index) => [
    `GIORNO ${index + 1} - ${day.date || ""} - ${day.city || ""}`,
    day.title || "",
    `${day.from || ""}${day.to ? ` - ${day.to}` : ""} | ${day.transport || ""} | ${day.km ?? ""} km | ${day.time || ""}`,
    day.story || "",
    day.overnight ? `Pernottamento: ${day.overnight}` : "",
    ...(day.checks || []).map((item) => `- ${item}`),
    "",
  ].filter((line) => line !== "" || index < days.length - 1));
}

export function diaryPdfLines(posts = []) {
  return posts.flatMap((post) => [
    `${post.author_name || "Viaggiatore"} - ${post.created_at ? new Date(post.created_at).toLocaleString("it-IT") : ""}`,
    post.text || "(pubblicazione multimediale)",
    post.place ? `Luogo: ${post.place}` : "",
    ...(post.comments || []).map((comment) => `  ${comment.author_name || "Commento"}: ${comment.text || "contenuto multimediale"}`),
    "",
  ].filter((line) => line !== "" || posts.length));
}

export function createTravelPdf(title, lines = []) {
  const rendered = [latin(title), "Thailandia Insieme", "", ...lines].flatMap((line) => wrap(line));
  const chunks = [];
  for (let index = 0; index < rendered.length; index += 48) chunks.push(rendered.slice(index, index + 48));
  if (!chunks.length) chunks.push([latin(title), "Nessun contenuto disponibile."]);

  const objects = [null, "", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  const pageIds = [];
  chunks.forEach((pageLines) => {
    const pageId = objects.length;
    const contentId = pageId + 1;
    pageIds.push(pageId);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    const commands = pageLines.map((line, index) => `BT /F1 ${index === 0 ? 15 : 10} Tf 44 ${798 - index * 15} Td (${pdfText(line)}) Tj ET`).join("\n");
    objects.push(`<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`);
  });
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n%THAI\n";
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}
