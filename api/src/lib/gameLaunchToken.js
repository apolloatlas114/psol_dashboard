import crypto from "crypto";

function encodeBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function signSegment(value, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function signLaunchToken(payload, secret) {
  const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = encodeBase64Url(JSON.stringify(payload));
  const unsigned = `${header}.${body}`;
  const signature = signSegment(unsigned, secret);
  return `${unsigned}.${signature}`;
}

export function verifyLaunchToken(token, secret) {
  const [header, body, signature] = String(token || "").split(".");
  if (!header || !body || !signature) {
    throw new Error("Invalid launch token.");
  }

  const unsigned = `${header}.${body}`;
  const expected = signSegment(unsigned, secret);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  const valid = providedBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(providedBuffer, expectedBuffer);
  if (!valid) {
    throw new Error("Invalid launch token signature.");
  }

  const payload = JSON.parse(decodeBase64Url(body));
  const exp = Number(payload?.exp || 0);
  if (!Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) {
    throw new Error("Launch token expired.");
  }

  return payload;
}
