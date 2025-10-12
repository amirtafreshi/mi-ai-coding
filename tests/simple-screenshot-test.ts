import { chromium } from 'playwright'

async function takeScreenshot() {
  const browser = await chromium.launch({
    headless: false,
    env: { DISPLAY: ':99' }
  })

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

  console.log('Navigating to login...')
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)

  console.log('Taking screenshot...')
  await page.screenshot({
    path: '/home/master/projects/mi-ai-coding/test-results/login-page-html.png',
    fullPage: true
  })

  console.log('Getting page HTML...')
  const html = await page.content()
  console.log('\n=== LOGIN PAGE HTML ===\n')
  console.log(html.substring(0, 3000))

  console.log('\n\n=== INPUT FIELDS FOUND ===')
  const inputs = await page.locator('input').all()
  for (const input of inputs) {
    const id = await input.getAttribute('id')
    const name = await input.getAttribute('name')
    const placeholder = await input.getAttribute('placeholder')
    const type = await input.getAttribute('type')
    console.log(`Input: id="${id}", name="${name}", type="${type}", placeholder="${placeholder}"`)
  }

  await page.waitForTimeout(5000)
  await browser.close()
}

takeScreenshot().catch(console.error)
