import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BRAND, validateListing, type Store, type Validation } from "@apprank/core";

export interface ApprankServerDeps {
  store: Store;
  name?: string;
  version?: string;
}

const listToolInput = z.object({
  name: z.string().min(1).max(80).describe("Tool name"),
  url: z.string().describe("Tool website URL (must be http(s))"),
  tagline: z.string().min(1).max(140).describe("One-line tagline"),
  category: z.string().min(1).max(60).describe("Category (e.g. Productivity, Coding, Agents)"),
  x_handle: z
    .string()
    .optional()
    .describe("Optional X (Twitter) handle, with or without the leading @"),
});
type ListToolArgs = z.infer<typeof listToolInput>;

const getListingInput = z.object({
  tool_id: z.string().min(1).max(64).describe("The listing id (uuid) returned by list_tool"),
});
type GetListingArgs = z.infer<typeof getListingInput>;

/**
 * Builds the AppRank MCP server (working title) with the MVP tools:
 *  - list_tool   : submit a tool (agent can list you) -> writes to the same DB as the web form
 *  - get_listing : fetch one listing by id
 *  - resource top-10 : the latest live listings
 *
 * Pure of any transport — usable over InMemoryTransport (tests), streamable HTTP, or stdio.
 */
export function createApprankServer(deps: ApprankServerDeps): McpServer {
  const server = new McpServer(
    { name: deps.name ?? BRAND.name, version: deps.version ?? "0.1.0" },
    { capabilities: { tools: {}, resources: {} } }
  );

  server.registerTool(
    "list_tool",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {
      title: "List an AI tool",
      description:
        `Submit an AI tool to ${BRAND.name} for free. Your agent can list you in ~2 minutes. ` +
        `Validates the input, writes to the same database the web form uses, and returns the new listing id and status.`,
      inputSchema: listToolInput,
    } as any,
    (async (raw: unknown) => {
      const args = raw as ListToolArgs;
      const validated = validateInput(args);
      if (!validated.ok) {
        return {
          content: [{ type: "text", text: `Validation failed: ${validated.errors.join("; ")}` }],
          isError: true,
        };
      }
      const listing = await deps.store.insertListing(validated.value);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              id: listing.id,
              name: listing.name,
              status: listing.status,
              url: listing.url,
              category: listing.category,
              x_handle: listing.x_handle,
              created_at: listing.created_at.toISOString(),
            }),
          },
        ],
      };
    }) as any,
  );

  server.registerTool(
    "get_listing",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {
      title: "Get a listing",
      description: `Fetch a single ${BRAND.name} listing by its id.`,
      inputSchema: getListingInput,
    } as any,
    (async (raw: unknown) => {
      const args = raw as GetListingArgs;
      const listing = await deps.store.getListing(args.tool_id);
      if (!listing) {
        return {
          content: [{ type: "text", text: `No listing found for id ${args.tool_id}` }],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              id: listing.id,
              name: listing.name,
              tagline: listing.tagline,
              url: listing.url,
              category: listing.category,
              x_handle: listing.x_handle,
              status: listing.status,
              created_at: listing.created_at.toISOString(),
            }),
          },
        ],
      };
    }) as any,
  );

  server.registerResource(
    "top-10",
    "apprank://listings/top-10",
    {
      title: "Latest listings",
      description: `The ${BRAND.name} latest-10 live listings, newest first.`,
      mimeType: "application/json",
    },
    async (uri) => {
      const listings = await deps.store.listLatest(10);
      const text = JSON.stringify(
        listings.map((l) => ({
          name: l.name,
          tagline: l.tagline,
          url: l.url,
          category: l.category,
          x_handle: l.x_handle,
          status: l.status,
          created_at: l.created_at.toISOString(),
        })),
        null,
        2
      );
      return { contents: [{ uri: uri.href, mimeType: "application/json", text }] };
    }
  );

  return server;
}

function validateInput(raw: {
  name: unknown;
  url: unknown;
  tagline: unknown;
  category: unknown;
  x_handle?: unknown;
}): Validation {
  // Reuse the core validator so the MCP server and web form accept identical input
  // (single source of truth for listing rules).
  return validateListing(raw);
}
