import { readFileSync, writeFileSync } from "fs";

const file = "src/lib/scraper/companies.config.ts";
let content = readFileSync(file, "utf-8");

// Match pattern: website: "https://DOMAIN", and nearby logo with simpleicons
// Strategy: find each block with simpleicons logo and replace with google favicon using the website domain

const lines = content.split("\n");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("cdn.simpleicons.org")) {
    // Find the website line nearby (within 5 lines)
    let domain = "";
    for (let j = Math.max(0, i - 5); j < Math.min(lines.length, i + 5); j++) {
      const m = lines[j].match(/website:\s*"https?:\/\/([^"]+)"/);
      if (m) {
        domain = m[1].replace(/\/$/, "");
        break;
      }
    }
    if (domain) {
      lines[i] =
        `    logo: "https://www.google.com/s2/favicons?domain=${domain}&sz=128",`;
    }
  }
}

writeFileSync(file, lines.join("\n"));
console.log("Done! Replaced all simpleicons with google favicons.");
