/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import puppeteer, { Page } from 'puppeteer';

/**
 * Waits for the DOM to settle by using a MutationObserver.
 * @param page The Puppeteer page instance.
 * @param timeout The maximum amount of time to wait (in milliseconds).
 * @returns A promise that resolves when the DOM has settled.
 */
async function waitForDomToSettle(page: Page, timeout: number = 5000): Promise<void> {
  await page.evaluate((timeout) => {
    return new Promise<void>((resolve) => {
      let timer: NodeJS.Timeout | null = null;

      const observer = new MutationObserver(() => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          observer.disconnect();
          resolve();
        }, 100); // The DOM is considered settled if no changes occur for 100ms
      });

      observer.observe(document, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, timeout);
    });
  }, timeout);
}

export const fetchDocument = async (url: string): Promise<string> => {
  // Launch a new browser instance
  const browser = await puppeteer.launch();

  try {
    // Open a new page
    const page: Page = await browser.newPage();

    // Set the user agent to mimic an actual Chrome browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.199 Safari/537.36');

    // Navigate to the provided URL
    await page.goto(url, { waitUntil: 'networkidle0' });
    await waitForDomToSettle(page);

    // Get the page content (HTML)
    return await page.evaluate(() => document.documentElement.outerHTML);
  } catch (error) {
    console.error('Error loading document:', error);
    throw error;
  } finally {
    // Close the browser
    await browser.close();
  }
};
