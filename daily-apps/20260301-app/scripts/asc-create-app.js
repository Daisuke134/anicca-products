// ASC App Creation via Playwright Browser Automation
// Following: ~/.claude/skills/asc-app-create-ui/SKILL.md
const { chromium } = require('/opt/homebrew/lib/node_modules/playwright');
const { execSync } = require('child_process');
const readline = require('readline');

const APP_NAME = 'AffirmFlow';
const BUNDLE_ID = 'com.anicca.affirmflow';
const SKU = 'affirmflow-001';
const APPLE_ID = 'keiodaisuke@gmail.com';
const APPLE_PASSWORD = 'Chatgpt12345';

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer); }));
}

(async () => {
  console.log('=== ASC App Creation: ' + APP_NAME + ' ===\n');

  // Step 1: Preflight - verify no existing app
  console.log('[1/9] Preflight: verifying no existing app...');
  try {
    const result = execSync(`source ~/.config/mobileapp-builder/.env && asc apps list --bundle-id "${BUNDLE_ID}" --output json 2>/dev/null`, { shell: '/bin/zsh' });
    const data = JSON.parse(result);
    if (data.data && data.data.length > 0) {
      console.log('App already exists! ID:', data.data[0].id);
      process.exit(0);
    }
    console.log('  No existing app found. Proceeding.\n');
  } catch (e) {
    console.log('  Could not check existing apps, proceeding anyway.\n');
  }

  // Step 2: Launch browser
  console.log('[2/9] Launching browser (headed)...');
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // Step 3: Navigate to ASC
    console.log('[3/9] Navigating to App Store Connect...');
    await page.goto('https://appstoreconnect.apple.com/apps', { timeout: 60000 });
    await page.waitForTimeout(3000);

    const url = page.url();
    console.log('  Current URL:', url);

    // Handle login — auth is inside an iframe from idmsa.apple.com
    {
      console.log('\n[LOGIN] Signing in (via iframe)...');

      // Find the Apple ID auth iframe
      const authFrame = page.frames().find(f => f.url().includes('idmsa.apple.com'));
      if (!authFrame) {
        throw new Error('Could not find Apple ID auth iframe');
      }
      console.log('  Found auth iframe:', authFrame.url().substring(0, 80));

      // Step A: Enter Apple ID
      const emailInput = authFrame.locator('#account_name_text_field');
      await emailInput.waitFor({ timeout: 15000 });
      await emailInput.click();
      await emailInput.fill(APPLE_ID);
      console.log('  Typed Apple ID:', APPLE_ID);
      await page.waitForTimeout(500);

      // Submit email — click sign-in or press Enter
      const signInBtn = authFrame.locator('#sign-in');
      await signInBtn.click();
      console.log('  Clicked sign-in (email step).');
      await page.waitForTimeout(4000);
      await page.screenshot({ path: 'scripts/asc-after-email.png' });

      // After email: Apple shows "パスワードで続行" (Continue with Password) button
      // Must click it to get to the password field
      const continueWithPw = authFrame.locator('button:has-text("パスワードで続行"), button:has-text("Continue with Password"), #continue-password');
      if (await continueWithPw.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await continueWithPw.first().click();
        console.log('  Clicked "Continue with Password".');
        await page.waitForTimeout(3000);
      }

      // Step B: Enter password
      console.log('  Entering password...');
      const pwInput = authFrame.locator('#password_text_field');
      await pwInput.waitFor({ timeout: 10000 });
      await pwInput.click();
      await pwInput.fill(APPLE_PASSWORD);
      console.log('  Typed password.');
      await page.waitForTimeout(500);

      // Click sign-in for password submission
      const signInBtn2 = authFrame.locator('#sign-in');
      await signInBtn2.click();
      console.log('  Clicked sign-in (password step).');
      await page.waitForTimeout(6000);
      await page.screenshot({ path: 'scripts/asc-after-password.png' });

      // Step C: Check for 2FA — may appear in iframe or as a new page
      const afterLoginUrl = page.url();
      console.log('  Post-login URL:', afterLoginUrl);

      // 2FA might be in the iframe or the page might have changed
      const authFrame2 = page.frames().find(f => f.url().includes('idmsa.apple.com')) || page.mainFrame();

      const has2FA =
        await authFrame2.locator('#char0').isVisible().catch(() => false) ||
        await authFrame2.locator('.verify-device').isVisible().catch(() => false) ||
        await authFrame2.locator('input.form-security-code-input').isVisible().catch(() => false) ||
        await page.getByText('確認コード').isVisible().catch(() => false) ||
        await page.getByText('verification code').isVisible().catch(() => false);

      if (has2FA) {
        console.log('\n  [2FA] Two-factor authentication required.');
        await page.screenshot({ path: 'scripts/asc-2fa.png' });

        try {
          execSync('openclaw system event --text "NEED_HUMAN_INPUT: Apple 2FA code needed for ASC login. Check your trusted device." --mode now 2>/dev/null', { shell: '/bin/zsh' });
        } catch (e) {}

        const code = await prompt('\nEnter the 6-digit 2FA code: ');
        const digits = code.trim();
        console.log('  Entering code:', digits);

        // Method 1: Individual char inputs in iframe (#char0..#char5)
        let entered = false;
        for (let i = 0; i < digits.length; i++) {
          const ci = authFrame2.locator(`#char${i}`);
          if (await ci.isVisible().catch(() => false)) {
            await ci.fill(digits[i]);
            entered = true;
          }
        }

        // Method 2: single code input in iframe
        if (!entered) {
          const codeInput = authFrame2.locator('input.form-security-code-input, input[type="tel"], input[type="number"]').first();
          if (await codeInput.isVisible().catch(() => false)) {
            await codeInput.fill(digits);
            entered = true;
          }
        }

        // Method 3: keyboard fallback
        if (!entered) {
          await page.keyboard.type(digits);
        }

        await page.waitForTimeout(3000);

        // Submit — the code may auto-submit, or we need to click
        const submitBtn = authFrame2.locator('button.si-button, button[type="submit"]').first();
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click();
        }

        // Wait for redirect to ASC
        console.log('  Waiting for redirect to ASC...');
        for (let i = 0; i < 60; i++) {
          await page.waitForTimeout(2000);
          const cur = page.url();
          if (cur.includes('appstoreconnect.apple.com') && !cur.includes('login') && !cur.includes('auth')) {
            console.log('  ✅ Logged in!');
            break;
          }
          // Trust browser prompt (may be in iframe)
          const af = page.frames().find(f => f.url().includes('idmsa.apple.com')) || page.mainFrame();
          const trustBtn = af.locator('button:has-text("Trust"), button:has-text("信頼")').first();
          if (await trustBtn.isVisible().catch(() => false)) {
            await trustBtn.click();
            console.log('  Clicked Trust.');
          }
          if (i % 10 === 0 && i > 0) console.log(`    Waiting... (${i*2}s)`);
        }
      }

      // If we didn't need 2FA, we might already be on the apps page
      await page.waitForTimeout(3000);
    }

    // Wait for apps page
    console.log('\n[4/9] Waiting for apps page to load...');
    await page.waitForTimeout(5000);
    const appsUrl = page.url();
    console.log('  Current URL:', appsUrl);
    await page.screenshot({ path: 'scripts/asc-step4.png' });

    // Step 5: Click "New App" (dropdown menu)
    console.log('\n[5/9] Opening New App form...');

    // Look for the + / New App button - ASC uses various selectors
    const newAppBtnSelectors = [
      'button[aria-label="New App"]',
      'a[aria-label="New App"]',
      '[data-test-id="new-app-button"]',
      'button:has-text("New App")',
      '.toolbar-button:has-text("New")',
      'button[class*="create"]',
    ];

    let clickedNewApp = false;
    for (const sel of newAppBtnSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible().catch(() => false)) {
        await el.click();
        console.log('  Clicked New App button via:', sel);
        clickedNewApp = true;
        break;
      }
    }

    if (!clickedNewApp) {
      // Try finding by accessible snapshot
      console.log('  Button not found by known selectors. Scanning page...');
      await page.screenshot({ path: 'scripts/asc-step5-debug.png' });

      // Try clicking any element with "new" text
      const allBtns = await page.locator('button, a[role="button"], [role="menuitem"]').all();
      for (const btn of allBtns) {
        const text = (await btn.textContent().catch(() => '')) || '';
        const label = (await btn.getAttribute('aria-label').catch(() => '')) || '';
        if (text.toLowerCase().includes('new') || label.toLowerCase().includes('new')) {
          console.log(`  Found candidate: text="${text.trim()}" aria="${label}"`);
          await btn.click();
          clickedNewApp = true;
          break;
        }
      }
    }

    await page.waitForTimeout(2000);

    // Click the "New App" menu item in the dropdown
    const menuItem = page.locator('[role="menuitem"]:has-text("New App"), a:has-text("New App"), button:has-text("New App")').first();
    if (await menuItem.isVisible().catch(() => false)) {
      await menuItem.click();
      console.log('  Clicked "New App" menu item.');
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'scripts/asc-step5.png' });

    // Step 6: Fill the form
    console.log('\n[6/9] Filling form fields...');

    // Platform: iOS checkbox
    console.log('  [a] Platform: iOS...');
    const iosCheckbox = page.locator('label:has-text("iOS") input[type="checkbox"], input[type="checkbox"][value="iOS"]').first();
    if (await iosCheckbox.isVisible().catch(() => false)) {
      await iosCheckbox.check();
    } else {
      // Try clicking the label text
      const iosLabel = page.locator('label:has-text("iOS"), span:has-text("iOS")').first();
      if (await iosLabel.isVisible().catch(() => false)) {
        await iosLabel.click();
      }
    }
    await page.waitForTimeout(1000);

    // Name
    console.log('  [b] Name: ' + APP_NAME + '...');
    // ASC uses Ember.js, so look for inputs near the "Name" label
    const nameInput = page.getByLabel('Name').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.click();
      await nameInput.fill('');
      // Type slowly to trigger Ember validation
      await nameInput.type(APP_NAME, { delay: 50 });
    }
    await page.waitForTimeout(1000);

    // Primary Language
    console.log('  [c] Primary Language: English (U.S.)...');
    const langSelect = page.getByLabel('Primary Language').first();
    if (await langSelect.isVisible().catch(() => false)) {
      await langSelect.selectOption({ label: 'English (U.S.)' });
    }
    await page.waitForTimeout(2000);

    // Bundle ID (async loading)
    console.log('  [d] Bundle ID: ' + BUNDLE_ID + '...');
    // Wait for bundle ID dropdown to load
    await page.waitForTimeout(3000);
    const bundleSelect = page.getByLabel('Bundle ID').first();
    if (await bundleSelect.isVisible().catch(() => false)) {
      // Wait for Loading... to disappear
      for (let i = 0; i < 10; i++) {
        const options = await bundleSelect.locator('option').allTextContents();
        if (options.some(o => o.includes(BUNDLE_ID))) {
          break;
        }
        await page.waitForTimeout(1000);
        console.log('    Waiting for bundle IDs to load...');
      }
      // Select by text matching
      await bundleSelect.selectOption({ label: new RegExp(BUNDLE_ID.replace(/\./g, '\\.')) });
      console.log('    Bundle ID selected.');
    }
    await page.waitForTimeout(1000);

    // SKU
    console.log('  [e] SKU: ' + SKU + '...');
    const skuInput = page.getByLabel('SKU').first();
    if (await skuInput.isVisible().catch(() => false)) {
      await skuInput.click();
      await skuInput.fill('');
      await skuInput.type(SKU, { delay: 50 });
    }
    await page.waitForTimeout(1000);

    // User Access - Full Access (radio with span overlay workaround)
    console.log('  [f] User Access: Full Access...');
    const fullAccessRadio = page.locator('input[type="radio"][value*="full"], input[type="radio"]').last();
    if (await fullAccessRadio.isVisible().catch(() => false)) {
      await fullAccessRadio.evaluate(el => {
        el.scrollIntoView();
        el.click();
      });
    } else {
      // Try clicking label text
      const fullAccessLabel = page.locator('span:has-text("Full Access"), label:has-text("Full Access")').first();
      if (await fullAccessLabel.isVisible().catch(() => false)) {
        await fullAccessLabel.click();
      }
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'scripts/asc-step6.png' });

    // Step 7: Click Create
    console.log('\n[7/9] Clicking Create...');
    const createBtn = page.locator('button:has-text("Create")').first();
    if (await createBtn.isVisible().catch(() => false)) {
      const disabled = await createBtn.isDisabled();
      if (disabled) {
        console.log('  ⚠️ Create button is DISABLED. Form validation may have failed.');
        await page.screenshot({ path: 'scripts/asc-step7-disabled.png' });
        console.log('  Screenshot saved. Check for missing fields.');
      } else {
        await createBtn.click();
        console.log('  Create button clicked!');

        // Wait for navigation to new app page
        console.log('  Waiting for app creation...');
        await page.waitForTimeout(10000);
      }
    }

    // Step 8: Verify
    const finalUrl = page.url();
    console.log('\n[8/9] Final URL:', finalUrl);
    await page.screenshot({ path: 'scripts/asc-step8.png' });

    const appIdMatch = finalUrl.match(/\/apps\/(\d+)/);
    if (appIdMatch) {
      console.log('\n✅ SUCCESS! App created with ID:', appIdMatch[1]);
    } else {
      console.log('\n⚠️ Could not confirm app creation from URL.');
      console.log('  Check screenshots in scripts/ directory.');
    }

    // Keep browser open for manual verification
    console.log('\n[9/9] Keeping browser open for 60 seconds for verification...');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'scripts/asc-error.png' }).catch(() => {});
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }
})();
