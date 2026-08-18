import asyncio
import json
import os
import re
from playwright.async_api import async_playwright

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'looker_data')
os.makedirs(OUTPUT_DIR, exist_ok=True)

REPORT_URL = 'https://lookerstudio.google.com/reporting/971c78a4-52b2-4af7-b8f4-5cf40c8f91b6/page/p_kocu3w3e6d'

api_payloads = []

async def intercept_response(response):
    try:
        url = response.url
        if 'dataservice' in url or 'runReport' in url or 'runDataQuery' in url or 'getReport' in url:
            if response.status == 200:
                ct = response.headers.get('content-type', '')
                if 'json' in ct or 'text' in ct:
                    text = await response.text()
                    try:
                        # Clean XSSI prefix like )]}'
                        cleaned = re.sub(r"^\)\]\}'[^\n]*\n", "", text)
                        data = json.loads(cleaned)
                        api_payloads.append({'url': url, 'data': data})
                        print(f"Captured API response from {url[:80]} (keys: {list(data.keys()) if isinstance(data, dict) else len(data)})")
                    except Exception as e:
                        pass
    except Exception:
        pass

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='chrome', headless=True)
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()
        page.on('response', intercept_response)

        print(f"Opening {REPORT_URL}...")
        await page.goto(REPORT_URL, wait_until='networkidle', timeout=60000)
        await asyncio.sleep(5)

        # Get all page navigation links in the sidebar or top navigation
        # Look for sidebar items or page navigation buttons
        pages_info = []
        
        # Let's inspect page elements
        title = await page.title()
        print(f"Page title: {title}")

        # Find all navigation items in sidebar
        nav_elements = await page.query_selector_all('nav, .navigation, div[role="navigation"], .lego-navigation-list, [data-ng-repeat*="page"]')
        print(f"Nav elements found: {len(nav_elements)}")

        # Let's also extract text and elements from current page
        content_text = await page.inner_text('body')
        with open(os.path.join(OUTPUT_DIR, 'page_1_Apresentacao.txt'), 'w', encoding='utf-8') as f:
            f.write(content_text)
        print("Saved Apresentacao text.")

        # Let's find all clickable page items in sidebar
        # In Looker Studio, pages are often in a left navigation drawer
        nav_links = await page.query_selector_all('.nav-page, .lego-report-page-name, md-list-item, div.pageName')
        if not nav_links:
            # Look for elements with text matching page names
            nav_links = await page.query_selector_all('div[role="button"], a[role="button"], md-item-content')

        print(f"Candidate nav links: {len(nav_links)}")
        
        # Let's extract all visible text nodes in the navigation area
        sidebar_text = await page.evaluate('''() => {
            const items = [];
            document.querySelectorAll('*').forEach(el => {
                if (el.children.length === 0 && el.innerText && el.innerText.trim().length > 0) {
                    const rect = el.getBoundingClientRect();
                    if (rect.left < 300 && rect.top > 50 && rect.top < 600) {
                        items.push({text: el.innerText.trim(), x: rect.x, y: rect.y});
                    }
                }
            });
            return items;
        }''')
        print(f"Sidebar items found: {sidebar_text}")

        # Let's click each distinct page in the sidebar
        # Common pages in RO DataStudio: Apresentação, Almas / Mapas / Cartas, Monstros, Drops, Itens, etc.
        page_names = []
        for item in sidebar_text:
            txt = item['text']
            if txt not in page_names and len(txt) > 2 and not txt.isdigit() and 'Aureum' not in txt:
                page_names.append(txt)

        print(f"Identified pages: {page_names}")

        # Navigate through each page
        for p_name in page_names:
            print(f"\n--- Navigating to {p_name} ---")
            try:
                # Find element by text
                elem = page.locator(f"text={p_name}").first
                if await elem.is_visible():
                    await elem.click()
                    await asyncio.sleep(6) # Wait for network and rendering
                    
                    # Extract page text
                    p_text = await page.inner_text('body')
                    safe_pname = re.sub(r'[^\w\-_\. ]', '_', p_name)
                    with open(os.path.join(OUTPUT_DIR, f'page_{safe_pname}.txt'), 'w', encoding='utf-8') as f:
                        f.write(p_text)
                    print(f"Saved text for {p_name} ({len(p_text)} chars)")
                    
                    # Extract tables/data from DOM
                    tables_data = await page.evaluate('''() => {
                        const results = [];
                        document.querySelectorAll('table, .table, [role="table"], [role="grid"]').forEach(t => {
                            const rows = [];
                            t.querySelectorAll('tr, [role="row"]').forEach(r => {
                                const cells = [];
                                r.querySelectorAll('th, td, [role="columnheader"], [role="gridcell"]').forEach(c => {
                                    cells.push(c.innerText.trim());
                                });
                                if (cells.length > 0) rows.push(cells);
                            });
                            if (rows.length > 0) results.push(rows);
                        });
                        return results;
                    }''')
                    
                    if tables_data:
                        with open(os.path.join(OUTPUT_DIR, f'tables_{safe_pname}.json'), 'w', encoding='utf-8') as f:
                            json.dump(tables_data, f, ensure_ascii=False, indent=2)
                        print(f"Saved {len(tables_data)} tables for {p_name}")
            except Exception as e:
                print(f"Error navigating to {p_name}: {e}")

        # Save all captured API payloads
        with open(os.path.join(OUTPUT_DIR, 'api_payloads.json'), 'w', encoding='utf-8') as f:
            json.dump(api_payloads, f, ensure_ascii=False, indent=2)
        print(f"\nTotal API payloads saved: {len(api_payloads)}")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
