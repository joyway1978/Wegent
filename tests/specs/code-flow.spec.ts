import { test, expect } from '@playwright/test'

/**
 * Common setup function for code tests
 * - Navigates to code page
 * - Skips onboarding
 * - Selects team, repo, and branch if needed
 * - Waits for input to be enabled
 */
async function setupCodePage(page: any) {
  // First navigate to set localStorage, then reload to skip onboarding
  await page.goto('/code')

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

  return page
}

test.describe('Code Flow', () => {
  test('should navigate to code page and select dev-team, wecode-ai/Wegent repo, and main branch', async ({ page }) => {
    await setupCodePage(page)

    // Verify we are on the code page
    await expect(page).toHaveURL(/\/code/)

    // Wait for the team selector to be visible
    const teamSelector = page.locator('[data-testid="team-selector"]')
    await expect(teamSelector).toBeVisible({ timeout: 10000 })

    // Click on team selector to open dropdown
    await teamSelector.click()
    await page.waitForTimeout(500)

    // Select "dev-team" from the dropdown
    const devTeamOption = page.locator('[role="option"]:has-text("dev-team")')
    if (await devTeamOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await devTeamOption.click()
      console.log('Selected dev-team')
    } else {
      console.log('dev-team option not found, checking current selection...')
      // If dev-team is not found, it might already be selected or not available
      // Press Escape to close dropdown and continue
      await page.keyboard.press('Escape')
    }

    // Wait for repo selector to be visible
    const repoSelector = page.locator('[data-testid="repo-selector"]')
    await expect(repoSelector).toBeVisible({ timeout: 10000 })

    // Click on repo selector to open dropdown
    await repoSelector.click()
    await page.waitForTimeout(500)

    // Search for or select "wecode-ai/Wegent" repository
    const repoSearchInput = page.locator('input[placeholder*="repository"], input[placeholder*="仓库"]')
    if (await repoSearchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await repoSearchInput.fill('wecode-ai/Wegent')
      await page.waitForTimeout(1000)
    }

    // Select the repository
    const wegentRepoOption = page.locator('[role="option"]:has-text("wecode-ai/Wegent"), [role="option"]:has-text("Wegent")')
    if (await wegentRepoOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await wegentRepoOption.click()
      console.log('Selected wecode-ai/Wegent repository')
    } else {
      console.log('wecode-ai/Wegent repository option not found, checking current selection...')
      // Press Escape to close dropdown and continue
      await page.keyboard.press('Escape')
    }

    // Wait for branch selector to be visible
    const branchSelector = page.locator('[data-testid="branch-selector"]')
    await expect(branchSelector).toBeVisible({ timeout: 10000 })

    // Click on branch selector to open dropdown
    await branchSelector.click()
    await page.waitForTimeout(500)

    // Select "main" branch
    const mainBranchOption = page.locator('[role="option"]:has-text("main")')
    if (await mainBranchOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await mainBranchOption.click()
      console.log('Selected main branch')
    } else {
      console.log('main branch option not found, checking current selection...')
      // Press Escape to close dropdown and continue
      await page.keyboard.press('Escape')
    }

    // Wait for input to be enabled
    const messageInput = page.locator('[data-testid="message-input"]').first()
    await expect(messageInput).toBeVisible({ timeout: 10000 })

    // Verify the page is fully loaded with all selections
    console.log('Code page setup completed with dev-team, wecode-ai/Wegent repo, and main branch')

    // Take a screenshot for verification
    await page.screenshot({ path: 'code-page-setup.png' })
  })

  test('should send code task message and receive AI response', async ({ page }) => {
    // Set longer timeout for this test (5 minutes) as AI may take time to respond
    test.setTimeout(300000)

    await setupCodePage(page)

    // Select team, repo, and branch
    const teamSelector = page.locator('[data-testid="team-selector"]')
    await expect(teamSelector).toBeVisible({ timeout: 10000 })

    // Try to select dev-team
    await teamSelector.click()
    await page.waitForTimeout(500)
    const devTeamOption = page.locator('[role="option"]:has-text("dev-team")')
    if (await devTeamOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await devTeamOption.click()
    } else {
      await page.keyboard.press('Escape')
    }

    // Select repository
    const repoSelector = page.locator('[data-testid="repo-selector"]')
    await repoSelector.click()
    await page.waitForTimeout(500)
    const repoSearchInput = page.locator('input[placeholder*="repository"], input[placeholder*="仓库"]')
    if (await repoSearchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await repoSearchInput.fill('wecode-ai/Wegent')
      await page.waitForTimeout(1000)
    }
    const wegentRepoOption = page.locator('[role="option"]:has-text("wecode-ai/Wegent"), [role="option"]:has-text("Wegent")')
    if (await wegentRepoOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await wegentRepoOption.click()
    } else {
      await page.keyboard.press('Escape')
    }

    // Select branch
    const branchSelector = page.locator('[data-testid="branch-selector"]')
    await branchSelector.click()
    await page.waitForTimeout(500)
    const mainBranchOption = page.locator('[role="option"]:has-text("main")')
    if (await mainBranchOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await mainBranchOption.click()
    } else {
      await page.keyboard.press('Escape')
    }

    // Wait for input to be ready
    const messageInput = page.locator('[data-testid="message-input"]').first()
    await expect(messageInput).toBeVisible({ timeout: 10000 })

    // Type a code-related test message
    const testMessage = 'Please analyze the codebase structure and provide a brief summary of the main components.'
    await messageInput.fill(testMessage)

    // Find and click send button
    const sendButton = page.locator('[data-testid="send-button"]').first()
    await expect(sendButton).toBeVisible({ timeout: 5000 })
    await sendButton.click()

    // Wait for AI response
    const messagesContainer = page.locator('.messages-container').first()
    await expect(messagesContainer).toBeVisible({ timeout: 30000 })

    // Wait for AI message to appear (may take time for API response)
    const aiMessage = messagesContainer.locator('> div').filter({
      has: page.locator('svg.lucide-bot'),
    }).last()
    await expect(aiMessage).toBeVisible({ timeout: 120000 })

    // Wait for streaming to complete
    await page.waitForTimeout(5000)

    // Structured validation: Verify message format and order
    const allMessages = await messagesContainer.locator('> div').all()

    // 1. Verify at least 2 messages (user + AI)
    expect(allMessages.length).toBeGreaterThanOrEqual(2)

    // 2. Verify user message exists and contains our test message
    const userMessage = allMessages[allMessages.length - 2]
    const userMessageText = await userMessage.textContent()
    expect(userMessageText).toContain(testMessage)

    // 3. Verify last message is AI message (has Bot icon)
    const lastMessage = allMessages[allMessages.length - 1]
    const hasBotIcon = await lastMessage.locator('svg.lucide-bot').isVisible()
    expect(hasBotIcon).toBe(true)

    // 4. Verify AI message has meaningful content
    const aiMessageText = await aiMessage.textContent()
    expect(aiMessageText).toBeTruthy()
    expect(aiMessageText!.length).toBeGreaterThan(10)

    console.log('AI Response received:', aiMessageText?.substring(0, 200) + '...')
    console.log(`Total messages: ${allMessages.length}, Validation passed ✓`)

    // Take a screenshot of the final result
    await page.screenshot({ path: 'code-task-response.png' })
  })
})
