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
import {minify} from 'html-minifier';
import {JSDOM} from 'jsdom';
import {importEvents} from '../events.js';
import {DocumentUtils} from '../utils/documentUtils.js';
import {IGNORE_ELEMENTS} from '../constants/index.js';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.199 Safari/537.36';

export type DocumentEntry = {url: string, content: string};
export type DocumentManifest = Set<DocumentEntry>;

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

async function fetchUrlContent(url: string) : Promise<string> {
  // Launch a new browser instance
  const browser = await puppeteer.launch();

  try {
    // Open a new page
    const page: Page = await browser.newPage();

    // Set the user agent to mimic an actual Chrome browser
    await page.setUserAgent(USER_AGENT);

    // Navigate to the provided URL
    await page.goto(url, { waitUntil: 'networkidle0' });

    importEvents.emit('progress', `Waiting for ${url} to settle...`);
    await waitForDomToSettle(page);

    //get the title of the page
    const title = await page.evaluate(() => document.title);

    // Get the page content (HTML)
    const documentContent = await page.evaluate(() => document.documentElement.outerHTML);

    // take a screenshot
    await page.screenshot({ path: './pageScreenshot.png', fullPage: true, type: 'png' });

    importEvents.emit('progress', `Loaded: ${title} (${documentContent.length} bytes)`);

    return documentContent;
  } catch (error) {
    console.error('Error loading document:', error);
    throw error;
  } finally {
    // Close the browser
    await browser.close();
  }
}

type DocumentOptions = {
  documents?: DocumentManifest
}

export const fetchDocument = async (url: string, options: DocumentOptions = {}): Promise<Document> => {
  importEvents.emit('start', `Fetching document from ${url}`);

  try {
    const { documents = new Set() } = options;
    let {content: documentContent} = Array.from(documents).find((entry) => entry.url === url) || {};
    if (!documentContent) {
      documentContent = await fetchUrlContent(url);
    } else {
      importEvents.emit('progress', `Loaded ${url} from document cache`);
    }

    const minifiedContent = minify(documentContent, {
      collapseWhitespace: true,
      removeComments: true,
      continueOnParseError: true,
      removeEmptyAttributes: true,
      removeEmptyElements: true,
      removeRedundantAttributes: true,
      removeOptionalTags: true,
    });

    const dom = new JSDOM(minifiedContent);
    const document = dom.window.document;

    // pre-process document
    DocumentUtils(document)
      .removeAttributes()
      .removeElements(IGNORE_ELEMENTS)
      .removeEmptyElements();

    // write the document back to the manifest
    documents.forEach((entry) => {
      if (entry.url === url) {
        documents.delete(entry);
      }
    });
    documents.add({url, content: document.documentElement.outerHTML});

    importEvents.emit('complete');
    return document;

  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
};
