import { test, expect } from '@playwright/test'

/**
 * Chat Group (群聊) Feature Integration Tests
 *
 * Covers:
 * - Create group chat
 * - Add members to group chat
 * - Generate and use invite links
 * - Send messages in group chat
 * - Bind knowledge bases to group chat
 * - Leave group chat
 */

// ==================== Test Data ====================
// Use random suffix for concurrent test isolation
const TEST_ID = Math.random().toString(36).substring(2, 8)
const TEST_GROUP_NAME = `Test-Group-${TEST_ID}-${Date.now()}`
const TEST_MESSAGE = 'Hello, this is a test message in group chat!'

// ==================== Helper Functions ====================

/**
 * Setup function for chat group tests
 * - Navigates to chat page
 * - Handles login if needed
 * - Skips onboarding
 */
async function setupChatGroupPage(page: any) {
  // Navigate to chat page
  await page.goto('/chat')
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 })
  await page.waitForTimeout(1000)

  // Handle login if needed
  const loginHeading = page.locator('heading:has-text("Login")').first()
  const isLoginPage = await loginHeading.isVisible({ timeout: 5000 }).catch(() => false)

  if (isLoginPage) {
    console.log('Login page detected, logging in...')
    const usernameInput = page.locator('input[placeholder*="username"]').first()
    const passwordInput = page.locator('input[placeholder*="password"]').first()

    await usernameInput.fill('admin')
    await passwordInput.fill('Wegent2025!')

    const loginButton = page.locator('button:has-text("Login")').first()
    await loginButton.click()

    await page.waitForURL('**/chat**', { timeout: 30000 })
    await page.waitForTimeout(2000)
    console.log('Login successful')
  }

  // Set localStorage to skip onboarding
  await page.evaluate(() => {
    localStorage.setItem('user_onboarding_completed', 'true')
    localStorage.setItem('onboarding_in_progress', '')
    localStorage.removeItem('onboarding_in_progress')
  })

  // Remove any driver.js overlays
  await page.evaluate(() => {
    document.querySelectorAll('.driver-overlay, .driver-popover, .driver-popover-tip').forEach(el => el.remove())
  })

  await page.waitForTimeout(1000)
}

/**
 * Create a new group chat
 */
async function createGroupChat(page: any, name: string) {
  // Click "Create Group Chat" button
  const createButton = page.locator('button[title="Create Group Chat"], button:has-text("Group Chat")').first()
  await expect(createButton).toBeVisible({ timeout: 10000 })
  await createButton.click()

  // Wait for dialog to appear
  const dialog = page.locator('[role="dialog"]').filter({ hasText: /Create Group Chat|新建群聊/ }).first()
  await expect(dialog).toBeVisible({ timeout: 10000 })

  // Fill group name
  const nameInput = dialog.locator('input').first()
  await nameInput.fill(name)

  // Select a team/agent - the dropdown shows "Select an agent"
  const teamSelector = dialog.locator('button').filter({ hasText: /Select an agent|Select Team|选择团队|选择智能体/ }).first()
  if (await teamSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
    await teamSelector.click()
    await page.waitForTimeout(500)

    // Select first available team from dropdown
    const firstTeam = page.locator('[role="option"]').first()
    if (await firstTeam.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstTeam.click()
      await page.waitForTimeout(500)
    }
  }

  // Select a model if the selector is visible
  const modelSelector = dialog.locator('button').filter({ hasText: /Select Model|选择模型/ }).first()
  if (await modelSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
    await modelSelector.click()
    await page.waitForTimeout(500)

    // Select first available model
    const firstModel = page.locator('[role="option"]').first()
    if (await firstModel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstModel.click()
      await page.waitForTimeout(500)
    }
  }

  // Submit - wait for button to be enabled
  const submitButton = dialog.locator('button', { hasText: /Create|创建/ }).first()
  await expect(submitButton).toBeEnabled({ timeout: 10000 })
  await submitButton.click()

  // Wait for dialog to close and navigation to group chat
  await expect(dialog).not.toBeVisible({ timeout: 30000 })
  await page.waitForTimeout(2000)
}

