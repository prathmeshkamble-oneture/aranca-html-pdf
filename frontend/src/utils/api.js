const BASE = "/api";

export async function validateHTML(file) {
  const form = new FormData();
  form.append("html", file);
  const res = await fetch(`${BASE}/validate`, { method: "POST", body: form });
  if (!res.ok) throw new Error((await res.json()).error || "Validation failed");
  return res.json();
}

export async function convertToPDF(file, options, onProgress) {
  const form = new FormData();
  form.append("html", file);
  // form.append("outputType", options.outputType);
  form.append("language", options.language);
  form.append("compress", options.compress !== false ? "true" : "false");
  // Use XMLHttpRequest for upload progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/convert`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 40)); // Upload = 0–40%
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        try {
          reject(
            new Error(
              JSON.parse(xhr.responseText).error || "Conversion failed",
            ),
          );
        } catch {
          reject(new Error("Conversion failed"));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(form);
  });
}

export function getDownloadURL(url) {
  return url; // relative URL, proxied through Vite dev server
}

export function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
