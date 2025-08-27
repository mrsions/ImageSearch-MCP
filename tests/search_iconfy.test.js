import { jest } from '@jest/globals';

// Create mock functions
const mockFetch = jest.fn();

// Mock modules
jest.unstable_mockModule('node-fetch', () => ({
  default: mockFetch,
}));

// Import the module under test AFTER all mocks
const { search_iconify } = await import('../src/search_iconfy.js');

describe('search_iconify', () => {
  let consoleErrorSpy;
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Default mock for successful fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        start: 0,
        limit: 1,
        icons: ['mdi:home'],
        collections: [{ prefix: 'mdi', name: 'Material Design Icons' }],
      }),
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  test('should return success with image data for a valid query', async () => {
    const query = 'home';
    const result = await search_iconify(query);

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.iconify.design/search?query=${encodeURIComponent(query)}`
    );
    expect(result).toEqual({
      success: true,
      error: '',
      query_time: expect.any(Number),
      page: 1,
      view_count: 1,
      images: [
        {
          url: 'https://api.iconify.design/mdi/home.svg?width=256',
          prompt: [['home'], 'Material Design Icons'],
          width: 256,
          height: 256,
        },
      ],
    });
  });

  test('should return not found content for an empty query', async () => {
    const query = '';
    const result = await search_iconify(query);

    expect(result).toEqual({
      success: false,
      error: 'Not found content',
      query_time: expect.any(Number),
      page_number: 1,
      page_size: 1,
      images: [],
    });
  });

  test('should handle HTTP errors from the API', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const query = 'error';
    const result = await search_iconify(query);

    expect(result).toEqual({
      success: false,
      error: 'Request Http Error: 404',
      query_time: expect.any(Number),
      page: 1,
      view_count: 0,
      images: [],
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.any(Error)
    );
  });

  test('should handle network errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network down'));

    const query = 'network';
    const result = await search_iconify(query);

    expect(result).toEqual({
      success: false,
      error: 'Network down',
      query_time: expect.any(Number),
      page: 1,
      view_count: 0,
      images: [],
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.any(Error)
    );
  });
});