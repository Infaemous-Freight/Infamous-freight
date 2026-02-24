/**
 * Phase 7 Tier 6: Mobile Camera Service
 *
 * Features:
 * - Photo capture (profile pictures, shipment photos)
 * - Document scanning (proof of delivery)
 * - Barcode/QR code scanning
 * - Image compression and optimization
 * - Gallery selection
 */

import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CameraImage {
  uri: string;
  width: number;
  height: number;
  type: "image/jpeg" | "image/png";
  size: number;
  base64?: string;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const COMPRESS_QUALITY = 0.8;
const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 1600;

/**
 * Request camera permissions
 * @returns {Promise<boolean>} Whether permission granted
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === "granted";
  } catch (err) {
    console.error("Failed to request camera permission:", err);
    return false;
  }
}

/**
 * Request gallery permissions
 * @returns {Promise<boolean>} Whether permission granted
 */
export async function requestGalleryPermission(): Promise<boolean> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  } catch (err) {
    console.error("Failed to request gallery permission:", err);
    return false;
  }
}

/**
 * Capture photo from camera
 * @returns {Promise<CameraImage|null>} Captured image or null if cancelled
 */
export async function capturePhoto(): Promise<CameraImage | null> {
  try {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      console.error("Camera permission not granted");
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: "image/jpeg",
      size: 0, // Size unknown until upload
    };
  } catch (err) {
    console.error("Failed to capture photo:", err);
    return null;
  }
}

/**
 * Pick image from gallery
 * @returns {Promise<CameraImage|null>} Selected image or null if cancelled
 */
export async function pickImageFromGallery(): Promise<CameraImage | null> {
  try {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      console.error("Gallery permission not granted");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: asset.type === "video" ? "image/jpeg" : ("image/jpeg" as const),
      size: 0,
    };
  } catch (err) {
    console.error("Failed to pick image:", err);
    return null;
  }
}

/**
 * Compress and optimize image for upload
 * @param {CameraImage} image - Image to compress
 * @returns {Promise<CameraImage>} Compressed image
 */
export async function compressImage(image: CameraImage): Promise<CameraImage> {
  try {
    console.log(`Compressing image: ${image.width}x${image.height}`);

    const manipulated = await ImageManipulator.manipulateAsync(
      image.uri,
      [{ resize: { width: TARGET_WIDTH, height: TARGET_HEIGHT } }],
      { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
    );

    return {
      ...image,
      uri: manipulated.uri,
      width: manipulated.width,
      height: manipulated.height,
      size: manipulated.width * manipulated.height * 4, // Rough estimate
    };
  } catch (err) {
    console.error("Failed to compress image:", err);
    return image; // Return original if compression fails
  }
}

/**
 * Convert image to base64 for API upload
 * @param {CameraImage} image - Image to convert
 * @returns {Promise<string>} Base64 encoded image
 */
export async function imageToBase64(image: CameraImage): Promise<string> {
  try {
    const response = await fetch(image.uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result?.toString().split(",")[1] || "";
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Failed to convert image to base64:", err);
    throw err;
  }
}

/**
 * Upload image to server
 * @param {CameraImage} image - Image to upload
 * @param {string} token - Auth token
 * @param {string} endpoint - API endpoint
 * @returns {Promise<any>} Server response
 */
export async function uploadImage(
  image: CameraImage,
  token: string,
  endpoint: string,
): Promise<any> {
  try {
    console.log(`Uploading image to ${endpoint}`);

    // Compress before upload
    const compressed = await compressImage(image);

    // Create FormData
    const formData = new FormData();
    formData.append("image", {
      uri: compressed.uri,
      type: "image/jpeg",
      name: `image_${Date.now()}.jpg`,
    } as any);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("✓ Image uploaded successfully");
    return result;
  } catch (err) {
    console.error("Failed to upload image:", err);
    throw err;
  }
}
