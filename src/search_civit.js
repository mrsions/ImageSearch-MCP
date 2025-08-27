#!/usr/bin/env node
/**
 * civitai_image_search.js
 * 검색어를 입력하면 Civitai 이미지 검색 결과를 요약해 JSON으로 반환합니다.
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

const ENDPOINT = "https://api.searchcivitai.com/api/images?sort_by=default&nsfw=None&m=img&page=1&q={query}";

/**
 * 주어진 검색어(query)로 Civitai 이미지 검색 API를 호출하고,
 * 요약된 정보를 담은 객체를 반환합니다.
 */
async function search_civit(query) {
    return new Promise((resolve, reject) => {
        const encodedQuery = encodeURIComponent(query);
        const url = ENDPOINT.replace('{query}', encodedQuery);
        const urlObj = new URL(url);
        
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const req = client.request(url, { timeout: 10000 }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP 오류: ${res.statusCode} ${res.statusMessage}`));
                    return;
                }
                
                try {
                    const jsonData = JSON.parse(data);
                    
                    // 이미지 필드 요약
                    const summaryImages = [];
                    const images = jsonData.images || [];
                    
                    for (const item of images) {
                        const img = item.image || {};
                        const meta = img.meta || {};
                        
                        summaryImages.push({
                            url: img.url,
                            Model: meta.Model,
                            prompt: meta.prompt,
                            width: img.width,
                            height: img.height
                        });
                    }
                    
                    // 전체 구조
                    const summary = {
                      query_time: jsonData.query_time,
                      page: jsonData.page_number,
                      view_count: jsonData.page_size,
                      total_count: jsonData.total_results,
                      total_page: jsonData.total_pages,
                      images: summaryImages,
                    };
                    
                    resolve(summary);
                } catch (error) {
                    reject(new Error(`JSON 파싱 오류: ${error.message}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(new Error(`요청 오류: ${error.message}`));
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('요청 시간 초과 (10초)'));
        });
        
        req.end();
    });
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.error('사용법: node image_search.js "검색어"');
        process.exit(1);
    }
    
    const query = args.join(' '); // 공백 포함 검색어 지원
    
    try {
        const result = await search_civit(query);
        console.log(JSON.stringify(result, null, 4));
    } catch (error) {
        console.error(`오류: ${error.message}`);
        process.exit(1);
    }
}

// 직접 실행시에만 main 함수 호출
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { search_civit };