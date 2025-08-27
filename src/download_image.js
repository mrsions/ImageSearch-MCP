import fetch from 'node-fetch';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import pathModule from 'path';

// Define max file size (10MB)
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

async function download_image(url, path, width, height, color) {
  try {
    let finalUrl = url;

    // Iconify URL parameter handling
    if (url.startsWith('https://api.iconify.design/')) {
      const urlObj = new URL(url);
      if (width) urlObj.searchParams.append('width', width);
      if (height) urlObj.searchParams.append('height', height);
      if (color) urlObj.searchParams.append('color', color.replace('#', ''));
      finalUrl = urlObj.toString();
    }
    // Civitai URL width modification
    else if (url.includes('image.civitai.com') && width) {
      const widthRegex = /width=\d+/;
      if (finalUrl.match(widthRegex)) {
        finalUrl = finalUrl.replace(widthRegex, `width=${width}`);
      } else {
        const urlParts = finalUrl.split('?');
        const baseUrl = urlParts[0];
        const queryString = urlParts[1] ? `?${urlParts[1]}` : '';
        const lastSlashIndex = baseUrl.lastIndexOf('/');
        const lastDotIndex = baseUrl.lastIndexOf('.');

        if (lastDotIndex > lastSlashIndex) {
            finalUrl = `${baseUrl.substring(0, lastDotIndex)}_width=${width}${baseUrl.substring(lastDotIndex)}${queryString}`;
        } else {
            finalUrl = `${baseUrl}/width=${width}${queryString}`;
        }
      }
    }

    const response = await fetch(finalUrl);

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText} (Status: ${response.status})`);
    }

    let imageBuffer = await response.buffer();

    // Check file size immediately after download
    if (imageBuffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`Image size (${(imageBuffer.length / (1024 * 1024)).toFixed(2)}MB) exceeds the maximum allowed size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`);
    }

    const contentType = response.headers.get('content-type');

    const isSvgInput = url.toLowerCase().endsWith('.svg') || (contentType && contentType.includes('image/svg+xml'));

    // Image resizing using sharp
    if (width || height) {
      let sharpInstance = sharp(imageBuffer);
      sharpInstance = sharpInstance.resize({
        width: width,
        height: height,
        fit: 'inside',
        withoutEnlargement: true
      });
      imageBuffer = await sharpInstance.toBuffer();
    }

    const ext = pathModule.extname(path).toLowerCase();
    const dir = pathModule.dirname(path);
    await fs.mkdir(dir, { recursive: true });

    // SVG conversion to PNG/JPG
    if (isSvgInput && (ext === '.png' || ext === '.jpg' || ext === '.jpeg')) {
      let sharpInstance = sharp(imageBuffer);
      if (ext === '.png') {
        imageBuffer = await sharpInstance.png().toBuffer();
      } else { // .jpg or .jpeg
        imageBuffer = await sharpInstance.jpeg().toBuffer();
      }
    }

    await fs.writeFile(path, imageBuffer);

    // Get image metadata and file size for structured response
    let metadata = {};
    try {
      metadata = await sharp(imageBuffer).metadata();
    } catch (metaError) {
      console.warn(`Could not get metadata for ${path}:`, metaError.message);
    }

    let fileStats = {};
    try {
      fileStats = await fs.stat(path);
    } catch (statError) {
      console.warn(`Could not get file stats for ${path}:`, statError.message);
    }

    return {
      success: true,
      message: `Image downloaded and saved to ${path}`,
      savedPath: path,
      imageInfo: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: fileStats.size, // in bytes
      },
    };
  } catch (error) {
    console.error(`Error downloading or saving image from ${url} to ${path}:`, error.message);
    return { success: false, error: error.message };
  }
}

export { download_image };