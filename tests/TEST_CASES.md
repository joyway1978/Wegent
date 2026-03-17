# Wegent E2E Test Cases Documentation

This document describes all E2E test cases in the Wegent project.

**Note:** When adding new test cases, update this file following [Rule 2 in CLAUDE.md](./CLAUDE.md).

---

## Chat Flow Tests (`specs/chat-flow.spec.ts`)

| Test Case | Description |
|-----------|-------------|
| `should send message and receive AI response` | Tests basic chat functionality - sends a message and verifies AI response is received |
| `should use clarification mode for vague requests` | Tests the clarification workflow when user input is ambiguous or incomplete |

**Setup Requirements:**
- Requires `wegent-chat` agent to be available
- Requires model `公网:GLM-5` to be available

---

## Code Flow Tests (`specs/code-flow.spec.ts`)

| Test Case | Description |
|-----------|-------------|
| `should analyze repository and provide code suggestions` | Tests repository analysis functionality - selects dev-team agent, wecode-ai/Wegent repo, and requests code analysis |
| `should create a new file in the repository` | Tests file creation workflow in the code editor |

**Setup Requirements:**
- Requires `dev-team` agent to be available
- Requires `wecode-ai/Wegent` repository to be accessible
- Requires git workspace to be configured

---

## Knowledge Flow Tests (`specs/knowledge-flow.spec.ts`)

| Test Case | Description |
|-----------|-------------|
| `should create and display a new notebook knowledge base` | Tests creating a Notebook type knowledge base and verifying it appears in the list |
| `should create and convert knowledge base type` | Tests creating a Classic knowledge base and converting it to Notebook type |
| `should navigate between knowledge scopes` | Tests tab navigation between Personal, Group, and Organization knowledge bases |
| `should search knowledge bases` | Tests the search functionality for filtering knowledge bases |
| `should open knowledge base detail` | Tests opening a knowledge base detail page from the list |

**Setup Requirements:**
- User must be logged in
- Auto-generate summary switch should be handled (disabled to avoid model selection requirement)

---

## Chat Group Flow Tests (`specs/chat-group-flow.spec.ts`)

| Test Case | Description |
|-----------|-------------|
| `should create a new group chat` | Tests creating a new group chat with title, team, and model selection |
| `should send message in group chat` | Tests sending a message in group chat and verifying it appears |
| `should open members panel in group chat` | Tests opening the members panel to view group members |
| `should generate invite link for group chat` | Tests generating an invite link for inviting other users |
| `should bind knowledge base to group chat` | Tests binding a knowledge base to the group chat |
| `should leave group chat` | Tests leaving a group chat (non-owner member) |

**Setup Requirements:**
- User must be logged in
- Requires at least one chat-type team/agent to be available
- Requires at least one model to be available
- For knowledge base binding test, requires at least one knowledge base

---

## Test Statistics

| Test Suite | Test Count |
|------------|------------|
| Chat Flow | 2 |
| Code Flow | 2 |
| Knowledge Flow | 5 |
| Chat Group Flow | 6 |
| **Total** | **15** |

---

## Common Setup Functions

### Chat Page Setup (`setupChatPage`)
- Navigates to `/chat`
- Skips onboarding tour via localStorage
- Selects wegent-chat agent from QuickAccessCards
- Selects 公网:GLM-5 model

### Code Page Setup (`setupCodePage`)
- Navigates to `/code`
- Skips onboarding tour via localStorage
- Selects dev-team agent
- Selects wecode-ai/Wegent repository
- Selects main branch

### Knowledge Page Setup (`setupKnowledgePage`)
- Navigates to `/knowledge`
- Handles login if needed (admin/Wegent2025!)
- Skips onboarding tour via localStorage
- Removes driver.js overlays

### Chat Group Page Setup (`setupChatGroupPage`)
- Navigates to `/chat`
- Handles login if needed (admin/Wegent2025!)
- Skips onboarding tour via localStorage
- Removes driver.js overlays
