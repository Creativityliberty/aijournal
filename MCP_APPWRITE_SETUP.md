# MCP Server for Appwrite API

The MCP server for Appwrite API allows LLMs and code-generation tools to interact with the Appwrite platform and perform various operations on your Appwrite resources, such as creating users, managing databases, and more, using natural language commands.

## Key Benefits

- **Direct API interaction**: Enables LLMs to perform actions directly on your Appwrite project
- **Real-time data access**: Allows LLMs to fetch and manipulate live data from your Appwrite instance
- **Simplified workflows**: Facilitates complex operations through simple natural language prompts
- **Customizable tools**: Offers a range of tools for different Appwrite services, which can be enabled as needed

## Pre-requisites

### Appwrite API Key

Before launching the MCP server, you must set up an Appwrite project and create an API key with the necessary scopes enabled.

Ensure you save the API key along with the project ID, region and endpoint URL from the Settings page of your project as you'll need them later.

### Install uv

Install uv on your system with:

**Linux and macOS:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows:**
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Verify the installation:
```bash
uv
```

## Installation

You can add the MCP server to various AI tools and code editors:
- Claude Desktop
- Claude Code
- Cursor
- Windsurf Editor
- VS Code
- OpenCode

## Configuration

Add the following to your `mcp_config.json`:

```json
{
  "mcpServers": {
    "appwrite-api": {
      "command": "uvx",
      "args": [
        "mcp-server-appwrite",
        "--databases",
        "--users",
        "--storage",
        "--functions"
      ],
      "env": {
        "APPWRITE_PROJECT_ID": "691a6f970027876be2db",
        "APPWRITE_API_KEY": "your-api-key-here",
        "APPWRITE_ENDPOINT": "https://fra.cloud.appwrite.io/v1"
      }
    }
  }
}
```

## Command-line Arguments

Database tools are enabled by default. You can pass arguments to `uvx mcp-server-appwrite [args]` to enable other MCP tools:

| Argument | Description |
|----------|-------------|
| `--databases` | Enables the Databases API |
| `--users` | Enables the Users API |
| `--teams` | Enables the Teams API |
| `--storage` | Enables the Storage API |
| `--functions` | Enables the Functions API |
| `--messaging` | Enables the Messaging API |
| `--locale` | Enables the Locale API |
| `--avatars` | Enables the Avatars API |
| `--all` | Enables all Appwrite APIs |

### Important Note

When an MCP tool is enabled, the tool's definition is passed to the LLM, using up tokens from the model's available context window. As a result, the effective context window is reduced. Some IDEs may return errors if too many tools are enabled for the same reason.

The default Appwrite MCP server ships with only the Databases tools (the most commonly used API) enabled to stay within these limits. Additional tools can be enabled using the flags above.

## Usage Examples

Once configured, your AI assistant will have access to your Appwrite project. You can ask questions like:

### Example 1: List users
```
List users in my Appwrite project
```

### Example 2: Search data
```
Get the details of my portfolio site from Appwrite
```

### Example 3: Create a user
```
Add a user john.doe@example.com to the Appwrite project
```

## Current Configuration

Your project is configured with:
- **Project ID**: `691a6f970027876be2db`
- **Endpoint**: `https://fra.cloud.appwrite.io/v1`
- **Enabled APIs**: Databases, Users, Storage, Functions

This allows you to manage your journal data, user authentication, file storage, and serverless functions directly through natural language commands.
