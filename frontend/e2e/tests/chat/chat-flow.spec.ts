/**
 * Chat Flow E2E Tests
 *
 * Tests for basic chat message flow using mock API responses.
 * This test uses Mock mode to intercept API requests and return simulated responses,
 * so it does not require a real backend.
 */

import { test, expect } from '../../fixtures/test-fixtures'
import { ChatTaskPage } from '../../pages'
import { mockTaskExecution } from '../../utils/api-mock'

test.describe('Chat Flow', () => {
  let chatPage: ChatTaskPage

  test.beforeEach(async ({ page }) => {
    // Setup API mocks for task execution
    await mockTaskExecution(page)
    // Initialize page object
    chatPage = new ChatTaskPage(page)
  })

  test('should send message and receive AI response', async () => {
    // Navigate to chat page
    await chatPage.navigate()

    // Type a test message
    await chatPage.typeMessage('Hello, this is a test message')

    // Send the message
    await chatPage.sendMessage()

    // Wait for AI response
    await chatPage.waitForResponse()

    // Get all messages
    const messages = await chatPage.getMessages()

    // Assert: messages.length >= 2 (user message + AI response)
    expect(messages.length).toBeGreaterThanOrEqual(2)
  })
})
