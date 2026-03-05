import { test, expect } from '@playwright/test'

test.describe('Chat Flow', () => {
  test('should send message and receive AI response', async ({ page }) => {
    // First navigate to set localStorage, then reload to skip onboarding
    await page.goto('/chat')

    // Set localStorage to mark onboarding as completed
    await page.evaluate(() => {
      localStorage.setItem('user_onboarding_completed', 'true')
      localStorage.setItem('onboarding_in_progress', '')
      localStorage.removeItem('onboarding_in_progress')
    })

    // Reload page - now onboarding should be skipped
    await page.reload()

    // Wait for page to load - sidebar should be visible
    await page.waitForSelector('[data-tour="task-sidebar"]', {
      state: 'visible',
      timeout: 30000,
    })

    // Double check and force remove any driver.js overlay
    await page.evaluate(() => {
      document.querySelectorAll('.driver-overlay, .driver-popover, .driver-popover-tip').forEach(el => el.remove())
    })

    // Wait for any animations to complete
    await page.waitForTimeout(500)

    // Select "wegent-chat" agent from QuickAccessCards if available
    // The input will be disabled until a team is selected
    const quickAccessCards = page.locator('[data-tour="quick-access-cards"]')
    if (await quickAccessCards.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Look for wegent-chat card specifically
      const wegentChatCard = quickAccessCards.locator('div.rounded-full.border:has-text("wegent-chat")').first()
      if (await wegentChatCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await wegentChatCard.click()
        // Wait for team selection to complete
        await page.waitForTimeout(1000)
      } else {
        // Fallback: click the first available team card
        const firstCard = quickAccessCards.locator('div.rounded-full.border').first()
        if (await firstCard.isVisible({ timeout: 2000 }).catch(() => false)) {
          await firstCard.click()
          await page.waitForTimeout(1000)
        }
      }
    }

    // Find chat input area - it's a contentEditable div with data-testid="message-input"
    const chatInput = page.locator('[data-testid="message-input"]').first()

    // Wait for input to be enabled (contenteditable="true")
    await expect(chatInput).toHaveAttribute('contenteditable', 'true', { timeout: 10000 })

    // Type test message
    const testMessage = 'Hello, this is a test message. Please respond with a short greeting.'
    await chatInput.fill(testMessage)

    // Find and click send button
    // Send button typically has an icon or text, look for common patterns
    const sendButton = page.locator(
      'button[type="submit"], button:has(svg[class*="send" i]), [data-testid="send-button"]'
    ).first()

    await sendButton.click()

    // Wait for AI response
    // AI messages appear in .messages-container
    const messagesContainer = page.locator('.messages-container').first()
    await expect(messagesContainer).toBeVisible({ timeout: 30000 })

    // Wait for AI response - look for Bot icon in the messages
    // AI messages have lucide-bot SVG icon
    const aiMessage = messagesContainer.locator('> div').filter({
      has: page.locator('svg.lucide-bot'),
    }).last()

    // Wait for AI message to appear (may take time for API response)
    await expect(aiMessage).toBeVisible({ timeout: 90000 })

    // Verify AI message has some content (not empty)
    // Wait for the streaming to complete - check for actual text content
    // The content is inside the message bubble, look for paragraphs or text
    await page.waitForTimeout(5000) // Give some time for streaming

    const aiMessageText = await aiMessage.textContent()
    expect(aiMessageText).toBeTruthy()
    expect(aiMessageText!.length).toBeGreaterThan(10) // Should have meaningful content

    console.log('AI Response received:', aiMessageText?.substring(0, 200) + '...')
  })
})
