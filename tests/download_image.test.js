import { jest } from '@jest/globals';

// Create mock functions
const mockFetch = jest.fn();
const mockSharp = jest.fn();
const mockFs = {
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  stat: jest.fn(),
};
const mockPath = {
  extname: jest.fn(),
  dirname: jest.fn(),
};

// Mock modules before imports
jest.unstable_mockModule('node-fetch', () => ({
  default: mockFetch,
}));

jest.unstable_mockModule('sharp', () => ({
  default: mockSharp,
}));

jest.unstable_mockModule('fs', () => ({
  promises: mockFs,
}));

jest.unstable_mockModule('path', () => ({
  default: mockPath,
}));

// Import the module under test AFTER all mocks
const { download_image } = await import('../src/download_image.js');

describe('download_image', () => {
  const mockUrl = 'http://example.com/image.png';
  const mockFilePath = '/tmp/image.png';
  const mockBuffer = Buffer.from('mock image data');
  const mockMetadata = { width: 100, height: 100, format: 'png' };
  const mockFileStats = { size: mockBuffer.length };

  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      buffer: jest.fn().mockResolvedValue(mockBuffer),
      headers: {
        get: jest.fn().mockReturnValue('image/png'),
      },
    });

    // Mock sharp
    mockSharp.mockReturnValue({
      resize: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue(mockBuffer),
      metadata: jest.fn().mockResolvedValue(mockMetadata),
      png: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
    });

    // Mock fs.promises
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue(mockFileStats);

    // Mock path
    mockPath.extname.mockReturnValue('.png');
    mockPath.dirname.mockReturnValue('/tmp');
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore(); // Restore original console.error
  });

  test('should download and save an image successfully', async () => {
    const result = await download_image(mockUrl, mockFilePath);

    expect(mockFetch).toHaveBeenCalledWith(mockUrl);
    expect(mockFs.mkdir).toHaveBeenCalledWith('/tmp', { recursive: true });
    expect(mockFs.writeFile).toHaveBeenCalledWith(mockFilePath, mockBuffer);
    expect(result).toEqual({
      success: true,
      message: `Image downloaded and saved to ${mockFilePath}`,
      savedPath: mockFilePath,
      imageInfo: {
        width: mockMetadata.width,
        height: mockMetadata.height,
        format: mockMetadata.format,
        size: mockFileStats.size,
      },
    });
  });

  test('should handle fetch errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const result = await download_image(mockUrl, mockFilePath);

    expect(result).toEqual({
      success: false,
      error: 'Failed to download image: Not Found (Status: 404)',
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error downloading or saving image'),
      expect.stringContaining('Failed to download image: Not Found (Status: 404)')
    );
  });

  test('should resize image if width or height is provided', async () => {
    const width = 50;
    const height = 50;
    await download_image(mockUrl, mockFilePath, width, height);

    expect(mockSharp).toHaveBeenCalledWith(mockBuffer);
    expect(mockSharp().resize).toHaveBeenCalledWith({
      width,
      height,
      fit: 'inside',
      withoutEnlargement: true,
    });
    expect(mockSharp().toBuffer).toHaveBeenCalled();
  });

  test('should handle Iconify URL parameters', async () => {
    const iconifyUrl = 'https://api.iconify.design/mdi/home.svg';
    const width = 32;
    const height = 32;
    const color = '#FF0000';

    await download_image(iconifyUrl, mockFilePath, width, height, color);

    const expectedUrl = `https://api.iconify.design/mdi/home.svg?width=32&height=32&color=FF0000`;
    expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
  });

  test('should handle Civitai URL width modification', async () => {
    const civitaiUrl = 'https://image.civitai.com/xG1nkqKTMzGDvpLrqQQPtA/a7212345-1234-5678-90ab-1234567890ab/width=512/image.jpeg';
    const width = 768;

    await download_image(civitaiUrl, mockFilePath, width);

    const expectedUrl = 'https://image.civitai.com/xG1nkqKTMzGDvpLrqQQPtA/a7212345-1234-5678-90ab-1234567890ab/width=768/image.jpeg';
    expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
  });

  test('should convert SVG to PNG if target path is PNG', async () => {
    const svgUrl = 'http://example.com/icon.svg';
    const pngPath = '/tmp/icon.png';

    mockPath.extname.mockReturnValueOnce('.png');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      buffer: jest.fn().mockResolvedValue(mockBuffer),
      headers: {
        get: jest.fn().mockReturnValue('image/svg+xml'),
      },
    });

    await download_image(svgUrl, pngPath);

    expect(mockSharp().png).toHaveBeenCalled();
    expect(mockSharp().toBuffer).toHaveBeenCalled();
  });

  test('should throw error if image size exceeds limit', async () => {
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    mockFetch.mockResolvedValueOnce({
      ok: true,
      buffer: jest.fn().mockResolvedValue(largeBuffer),
      headers: {
        get: jest.fn().mockReturnValue('image/png'),
      },
    });

    const result = await download_image(mockUrl, mockFilePath);

    expect(result).toEqual({
      success: false,
      error: expect.stringContaining('Image size (11.00MB) exceeds the maximum allowed size of 10MB.'),
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error downloading or saving image'),
      expect.stringContaining('Image size (11.00MB) exceeds the maximum allowed size of 10MB.')
    );
  });

  test('should handle errors during file writing', async () => {
    mockFs.writeFile.mockRejectedValueOnce(new Error('Disk full'));

    const result = await download_image(mockUrl, mockFilePath);

    expect(result).toEqual({
      success: false,
      error: 'Disk full',
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error downloading or saving image'),
      expect.stringContaining('Disk full')
    );
  });
});