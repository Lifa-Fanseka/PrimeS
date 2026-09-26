import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const CLOUD_NAME = 'mx6a0ypj';
const UPLOAD_PRESET = 'primeScout_MediaUploads';


const MIN_VIDEO_DURATION_MS = 60 * 1000;       // 60 seconds
const MAX_VIDEO_DURATION_MS = 3 * 60 * 1000;   // 3 minutes
const MAX_VIDEO_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

// ---- Pickers ----

export async function pickImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Permission to access your photos was denied.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
}

export async function pickVideo() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Permission to access your videos was denied.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    quality: 1,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];

  // Some Android devices report this as lowercase "filesize" instead
  // of "fileSize" — a real, documented inconsistency in the picker's
  // result object — so both are checked to be safe across devices.
  const fileSizeBytes = asset.fileSize ?? asset.filesize ?? null;
  const durationMs = asset.duration ?? null;

  if (durationMs != null) {
    if (durationMs < MIN_VIDEO_DURATION_MS) {
      throw new Error('Highlight videos must be at least 60 seconds long.');
    }
    if (durationMs > MAX_VIDEO_DURATION_MS) {
      throw new Error('Highlight videos can be a maximum of 3 minutes long.');
    }
  }
  // If duration genuinely isn't available on this device/platform, we
  // can't check it client-side — it's allowed through here rather than
  // blocking a valid upload over a missing metadata field.

  if (fileSizeBytes != null && fileSizeBytes > MAX_VIDEO_FILE_SIZE_BYTES) {
    const sizeMb = (fileSizeBytes / (1024 * 1024)).toFixed(1);
    throw new Error(`Video is too large (${sizeMb}MB). Maximum allowed size is 50MB.`);
  }

  return asset.uri;
}

// ---- Document picking (for recruitment offer PDF attachments) ----

export async function pickDocument() {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];
  return { uri: asset.uri, name: asset.name, size: asset.size };
}

// ---- Upload to Cloudinary (unsigned preset) with real progress ----

export function uploadToCloudinary(fileUri, resourceType, onProgress) {
  return new Promise((resolve, reject) => {
    const defaultExt = resourceType === 'video' ? 'mp4' : resourceType === 'raw' ? 'pdf' : 'jpg';
    const filename = fileUri.split('/').pop() || `upload.${defaultExt}`;
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1] : defaultExt;
    const mimeType =
      resourceType === 'video' ? `video/${ext}` :
      resourceType === 'raw' ? 'application/pdf' :
      `image/${ext}`;

    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: mimeType,
    });
    formData.append('upload_preset', UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } catch (e) {
          reject(new Error('Could not parse Cloudinary response.'));
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload.'));

    xhr.send(formData);
  });
}

// ---- Convenience combos: pick + upload in one call ----

export async function pickAndUploadImage(onProgress) {
  const uri = await pickImage();
  if (!uri) return null;
  return uploadToCloudinary(uri, 'image', onProgress);
}

export async function pickAndUploadVideo(onProgress) {
  const uri = await pickVideo();
  if (!uri) return null;
  return uploadToCloudinary(uri, 'video', onProgress);
}

export async function pickAndUploadDocument(onProgress) {
  const doc = await pickDocument();
  if (!doc) return null;
  const url = await uploadToCloudinary(doc.uri, 'raw', onProgress);
  return { url, name: doc.name };
}