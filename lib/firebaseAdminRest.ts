import crypto from "crypto";

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "varahi-eat";

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

function getServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
  const parsed = JSON.parse(raw) as ServiceAccount;
  if (!parsed.client_email || !parsed.private_key) throw new Error("Invalid Firebase service account JSON");
  return parsed;
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

async function getAccessToken() {
  const account = getServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(account.private_key, "base64url");
  const assertion = `${unsigned}.${signature}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Google token request failed: ${response.status}`);
  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error("Google access token missing");
  return data.access_token;
}

function firestoreBase() {
  const project = encodeURIComponent(FIREBASE_PROJECT_ID);
  return `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
}

function stringField(value: string) {
  return { stringValue: value };
}

export async function getFirestoreDocument(collectionName: string, documentId: string) {
  const token = await getAccessToken();
  const response = await fetch(`${firestoreBase()}/${encodeURIComponent(collectionName)}/${encodeURIComponent(documentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Firestore GET failed: ${response.status}`);
  return response.json();
}

export async function patchFirestoreDocument(collectionName: string, documentId: string, fields: Record<string, unknown>) {
  const token = await getAccessToken();
  const updateMask = Object.keys(fields).map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`).join("&");
  const response = await fetch(`${firestoreBase()}/${encodeURIComponent(collectionName)}/${encodeURIComponent(documentId)}?${updateMask}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Firestore PATCH failed: ${response.status}`);
  return response.json();
}

export async function createFirestoreDocument(collectionName: string, documentId: string, fields: Record<string, unknown>) {
  const token = await getAccessToken();
  const response = await fetch(`${firestoreBase()}/${encodeURIComponent(collectionName)}/${encodeURIComponent(documentId)}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Firestore create failed: ${response.status}`);
  return response.json();
}

export const firestoreString = stringField;
export const firestoreTimestamp = (value = new Date()) => ({ timestampValue: value.toISOString() });
