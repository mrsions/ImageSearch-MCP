import { jest } from '@jest/globals';

// Create mock functions
const mockHttps = {
  request: jest.fn(),
};
const mockHttp = {
  request: jest.fn(),
};

// Mock modules
jest.unstable_mockModule('https', () => ({
  default: mockHttps,
}));

jest.unstable_mockModule('http', () => ({
  default: mockHttp,
}));

// Import the module under test AFTER all mocks
const { search_civit } = await import('../src/search_civit.js');

describe('search_civit', () => {
  const mockCivitaiResponse = {
    query_time: 100,
    page_number: 1,
    page_size: 20,
    total_results: 2,
    total_pages: 1,
    images: [
      {
        image: {
          url: 'http://example.com/image1.jpg',
          meta: {
            Model: 'ModelA',
            prompt: 'prompt1',
          },
          width: 512,
          height: 512,
        },
      },
      {
        image: {
          url: 'http://example.com/image2.jpg',
          meta: {
            Model: 'ModelB',
            prompt: 'prompt2',
          },
          width: 768,
          height: 768,
        },
      },
    ],
  };

  const setupMockRequest = (mockFn, statusCode, data, error = null) => {
    mockFn.mockImplementation((url, options, callback) => {
      const mockReq = {
        on: jest.fn((event, handler) => {
          if (event === 'error' && error) {
            handler(error);
          }
          if (event === 'timeout') {
            // Simulate timeout if needed
          }
        }),
        end: jest.fn(),
        destroy: jest.fn(),
      };
      const mockRes = {
        statusCode,
        statusMessage: statusCode === 404 ? 'Not Found' : 'OK', // Directly set statusMessage based on statusCode
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            handler(Buffer.from(data));
          }
          if (event === 'end') {
            handler();
          }
        }),
      };
      callback(mockRes);
      return mockReq;
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default to HTTPS for most tests
    setupMockRequest(mockHttps.request, 200, JSON.stringify(mockCivitaiResponse));
  });

  test('should fetch and summarize Civitai image search results successfully', async () => {
    const query = 'test query';
    const result = await search_civit(query);

    expect(mockHttps.request).toHaveBeenCalledTimes(1);
    expect(mockHttps.request).toHaveBeenCalledWith(
      `https://api.searchcivitai.com/api/images?sort_by=default&nsfw=None&m=img&page=1&q=${encodeURIComponent(query)}`,
      { timeout: 10000 },
      expect.any(Function)
    );

    expect(result).toEqual({
      query_time: 100,
      page: 1,
      view_count: 20,
      total_count: 2,
      total_page: 1,
      images: [
        {
          url: 'http://example.com/image1.jpg',
          Model: 'ModelA',
          prompt: 'prompt1',
          width: 512,
          height: 512,
        },
        {
          url: 'http://example.com/image2.jpg',
          Model: 'ModelB',
          prompt: 'prompt2',
          width: 768,
          height: 768,
        },
      ],
    });
  });

  test('should handle HTTP errors from the API', async () => {
    setupMockRequest(mockHttps.request, 404, 'Not Found');
    const query = 'error query';

    await expect(search_civit(query)).rejects.toThrow('HTTP 오류: 404 Not Found');
  });

  test('should handle JSON parsing errors', async () => {
    setupMockRequest(mockHttps.request, 200, 'invalid json');
    const query = 'invalid json query';

    await expect(search_civit(query)).rejects.toThrow('JSON 파싱 오류');
  });

  test('should handle request errors', async () => {
    mockHttps.request.mockImplementation((url, options, callback) => {
      const mockReq = {
        on: jest.fn((event, handler) => {
          if (event === 'error') {
            handler(new Error('Network error'));
          }
        }),
        end: jest.fn(),
        destroy: jest.fn(),
      };
      return mockReq;
    });
    const query = 'network error query';

    await expect(search_civit(query)).rejects.toThrow('요청 오류: Network error');
  });
});