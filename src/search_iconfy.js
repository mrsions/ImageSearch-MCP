import https from "https";
import http from "http";
import { URL } from "url";
import fetch from "node-fetch";

async function search_iconify(query) {
  console.log(`search_iconify(${query})`);

  const starttime = new Date();
  const keywords = [
    ...query
      .split(" ")
      .filter((t) => t?.trim())
      .map((t) => t.trim()),
  ];

  for (let i = 0; i < keywords.length; i++) {
    const rst = await __search(
      keywords.slice(0, keywords.length - i).join(" "), starttime // Pass starttime
    );
    if (rst) return rst;
  }

  for (let i = 0; i < keywords.length; i++) {
    const rst = await __search(keywords[i], starttime); // Pass starttime
    if (rst) return rst;
  }

  return {
    success: false, // true라면 error는 비어있다.
    error: "Not found content", // 에러 이유가 표시된다.
    query_time: new Date() - starttime, // ms
    page_number: 1, // 페이지
    page_size: 1, // 페이지당 갯수
    images: [],
  };
}

async function __search(query, starttime) { // Accept starttime
  try {
    console.log(`search_iconify(${query})`);
    const response = await fetch(
      `https://api.iconify.design/search?query=${encodeURIComponent(query)}`
    );
    if (!response.ok) {
      throw new Error(`Request Http Error: ${response.status}`);
    }

    const data = await response.json();
    const collections = optimizeCollection(data.collections);
    console.log(`search_iconify(${query})`, "response");

    const items = data.icons.map((v) => {
      const [family, name] = v.split(":");
      return {
        url: `https://api.iconify.design/${family}/${name}.svg?width=256`,
        prompt: [name.split(/\W/g), ...(collections[family] || [])],
        width: 256,
        height: 256,
      };
    });

    console.log(`search_iconify(${query})`, "return?");
    return {
      success: true, // true라면 error는 비어있다.
      error: "", // 에러 이유가 표시된다。
      query_time: new Date() - starttime, // ms
      page: data.start + 1, // 페이지
      view_count: data.limit, // 페이지당 갯수
      images: items,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error.message,
      query_time: new Date() - starttime,
      page: 1,
      view_count: 0,
      images: [],
    };
  }
}

// Missing optimizeCollection function
function optimizeCollection(collections) {
  // Simple implementation - return collection names as arrays
  const result = {};
  if (collections && Array.isArray(collections)) {
    collections.forEach((collection) => {
      if (collection && collection.prefix) {
        result[collection.prefix] = [collection.name || collection.prefix];
      }
    });
  }
  return result;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('사용법: node image_search.js "검색어"');
    process.exit(1);
  }

  const query = args.join(" "); // 공백 포함 검색어 지원

  try {
    const result = await search_iconify(query);
    console.log(JSON.stringify(result, null, 4));
  } catch (error) {
    console.error(`오류: ${error.message}`);
    process.exit(1);
  }
}

// 직접 실행시에만 main 함수 호출
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { search_iconify };