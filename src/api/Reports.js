// File location in the project: api/reports.js
//
// NOTE: expo-file-system SDK 54 split into a new API and a legacy one.
// The root 'expo-file-system' import no longer exposes writeAsStringAsync/
// EncodingType/cacheDirectory the old way — that surface now lives under
// '/legacy'. Importing from there keeps this file working the same as it
// always did without a rewrite to the new File/Directory/Paths API.
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import api from './client';

// Turns the filter object into a query string, skipping empty values so
// the backend's own defaults (Scope=Watchlist, Format=pdf) kick in.
function buildQuery(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.append(key, value);
    }
  });
  return params.toString();
}

// Shared by every report endpoint: requests the file from the API as raw
// bytes, saves it locally, and opens the native share sheet so the user
// can save it, email it, or send it on however they like.
async function downloadAndShareReport(endpoint, filters, baseFileName) {
  const query = buildQuery(filters);
  const format = filters.format === 'excel' ? 'excel' : 'pdf';

  let response;
  try {
    response = await api.get(`${endpoint}?${query}`, {
      responseType: 'arraybuffer',
    });
  } catch (err) {
    // With responseType: 'arraybuffer', an ERROR response (404/401/500/etc.)
    // also comes back as raw bytes instead of readable JSON/text — so
    // err.response.data is an ArrayBuffer, not a string, unless we decode
    // it ourselves here. Without this, every failure looks identical to
    // the caller no matter what actually went wrong on the server.
    if (err?.response?.data instanceof ArrayBuffer) {
      try {
        const decoded = new TextDecoder('utf-8').decode(err.response.data);
        err.response.data = decoded;
        console.log('[reports] server error body:', decoded);
      } catch (decodeErr) {
        console.log('[reports] could not decode error body:', decodeErr);
      }
    }
    console.log('[reports] request failed:', endpoint, err?.response?.status, err?.message);
    throw err;
  }

  const extension = format === 'excel' ? 'xlsx' : 'pdf';
  const mimeType =
    format === 'excel'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/pdf';

  const fileName = `${baseFileName}_${Date.now()}.${extension}`;
  const fileUri = FileSystem.cacheDirectory + fileName;

  await FileSystem.writeAsStringAsync(fileUri, arrayBufferToBase64(response.data), {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: 'PrimeScout Report' });
  }

  return { fileUri, fileName };
}

// Requests the Scout report — shortlisted/favorited/scouted athletes with
// goals, assists, and match-by-match stats.
export async function generateScoutReport(filters) {
  return downloadAndShareReport('/api/Reports/scout', filters, 'PrimeScout_ScoutReport');
}

// Requests the Coach report — team match history plus per-player
// performance across those matches.
export async function generateCoachReport(filters) {
  return downloadAndShareReport('/api/Reports/coach', filters, 'PrimeScout_CoachReport');
}

// Requests the League Admin report — standings, top scorers, recent
// results and upcoming fixtures for one of the admin's competitions.
export async function generateLeagueReport(filters) {
  return downloadAndShareReport('/api/Reports/league', filters, 'PrimeScout_LeagueReport');
}

// arraybuffer -> base64, without pulling in a Buffer polyfill. global.btoa
// exists on most RN/Hermes builds; the manual encoder below is the
// fallback for engines that don't have it.
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return typeof global.btoa === 'function' ? global.btoa(binary) : base64EncodeFallback(binary);
}

function base64EncodeFallback(binary) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  let i = 0;
  for (; i + 2 < binary.length; i += 3) {
    const b1 = binary.charCodeAt(i);
    const b2 = binary.charCodeAt(i + 1);
    const b3 = binary.charCodeAt(i + 2);
    output +=
      chars[b1 >> 2] +
      chars[((b1 & 3) << 4) | (b2 >> 4)] +
      chars[((b2 & 15) << 2) | (b3 >> 6)] +
      chars[b3 & 63];
  }
  const remaining = binary.length - i;
  if (remaining === 1) {
    const b1 = binary.charCodeAt(i);
    output += chars[b1 >> 2] + chars[(b1 & 3) << 4] + '==';
  } else if (remaining === 2) {
    const b1 = binary.charCodeAt(i);
    const b2 = binary.charCodeAt(i + 1);
    output += chars[b1 >> 2] + chars[((b1 & 3) << 4) | (b2 >> 4)] + chars[(b2 & 15) << 2] + '=';
  }
  return output;
}