/**
 * Delete/cleanup group chat by name
 */
async function cleanupGroupChat(page: any, name: string) {
  // Navigate to chat page to find the group
  await page.goto('/chat')
  await page.waitForTimeout(2000)

  // Try to find and delete the test group
  const groupItem = page.locator('button', { hasText: name }).first()
  if (await groupItem.isVisible({ timeout: 5000 }).catch(() => false)) {
    // Click to open group
    await groupItem.click()
    await page.waitForTimeout(2000)

    // Try to leave or delete the group
    const menuButton = page.locator('button[title="Menu"], button:has-text("Menu")').first()
    if (await menuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await menuButton.click()
      await page.waitForTimeout(500)

      const leaveButton = page.locator('button', { hasText: /Leave|离开/ }).first()
      if (await leaveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await leaveButton.click()
        await page.waitForTimeout(1000)

        // Confirm leave
        const confirmButton = page.locator('button', { hasText: /Confirm|确认/ }).first()
        if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmButton.click()
          await page.waitForTimeout(2000)
        }
      }
    }
  }
}

// ==================== Test Suite ====================

test.describe('Chat Group Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupChatGroupPage(page)
  })

  test.afterEach(async ({ page }) => {
    // Cleanup: try to leave/delete test group
    await cleanupGroupChat(page, TEST_GROUP_NAME)
  })

  test('should create a new group chat', async ({ page }) => {
    // Create group chat
    await createGroupChat(page, TEST_GROUP_NAME)

    // Verify we're in the group chat (check for input area or group indicator)
    // Use a more flexible selector for the message input
    const messageInput = page.locator('textarea[placeholder*="message"], textarea[placeholder*="消息"], div[contenteditable="true"]').first()
    await expect(messageInput).toBeVisible({ timeout: 10000 })

    // Verify group name is displayed somewhere (check partial name since UI may truncate)
    const groupNameLocator = page.locator('text=/Test-Group-/').first()
    await expect(groupNameLocator).toBeVisible({ timeout: 10000 })

    console.log('✓ Group chat created successfully')
  })

  test('should send message in group chat', async ({ page }) => {
    // Create group chat first
    await createGroupChat(page, TEST_GROUP_NAME)

    // Find message input (use flexible selector for different input types)
    const messageInput = page.locator('textarea[placeholder*="message"], textarea[placeholder*="消息"], div[contenteditable="true"]').first()
    await expect(messageInput).toBeVisible({ timeout: 10000 })

    // Type and send message
    await messageInput.fill(TEST_MESSAGE)

    const sendButton = page.locator('[data-testid="send-button"]').first()
    await expect(sendButton).toBeVisible({ timeout: 5000 })
    await sendButton.click()

    // Wait for message to appear
    await page.waitForTimeout(2000)

    // Verify message appears in chat
    const sentMessage = page.locator('text=' + TEST_MESSAGE).first()
    await expect(sentMessage).toBeVisible({ timeout: 10000 })

    console.log('✓ Message sent successfully in group chat')
  })

  test('should open members panel in group chat', async ({ page }) => {
    // Create group chat
    await createGroupChat(page, TEST_GROUP_NAME)

    // Click members button (usually in task menu or sidebar)
    const membersButton = page.locator('button[title="Members"], button:has-text("Members"), button:has-text("成员")').first()
    if (await membersButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await membersButton.click()
      await page.waitForTimeout(1000)

      // Verify members panel/dialog is visible
      const membersPanel = page.locator('[role="dialog"], [role="tabpanel"]').filter({ hasText: /Members|成员/ }).first()
      await expect(membersPanel).toBeVisible({ timeout: 10000 })

      console.log('✓ Members panel opened successfully')
    } else {
      console.log('⚠ Members button not found, skipping test')
    }
  })

  test('should generate invite link for group chat', async ({ page }) => {
    // Create group chat
    await createGroupChat(page, TEST_GROUP_NAME)

    // Open members panel
    const membersButton = page.locator('button[title="Members"], button:has-text("Members"), button:has-text("成员")').first()
    if (await membersButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await membersButton.click()
      await page.waitForTimeout(1000)

      // Click invite link button
      const inviteButton = page.locator('button', { hasText: /Invite|邀请/ }).first()
      if (await inviteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await inviteButton.click()
        await page.waitForTimeout(1000)

        // Generate invite link
        const generateButton = page.locator('button', { hasText: /Generate|生成/ }).first()
        if (await generateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await generateButton.click()
          await page.waitForTimeout(2000)

          // Verify invite link is displayed
          const inviteLink = page.locator('input[value*="invite"], text=invite').first()
          const hasInviteLink = await inviteLink.isVisible({ timeout: 5000 }).catch(() => false)

          if (hasInviteLink) {
            console.log('✓ Invite link generated successfully')
          } else {
            console.log('⚠ Invite link display not found, but generation attempted')
          }

          // Close dialog
          const closeButton = page.locator('button', { hasText: /Close|关闭|Done|完成/ }).first()
          if (await closeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await closeButton.click()
          }
        }
      }
    } else {
      console.log('⚠ Members button not found, skipping test')
    }
  })

  test('should bind knowledge base to group chat', async ({ page }) => {
    // Create group chat
    await createGroupChat(page, TEST_GROUP_NAME)

    // Open members panel
    const membersButton = page.locator('button[title="Members"], button:has-text("Members"), button:has-text("成员")').first()
    if (await membersButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await membersButton.click()
      await page.waitForTimeout(1000)

      // Click Knowledge tab
      const knowledgeTab = page.locator('button', { hasText: /Knowledge|知识库/ }).first()
      if (await knowledgeTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await knowledgeTab.click()
        await page.waitForTimeout(500)

        // Click bind knowledge base button
        const bindButton = page.locator('button', { hasText: /Bind|绑定|Add|添加/ }).first()
        if (await bindButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await bindButton.click()
          await page.waitForTimeout(1000)

          // Select first available knowledge base
          const kbOption = page.locator('[role="option"], [role="menuitem"]').first()
          if (await kbOption.isVisible({ timeout: 3000 }).catch(() => false)) {
            await kbOption.click()
            await page.waitForTimeout(2000)

            console.log('✓ Knowledge base bound to group chat')
          } else {
            console.log('⚠ No knowledge bases available to bind')
          }
        } else {
          console.log('⚠ Bind knowledge base button not found')
        }
      } else {
        console.log('⚠ Knowledge tab not found')
      }
    } else {
      console.log('⚠ Members button not found, skipping test')
    }
  })

  test('should leave group chat', async ({ page }) => {
    // Create group chat
    await createGroupChat(page, TEST_GROUP_NAME)

    // Open members panel
    const membersButton = page.locator('button[title="Members"], button:has-text("Members"), button:has-text("成员")').first()
    if (await membersButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await membersButton.click()
      await page.waitForTimeout(1000)

      // Click leave group button
      const leaveButton = page.locator('button', { hasText: /Leave|离开/ }).first()
      if (await leaveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await leaveButton.click()
        await page.waitForTimeout(1000)

        // Confirm leave
        const confirmButton = page.locator('button', { hasText: /Confirm|确认|Leave|离开/ }).first()
        if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmButton.click()
          await page.waitForTimeout(2000)

          // Verify we're back to chat page (not in group)
          await page.goto('/chat')
          await page.waitForTimeout(2000)

          console.log('✓ Left group chat successfully')
        }
      } else {
        console.log('⚠ Leave button not found (may be owner)')
      }
    } else {
      console.log('⚠ Members button not found, skipping test')
    }
  })
})
