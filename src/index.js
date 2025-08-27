#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { search_civit } from "./search_civit.js";
import { download_image } from "./download_image.js";
import { search_iconify } from "./search_iconfy.js";

/** Create server instance */
const server = new McpServer({
  name: 'imagesearch-mcp',
  version: '1.0.0',
});

/** Register tool for image search */
server.tool(
  "search_image",
  `Search for images from Iconify or AI-generated images from Civitai.  
The found images are AI-generated and can be used freely.

**type**: The category of the required image (icon | picture | background | portrait)  
**query**: The keyword or prompt for the required image. Separate multiple words with spaces.

response data type  
{    
  "success": true, // If true, the error field will be empty.
  "images": [                                                                                                                                                                   
    {                                                                                                                                                                         
        "url": "image url",
        "prompt": "pepe the frog..", // The prompt used to generate the image
        "width": 1024, // width
        "height": 1024 // height
    },
  ]  
}`,
  {
    type: z
      .string()
      .describe("The category of the required image (icon | picture | background | portrait)"),
    query: z
      .string()
      .describe(
        "Enter the keywords or prompt for the required image. Separate multiple words with spaces."
      ),
  },
  async ({ type, query }) => {
    console.log(`search ${type}: ${query}`)

    let result = undefined;
    switch (type) {
      case "icon":
        result = await search_iconify(query);
        break;

      default:
        result = await search_civit(type + " " + query);
        break;
    }

    return { content: [ {
           type:"text", text:JSON.stringify(result) 
    }]};
  }
);

server.tool(
  "download_image",
  `Download the image to the specified path. Optionally, you can set the image size and background color.`,
  {
    url: z.string().url().describe("URL of the image to download"),
    path: z.string().describe("Local path to save the image (e.g., images/my_image.png)"),
    width: z.number().optional().describe("Image width (in pixels)"),
    height: z.number().optional().describe("Image height (in pixels)"),
    color: z.string().optional().describe("Image background color (e.g., red, #FFFFFF)"),
  },
  async ({ url, path, width, height, color }) => {
    const result = await download_image(url, path, width, height, color);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});













