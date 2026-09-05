import * as ImagePicker from 'expo-image-picker';

const CLOUD_NAME = 'mx6a0ypj';
const UPLOAD_PRESET = 'primeScout_MediaUploads';

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
  return result.assets[0].uri;
}

// ---- Upload to Cloudinary (unsigned preset) with real progress ----

export function uploadToCloudinary(fileUri, resourceType, onProgress) {
  return new Promise((resolve, reject) => {
    const filename = fileUri.split('/').pop() || `upload.${resourceType === 'video' ? 'mp4' : 'jpg'}`;
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1] : resourceType === 'video' ? 'mp4' : 'jpg';
    const mimeType = resourceType === 'video' ? `video/${ext}` : `image/${ext}`;

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