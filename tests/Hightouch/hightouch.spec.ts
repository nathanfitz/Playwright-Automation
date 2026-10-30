import { test, expect } from '@playwright/test';

test.use({ storageState: 'auth.json' });

function logTime(message: string) {
  const timestamp = new Date().toLocaleTimeString('id-ID', {
    hour12: false,
    fractionalSecondDigits: 3,
  });

  console.log(`[${timestamp}] ${message}`);
}

// VALIDASI USER ID: HARUS MENGANDUNG HURUF
function validateUserId(userId: string) {
  const hasLetter = /[A-Za-z]/.test(userId);
  const isNumericOnly = /^[0-9]+$/.test(userId);

  const isValid = hasLetter && !isNumericOnly;

  return {
    isValid,
    hasLetter,
    isNumericOnly,
    reason: isValid
      ? 'UserId valid: contains alphabet'
      : 'UserId invalid: numeric only or does not contain alphabet',
  };
}

// 1. FUNCTION VALIDASI PAYLOAD UMUM
function validatePayload(message: any) {
  // 1. Validasi field utama
  expect(message.type).toBe('track');
  expect(message.messageId).toEqual(expect.any(String));
  expect(message.userId).toEqual(expect.any(String));
  expect(message.event).toEqual(expect.any(String));

  // 2. Validasi format timestamp
  for (const field of [
    'originalTimestamp',
    'sentAt',
    'receivedAt',
    'timestamp',
  ]) {
    expect(message[field]).toEqual(expect.any(String));
    expect(message[field]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(Date.parse(message[field])).not.toBeNaN();
  }

  // 3. Validasi context
  expect(message.context).toEqual(expect.any(Object));
  expect(message.context).not.toBeNull();
  expect(Array.isArray(message.context)).toBe(false);
  expect(message.context.ip).toEqual(expect.any(String));

  // 4. Validasi User ID
  return validateUserId(message.userId);
}

test.describe.parallel('All Groups', { tag: '@allGroup' }, () => {

  test.describe.parallel(
    'propensity_pl_retook Group',
    { tag: '@validGroup' },
    () => {

      // VALIDASI PROPERTIES KHUSUS EVENT propensity_pl_retook
      function validatePropensityPlRetookProperties(message: any) {
        const p = message.properties;

        // 1. Validasi struktur properties
        expect(p).toEqual(expect.any(Object));
        expect(p).not.toBeNull();
        expect(Array.isArray(p)).toBe(false);

        // 2. Validasi properties khusus event ini
        expect(p.bin_score).toEqual(expect.any(Number));
        expect(p.category).toEqual(expect.any(String));
        expect(p.model_version).toEqual(expect.any(String));
        expect(p.propensity_score).toEqual(expect.any(Number));
      }

      test('Verify propensity_pl_retook 88 Counter', async ({ page }) => {
        // 1. Open Hightouch
        await page.goto('https://app.hightouch.com/');

        // 2. Open workspace
        await page.getByText('Kredivo-Dev', { exact: true }).click();

        // 3. Open Event Collection
        await page.getByText('Event Collection', { exact: true }).click();

        // 4. Open Event sources
        await page.getByText('Event sources', { exact: true }).click();

        await expect(page).toHaveURL(
          'https://app.hightouch.com/fti-kredivo-dev/events/sources'
        );

        // 5. Select HTTP CRM API
        await page.getByText('HTTP CRM API (crm)', { exact: true }).click();

        // 6. Open Event catalog
        await page.getByText('Event catalog', { exact: true }).click();

        // 7. Select 3-day time range
        // await page.getByText('3d', { exact: true }).click();

        // 8. Find event propensity_pl_retook
        const eventName = page.getByText('propensity_pl_retook', {
          exact: true,
        });

        await expect(eventName).toBeVisible();

        // Find the row that contains the target event
        const eventRow = page.getByRole('row').filter({ has: eventName });

        // 9. Set the initial counter manually
        const counterBefore = 277;

        // Locator counter di dalam baris event
        const counter = eventRow.locator('span.chakra-text').filter({
          hasText: /^\d[\d,]*$/,
        }).last();

        // 10. Validate Hightouch percentage after 176 data are added
        const totalAdded = 176;
        const targetPercentage = 50;
        const deltaPercentage = 10;

        const expectedHT = totalAdded * targetPercentage / 100;

        const minAddedHT = Math.ceil(
          totalAdded * (targetPercentage - deltaPercentage) / 100
        );

        const maxAddedHT = Math.floor(
          totalAdded * (targetPercentage + deltaPercentage) / 100
        );

        const expectedCounter = counterBefore + expectedHT;
        const minCounter = counterBefore + minAddedHT;
        const maxCounter = counterBefore + maxAddedHT;

        console.log(`Total New Data: ${totalAdded}`);
        console.log(`Expected HT Addition: ${expectedHT}`);
        console.log(`Allowed HT Addition: ${minAddedHT}-${maxAddedHT}`);
        console.log(`Expected HT Counter: ${expectedCounter}`);
        console.log(`Allowed HT Counter: ${minCounter}-${maxCounter}`);

        // Wait until the counter falls within the allowed range
        await expect(async () => {
          const latestText = await counter.textContent();

          // Convert "3,200" to 3200
          const latestCounter = Number(
            latestText?.trim().replace(/,/g, '')
          );

          console.log(`Counter text: "${latestText}"`);
          console.log(`Counter parsed: ${latestCounter}`);

          expect(Number.isFinite(latestCounter)).toBeTruthy();
          expect(latestCounter).toBeGreaterThanOrEqual(minCounter);
          expect(latestCounter).toBeLessThanOrEqual(maxCounter);
        }).toPass({
          timeout: 30_000,
          intervals: [500, 1000, 2000],
        });

        // Read the final counter
        const counterAfterText = await counter.textContent();
        const counterAfter = Number(
          counterAfterText?.trim().replace(/,/g, '')
        );

        const actualHTAdded = counterAfter - counterBefore;
        const actualPercentage = (actualHTAdded / totalAdded) * 100;

        console.log(`HT Counter Before: ${counterBefore}`);
        console.log(`HT Counter After: ${counterAfter}`);
        console.log(`Actual HT Added: ${actualHTAdded}`);
        console.log(`Actual HT Percentage: ${actualPercentage.toFixed(2)}%`);
        console.log(`Expected HT Percentage: ${targetPercentage}%`);
        console.log(`Allowed Delta: ±${deltaPercentage} percentage points`);

        // Final assertion
        expect(actualHTAdded).toBeGreaterThanOrEqual(minAddedHT);
        expect(actualHTAdded).toBeLessThanOrEqual(maxAddedHT);

        console.log('PASS: Hightouch percentage is within the allowed range.');

        // 11. Screenshot Event Catalog
        await page.screenshot({
          path: 'test-results/propensity_pl_retook 88 Counter.png',
          fullPage: true,
        });

        // 12. Open Debugger tab
        await page.getByText('Debugger', { exact: true }).click();

        // 13. Click event dan munculkan message
        const targetEvent = 'propensity_pl_retook';

        // Locator berdasarkan nama event, bukan posisi atau class CSS.
        const eventLocator = page.getByText(targetEvent, {
          exact: true,
        });

        // Container scroll yang terlihat pada DevTools.
        const scrollContainer = page.locator('div[tabindex="0"]');

        const maxScrollAttempts = 100;
        let found = false;

        for (let i = 0; i < maxScrollAttempts; i++) {
          if (await eventLocator.count() > 0) {
            const event = eventLocator.first();

            if (await event.isVisible()) {
              console.log(`Event ditemukan: ${targetEvent}`);
              console.log(`Percobaan ke-${i + 1}`);

              await event.scrollIntoViewIfNeeded();
              await event.click();

              found = true;
              break;
            }
          }

          if (await scrollContainer.count() === 0) {
            throw new Error('Container scroll tidak ditemukan');
          }

          const previousPosition = await scrollContainer.evaluate(
            (el) => el.scrollTop
          );

          const result = await scrollContainer.evaluate((el) => {
            const previous = el.scrollTop;

            el.scrollTop += Math.max(200, el.clientHeight * 0.8);

            return {
              current: el.scrollTop,
              max: el.scrollHeight - el.clientHeight,
              previous,
            };
          });

          await page.waitForTimeout(300);

          // Berhenti jika sudah mencapai akhir.
          const currentPosition = await scrollContainer.evaluate(
            (el) => el.scrollTop
          );

          if (
            currentPosition === previousPosition ||
            (
              result.current === result.previous &&
              result.current >= result.max
            )
          ) {
            break;
          }
        }

        if (!found) {
          throw new Error(
            `Event "${targetEvent}" tidak ditemukan setelah scrolling`
          );
        }

        // Verifikasi payload muncul
        const payload = page.locator('.cm-scroller');

        await expect(payload).toBeVisible();

        // Pastikan field messageId muncul di payload
        const messageIdLine = payload
          .locator('.cm-line')
          .filter({ hasText: '"messageId"' });

        await expect(messageIdLine).toBeVisible();

        // Beri izin clipboard untuk membaca seluruh isi payload
        await page.context().grantPermissions(
          ['clipboard-read', 'clipboard-write'],
          { origin: 'https://app.hightouch.com' }
        );

        // Salin seluruh isi JSON dari editor
        await payload.click();
        await page.keyboard.press('ControlOrMeta+a');
        await page.keyboard.press('ControlOrMeta+c');

        const payloadText = await page.evaluate(() =>
          navigator.clipboard.readText()
        );

        // Ubah teks menjadi object JSON
        const message = JSON.parse(payloadText);

        // 13a. Validasi payload umum
        const userIdValidation = validatePayload(message);

        // 13b. Validasi properties khusus group ini
        validatePropensityPlRetookProperties(message);

        // 14. Screenshot Debugger
        const screenshotScroller = page.locator('.cm-scroller');

        const scrollInfo = await screenshotScroller.evaluate((el) => ({
          height: el.clientHeight,
          scrollHeight: el.scrollHeight,
        }));

        const screenshotParts = Math.max(
          1,
          Math.ceil(scrollInfo.scrollHeight / scrollInfo.height)
        );

        for (let i = 0; i < screenshotParts; i++) {
          await screenshotScroller.evaluate((el, index) => {
            el.scrollTop = index * el.clientHeight;
          }, i);

          await page.waitForTimeout(200);

          await screenshotScroller.screenshot({
            path: `test-results/hightouch-payload-propensity_pl_retook-${String(i + 1).padStart(2, '0')}.png`,
          });
        }

        console.log(
          `Screenshot payload tersimpan: ${screenshotParts} bagian`
        );

        // Report ke terminal

        // 1. Log hasil validasi counter
        console.log('\n========== COUNTER VALIDATION ==========');
        console.log(`Event Name      : propensity_pl_retook`);
        console.log(`Counter Before  : ${counterBefore.toLocaleString('en-US')}`);
        console.log(`Counter After   : ${counterAfter.toLocaleString('en-US')}`);
        console.log(`Delta Actual    : +${actualHTAdded}`);
        console.log(`Delta Expected  : ${expectedHT}`);
        console.log(`Allowed Delta   : ${minAddedHT} - ${maxAddedHT}`);

        if (
          actualHTAdded >= minAddedHT &&
          actualHTAdded <= maxAddedHT
        ) {
          console.log('Status          : PASS');
          console.log(
            `Reason          : Delta ${actualHTAdded} berada dalam rentang yang diizinkan (${minAddedHT}-${maxAddedHT})`
          );
        } else {
          console.log('Status          : FAIL');
          console.log(
            `Reason          : Delta ${actualHTAdded} di luar rentang yang diizinkan (${minAddedHT}-${maxAddedHT})`
          );
        }

        // 2. Log properties yang ditemukan
        console.log('\n========== PROPERTIES VALIDATION ==========');

        const properties = message.properties;

        console.log('Properties found :');

        for (const [key, value] of Object.entries(properties)) {
          console.log(`- ${key}: ${JSON.stringify(value)}`);
        }

        console.log('Status           : PASS');

        // 3. Log User ID validation
        console.log('\n========== USER ID VALIDATION ==========');
        console.log(`User ID          : ${message.userId}`);
        console.log(`Contains Letter  : ${userIdValidation.hasLetter}`);
        console.log(`Numeric Only     : ${userIdValidation.isNumericOnly}`);
        console.log(`Status           : ${userIdValidation.isValid ? 'PASS' : 'FAIL'}`);
        console.log(`Reason           : ${userIdValidation.reason}`);

        // Assertion User ID
        expect(
          userIdValidation.isValid,
          `USER ID VALIDATION FAILED: ${userIdValidation.reason}`
        ).toBeTruthy();

        // 4. Log nama screenshot
        console.log('\n========== SCREENSHOT ==========');
        console.log(
          'Screenshot       : test-results/propensity_pl_retook 88 Counter.png'
        );
        console.log('=========================================\n');

        await page.waitForTimeout(5000);
      });
    }
  );



  test.describe.parallel('rfm_segmentation Group', { tag: '@validGroup' }, () => {
  
    test('Verify rfm_segmentation 88 Counter', async ({ page }) => {
      // 1. Open Hightouch
      await page.goto('https://app.hightouch.com/');

      // 2. Open workspace
      await page.getByText('Kredivo-Dev', { exact: true }).click();

      // 3. Open Event Collection
      await page.getByText('Event Collection', { exact: true }).click();

      // 4. Open Event sources
      await page.getByText('Event sources', { exact: true }).click();

      await expect(page).toHaveURL(
        'https://app.hightouch.com/fti-kredivo-dev/events/sources'
      );

      // 5. Select HTTP CRM API
      await page.getByText('HTTP CRM API (crm)', { exact: true }).click();

      // 6. Open Event catalog
      await page.getByText('Event catalog', { exact: true }).click();

      // 7. Select 3-day time range
     // await page.getByText('3d', { exact: true }).click();

      // 8. Find event rfm_segmentation
      const eventName = page.getByText('rfm_segmentation', {
        exact: true,
      });

      await expect(eventName).toBeVisible();

      // 9. Get the counter dynamically
      // NOTE: This assumes the event is displayed in a semantic table row.
      const eventRow = page
        .getByRole('row')
        .filter({ has: eventName });

      const counter = eventRow.getByText(/^\d+$/, { // /^\d+$/ => Regular Expression buat mastiin smua numerical
        exact: true,
      }).last(); // pakai ini => mengambil angka paling akhir

      const counterText = await counter.textContent(); // manggil text yg ada di counter
      const counterValue = Number(counterText?.trim()); // text dijadiin numeric dan trim slain numeric
                                                        //  ? agar value dari counter text > null maka.trim() ga jalan
      // 10. Validate counter >= 88
      expect(Number.isFinite(counterValue)).toBeTruthy(); //mastiin counterValue bukan NaN, Infinity, atau -Infinity
      expect(counterValue).toBeGreaterThanOrEqual(88);
      console.log(`Counter order_completed: ${counterValue}`);

      // 11. Screenshot Event Catalog
      await page.screenshot({
        path: 'test-results/rfm_segmentation 88 Counter.png',
        fullPage: true,
      });

      // 12. Open Debugger tab
      await page.getByText('Debugger', { exact: true }).click();

      //13. Click event dan munculkan message
      const targetEvent = 'rfm_segmentation';

      // Locator berdasarkan nama event, bukan posisi atau class CSS.
      const eventLocator = page.getByText(targetEvent, {
        exact: true,
      }); // menentukan target event yg dicari

      // Container scroll yang terlihat pada DevTools.
      const scrollContainer = page.locator('div[tabindex="0"]');

      const maxScrollAttempts = 100; //menentukan jumlah scroll maks
      let found = false;

      for (let i = 0; i < maxScrollAttempts; i++) {//proses pencarian
        if (await eventLocator.count() > 0) {//mastiin event harus > 0 bru dianggep ketemu
          const event = eventLocator.first();//event paling pertama yg sesuai yg dicari

          if (await event.isVisible()) {
            console.log(`Event ditemukan: ${targetEvent}`);
            console.log(`Percobaan ke-${i + 1}`);

            await event.scrollIntoViewIfNeeded();
            await event.click();

            found = true;
            break;
          }
        }

        if (await scrollContainer.count() === 0) {//bakal muncul error klo event yg dicari 0
          throw new Error('Container scroll tidak ditemukan');
        } 

        const previousPosition = await scrollContainer.evaluate(
          (el) => el.scrollTop //membaca posisi scroll
        );//el => elemen container

        const result = await scrollContainer.evaluate((el) => {
          const previous = el.scrollTop;

          el.scrollTop += Math.max(200, el.clientHeight * 0.8);//melakukan scroll terus sampai dapat

          return {
            current: el.scrollTop,
            max: el.scrollHeight - el.clientHeight,
            previous,//mastiin batas sebelum & sesudah di scroll
          };
        });

        await page.waitForTimeout(300);

        //Berhenti jika sudah mencapai akhir.
        const currentPosition = await scrollContainer.evaluate(
          (el) => el.scrollTop
        );

        if (
          currentPosition === previousPosition ||
          result.current === result.previous &&
          result.current >= result.max
        ) {
          break;//verif scroll udah berenti
        }
      }

      if (!found) {
        throw new Error(
          `Event "${targetEvent}" tidak ditemukan setelah scrolling`
        );
      }  
       // Verifikasi payload muncul
      const payload = page.locator('.cm-scroller');

      await expect(payload).toBeVisible();

      // Pastikan field messageId muncul di payload
      const messageIdLine = payload
        .locator('.cm-line')
        .filter({ hasText: '"messageId"' });

      await expect(messageIdLine).toBeVisible();

      // Beri izin clipboard untuk membaca seluruh isi payload
      await page.context().grantPermissions(
        ['clipboard-read', 'clipboard-write'],
        { origin: 'https://app.hightouch.com' }
      );

      // Salin seluruh isi JSON dari editor
      await payload.click();
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.press('ControlOrMeta+c');

      const payloadText = await page.evaluate(() =>
        navigator.clipboard.readText()
      );

      // Ubah teks menjadi object JSON
      const message = JSON.parse(payloadText);

      // Jalankan seluruh validasi payload
      validatePayload(message);


      // 14. Screenshot Debugger
      const screenshotScroller = page.locator('.cm-scroller');

      const scrollInfo = await screenshotScroller.evaluate((el) => ({
        height: el.clientHeight,
        scrollHeight: el.scrollHeight,
      }));

      const screenshotParts = Math.max(
        1,
        Math.ceil(scrollInfo.scrollHeight / scrollInfo.height)
      );

      for (let i = 0; i < screenshotParts; i++) {
        await screenshotScroller.evaluate((el, index) => {
          el.scrollTop = index * el.clientHeight;
        }, i);

        await page.waitForTimeout(200);

        await screenshotScroller.screenshot({
          path: `test-results/hightouch-payload-rfm_segmentation-${String(i + 1).padStart(2, '0')}.png`,
        });
      }

      console.log(
        `Screenshot payload tersimpan: ${screenshotParts} bagian`
      );
      // Report ke terminal
    console.log('PASS: Event rfm_segmentation ditemukan');
    console.log('PASS: Counter event ditemukan dengan nilai >= 88');
    console.log('Screenshot saved: test-results/rfm_segmentation 88 Counter.png');

   await page.waitForTimeout(5000);
    });

    test('Verify rfm_segmentation 100 Counter', async ({ page }) => {
      // 1. Open Hightouch
      await page.goto('https://app.hightouch.com/');

      // 2. Open workspace
      await page.getByText('Kredivo-Dev', { exact: true }).click();

      // 3. Open Event Collection
      await page.getByText('Event Collection', { exact: true }).click();

      // 4. Open Event sources
      await page.getByText('Event sources', { exact: true }).click();

      await expect(page).toHaveURL(
        'https://app.hightouch.com/fti-kredivo-dev/events/sources'
      );

      // 5. Select HTTP CRM API
      await page.getByText('HTTP CRM API (crm)', { exact: true }).click();

      // 6. Open Event catalog
      await page.getByText('Event catalog', { exact: true }).click();

      // 7. Select 3-day time range
     // await page.getByText('3d', { exact: true }).click();

      // 8. Find event rfm_segmentation
      const eventName = page.getByText('rfm_segmentation', {
        exact: true,
      });

      await expect(eventName).toBeVisible();

      // 9. Get the counter dynamically
      // NOTE: This assumes the event is displayed in a semantic table row.
      const eventRow = page
        .getByRole('row')
        .filter({ has: eventName });

      const counter = eventRow.getByText(/^\d+$/, { // /^\d+$/ => Regular Expression buat mastiin smua numerical
        exact: true,
      }).last(); // pakai ini => mengambil angka paling akhir

      const counterText = await counter.textContent(); // manggil text yg ada di counter
      const counterValue = Number(counterText?.trim()); // text dijadiin numeric dan trim slain numeric
                                                        //  ? agar value dari counter text > null maka.trim() ga jalan
      // 10. Validate counter >= 100
      expect(Number.isFinite(counterValue)).toBeTruthy(); //mastiin counterValue bukan NaN, Infinity, atau -Infinity
      expect(counterValue).toBeGreaterThanOrEqual(100);
      console.log(`Counter order_completed: ${counterValue}`);

      // 11. Screenshot Event Catalog
      await page.screenshot({
        path: 'test-results/rfm_segmentation 100 Counter.png',
        fullPage: true,
      });

      // 12. Open Debugger tab
      await page.getByText('Debugger', { exact: true }).click();

      //13. Click event dan munculkan message
      const targetEvent = 'rfm_segmentation';

      // Locator berdasarkan nama event, bukan posisi atau class CSS.
      const eventLocator = page.getByText(targetEvent, {
        exact: true,
      }); // menentukan target event yg dicari

      // Container scroll yang terlihat pada DevTools.
      const scrollContainer = page.locator('div[tabindex="0"]');

      const maxScrollAttempts = 100; //menentukan jumlah scroll maks
      let found = false;

      for (let i = 0; i < maxScrollAttempts; i++) {//proses pencarian
        if (await eventLocator.count() > 0) {//mastiin event harus > 0 bru dianggep ketemu
          const event = eventLocator.first();//event paling pertama yg sesuai yg dicari

          if (await event.isVisible()) {
            console.log(`Event ditemukan: ${targetEvent}`);
            console.log(`Percobaan ke-${i + 1}`);

            await event.scrollIntoViewIfNeeded();
            await event.click();

            found = true;
            break;
          }
        }

        if (await scrollContainer.count() === 0) {//bakal muncul error klo event yg dicari 0
          throw new Error('Container scroll tidak ditemukan');
        } 

        const previousPosition = await scrollContainer.evaluate(
          (el) => el.scrollTop //membaca posisi scroll
        );//el => elemen container

        const result = await scrollContainer.evaluate((el) => {
          const previous = el.scrollTop;

          el.scrollTop += Math.max(200, el.clientHeight * 0.8);//melakukan scroll terus sampai dapat

          return {
            current: el.scrollTop,
            max: el.scrollHeight - el.clientHeight,
            previous,//mastiin batas sebelum & sesudah di scroll
          };
        });

        await page.waitForTimeout(300);

        //Berhenti jika sudah mencapai akhir.
        const currentPosition = await scrollContainer.evaluate(
          (el) => el.scrollTop
        );

        if (
          currentPosition === previousPosition ||
          result.current === result.previous &&
          result.current >= result.max
        ) {
          break;//verif scroll udah berenti
        }
      }

      if (!found) {
        throw new Error(
          `Event "${targetEvent}" tidak ditemukan setelah scrolling`
        );
      }  
       // Verifikasi payload muncul
      const payload = page.locator('.cm-scroller');

      await expect(payload).toBeVisible();

      // Pastikan field messageId muncul di payload
      const messageIdLine = payload
        .locator('.cm-line')
        .filter({ hasText: '"messageId"' });

      await expect(messageIdLine).toBeVisible();

      // Beri izin clipboard untuk membaca seluruh isi payload
      await page.context().grantPermissions(
        ['clipboard-read', 'clipboard-write'],
        { origin: 'https://app.hightouch.com' }
      );

      // Salin seluruh isi JSON dari editor
      await payload.click();
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.press('ControlOrMeta+c');

      const payloadText = await page.evaluate(() =>
        navigator.clipboard.readText()
      );

      // Ubah teks menjadi object JSON
      const message = JSON.parse(payloadText);

      // Jalankan seluruh validasi payload
      validatePayload(message);


      // 14. Screenshot Debugger
      const screenshotScroller = page.locator('.cm-scroller');

      const scrollInfo = await screenshotScroller.evaluate((el) => ({
        height: el.clientHeight,
        scrollHeight: el.scrollHeight,
      }));

      const screenshotParts = Math.max(
        1,
        Math.ceil(scrollInfo.scrollHeight / scrollInfo.height)
      );

      for (let i = 0; i < screenshotParts; i++) {
        await screenshotScroller.evaluate((el, index) => {
          el.scrollTop = index * el.clientHeight;
        }, i);

        await page.waitForTimeout(200);

        await screenshotScroller.screenshot({
          path: `test-results/hightouch-payload-rfm_segmentation-${String(i + 1).padStart(2, '0')}.png`,
        });
      }

      console.log(
        `Screenshot payload tersimpan: ${screenshotParts} bagian`
      );
      // Report ke terminal
    console.log('PASS: Event rfm_segmentation ditemukan');
    console.log('PASS: Counter event ditemukan dengan nilai >= 100');
    console.log('Screenshot saved: test-results/rfm_segmentation 100 Counter.png');

   await page.waitForTimeout(5000);
    });

    test('Verify rfm_segmentation 500 Counter', async ({ page }) => {
      // 1. Open Hightouch
      await page.goto('https://app.hightouch.com/');

      // 2. Open workspace
      await page.getByText('Kredivo-Dev', { exact: true }).click();

      // 3. Open Event Collection
      await page.getByText('Event Collection', { exact: true }).click();

      // 4. Open Event sources
      await page.getByText('Event sources', { exact: true }).click();

      await expect(page).toHaveURL(
        'https://app.hightouch.com/fti-kredivo-dev/events/sources'
      );

      // 5. Select HTTP CRM API
      await page.getByText('HTTP CRM API (crm)', { exact: true }).click();

      // 6. Open Event catalog
      await page.getByText('Event catalog', { exact: true }).click();

      // 7. Select 3-day time range
     // await page.getByText('3d', { exact: true }).click();

      // 8. Find event rfm_segmentation
      const eventName = page.getByText('rfm_segmentation', {
        exact: true,
      });

      await expect(eventName).toBeVisible();

      // 9. Get the counter dynamically
      // NOTE: This assumes the event is displayed in a semantic table row.
      const eventRow = page
        .getByRole('row')
        .filter({ has: eventName });

      const counter = eventRow.getByText(/^\d+$/, { // /^\d+$/ => Regular Expression buat mastiin smua numerical
        exact: true,
      }).last(); // pakai ini => mengambil angka paling akhir

      const counterText = await counter.textContent(); // manggil text yg ada di counter
      const counterValue = Number(counterText?.trim()); // text dijadiin numeric dan trim slain numeric
                                                        //  ? agar value dari counter text > null maka.trim() ga jalan
      // 10. Validate counter >= 500
      expect(Number.isFinite(counterValue)).toBeTruthy(); //mastiin counterValue bukan NaN, Infinity, atau -Infinity
      expect(counterValue).toBeGreaterThanOrEqual(500);
      console.log(`Counter order_completed: ${counterValue}`);

      // 11. Screenshot Event Catalog
      await page.screenshot({
        path: 'test-results/rfm_segmentation 500 Counter.png',
        fullPage: true,
      });

      // 12. Open Debugger tab
      await page.getByText('Debugger', { exact: true }).click();

      //13. Click event dan munculkan message
      const targetEvent = 'rfm_segmentation';

      // Locator berdasarkan nama event, bukan posisi atau class CSS.
      const eventLocator = page.getByText(targetEvent, {
        exact: true,
      }); // menentukan target event yg dicari

      // Container scroll yang terlihat pada DevTools.
      const scrollContainer = page.locator('div[tabindex="0"]');

      const maxScrollAttempts = 100; //menentukan jumlah scroll maks
      let found = false;

      for (let i = 0; i < maxScrollAttempts; i++) {//proses pencarian
        if (await eventLocator.count() > 0) {//mastiin event harus > 0 bru dianggep ketemu
          const event = eventLocator.first();//event paling pertama yg sesuai yg dicari

          if (await event.isVisible()) {
            console.log(`Event ditemukan: ${targetEvent}`);
            console.log(`Percobaan ke-${i + 1}`);

            await event.scrollIntoViewIfNeeded();
            await event.click();

            found = true;
            break;
          }
        }

        if (await scrollContainer.count() === 0) {//bakal muncul error klo event yg dicari 0
          throw new Error('Container scroll tidak ditemukan');
        } 

        const previousPosition = await scrollContainer.evaluate(
          (el) => el.scrollTop //membaca posisi scroll
        );//el => elemen container

        const result = await scrollContainer.evaluate((el) => {
          const previous = el.scrollTop;

          el.scrollTop += Math.max(200, el.clientHeight * 0.8);//melakukan scroll terus sampai dapat

          return {
            current: el.scrollTop,
            max: el.scrollHeight - el.clientHeight,
            previous,//mastiin batas sebelum & sesudah di scroll
          };
        });

        await page.waitForTimeout(300);

        //Berhenti jika sudah mencapai akhir.
        const currentPosition = await scrollContainer.evaluate(
          (el) => el.scrollTop
        );

        if (
          currentPosition === previousPosition ||
          result.current === result.previous &&
          result.current >= result.max
        ) {
          break;//verif scroll udah berenti
        }
      }

      if (!found) {
        throw new Error(
          `Event "${targetEvent}" tidak ditemukan setelah scrolling`
        );
      }  
       // Verifikasi payload muncul
      const payload = page.locator('.cm-scroller');

      await expect(payload).toBeVisible();

      // Pastikan field messageId muncul di payload
      const messageIdLine = payload
        .locator('.cm-line')
        .filter({ hasText: '"messageId"' });

      await expect(messageIdLine).toBeVisible();

      // Beri izin clipboard untuk membaca seluruh isi payload
      await page.context().grantPermissions(
        ['clipboard-read', 'clipboard-write'],
        { origin: 'https://app.hightouch.com' }
      );

      // Salin seluruh isi JSON dari editor
      await payload.click();
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.press('ControlOrMeta+c');

      const payloadText = await page.evaluate(() =>
        navigator.clipboard.readText()
      );

      // Ubah teks menjadi object JSON
      const message = JSON.parse(payloadText);

      // Jalankan seluruh validasi payload
      validatePayload(message);


      // 14. Screenshot Debugger
      const screenshotScroller = page.locator('.cm-scroller');

      const scrollInfo = await screenshotScroller.evaluate((el) => ({
        height: el.clientHeight,
        scrollHeight: el.scrollHeight,
      }));

      const screenshotParts = Math.max(
        1,
        Math.ceil(scrollInfo.scrollHeight / scrollInfo.height)
      );

      for (let i = 0; i < screenshotParts; i++) {
        await screenshotScroller.evaluate((el, index) => {
          el.scrollTop = index * el.clientHeight;
        }, i);

        await page.waitForTimeout(200);

        await screenshotScroller.screenshot({
          path: `test-results/hightouch-payload-rfm_segmentation-${String(i + 1).padStart(2, '0')}.png`,
        });
      }

      console.log(
        `Screenshot payload tersimpan: ${screenshotParts} bagian`
      );
      // Report ke terminal
    console.log('PASS: Event rfm_segmentation ditemukan');
    console.log('PASS: Counter event ditemukan dengan nilai >= 500');
    console.log('Screenshot saved: test-results/rfm_segmentation 500 Counter.png');

   await page.waitForTimeout(5000);
    });

    test('Verify rfm_segmentation 1000 Counter', async ({ page }) => {
      // 1. Open Hightouch
      await page.goto('https://app.hightouch.com/');

      // 2. Open workspace
      await page.getByText('Kredivo-Dev', { exact: true }).click();

      // 3. Open Event Collection
      await page.getByText('Event Collection', { exact: true }).click();

      // 4. Open Event sources
      await page.getByText('Event sources', { exact: true }).click();

      await expect(page).toHaveURL(
        'https://app.hightouch.com/fti-kredivo-dev/events/sources'
      );

      // 5. Select HTTP CRM API
      await page.getByText('HTTP CRM API (crm)', { exact: true }).click();

      // 6. Open Event catalog
      await page.getByText('Event catalog', { exact: true }).click();

      // 7. Select 3-day time range
     // await page.getByText('3d', { exact: true }).click();

      // 8. Find event rfm_segmentation
      const eventName = page.getByText('rfm_segmentation', {
        exact: true,
      });

      await expect(eventName).toBeVisible();

      // 9. Get the counter dynamically
      // NOTE: This assumes the event is displayed in a semantic table row.
      const eventRow = page
        .getByRole('row')
        .filter({ has: eventName });

      const counter = eventRow.getByText(/^\d+$/, { // /^\d+$/ => Regular Expression buat mastiin smua numerical
        exact: true,
      }).last(); // pakai ini => mengambil angka paling akhir

      const counterText = await counter.textContent(); // manggil text yg ada di counter
      const counterValue = Number(counterText?.trim()); // text dijadiin numeric dan trim slain numeric
                                                        //  ? agar value dari counter text > null maka.trim() ga jalan
      // 10. Validate counter >= 1000
      expect(Number.isFinite(counterValue)).toBeTruthy(); //mastiin counterValue bukan NaN, Infinity, atau -Infinity
      expect(counterValue).toBeGreaterThanOrEqual(1000);
      console.log(`Counter order_completed: ${counterValue}`);

      // 11. Screenshot Event Catalog
      await page.screenshot({
        path: 'test-results/rfm_segmentation 1000 Counter.png',
        fullPage: true,
      });

      // 12. Open Debugger tab
      await page.getByText('Debugger', { exact: true }).click();

      //13. Click event dan munculkan message
      const targetEvent = 'rfm_segmentation';

      // Locator berdasarkan nama event, bukan posisi atau class CSS.
      const eventLocator = page.getByText(targetEvent, {
        exact: true,
      }); // menentukan target event yg dicari

      // Container scroll yang terlihat pada DevTools.
      const scrollContainer = page.locator('div[tabindex="0"]');

      const maxScrollAttempts = 100; //menentukan jumlah scroll maks
      let found = false;

      for (let i = 0; i < maxScrollAttempts; i++) {//proses pencarian
        if (await eventLocator.count() > 0) {//mastiin event harus > 0 bru dianggep ketemu
          const event = eventLocator.first();//event paling pertama yg sesuai yg dicari

          if (await event.isVisible()) {
            console.log(`Event ditemukan: ${targetEvent}`);
            console.log(`Percobaan ke-${i + 1}`);

            await event.scrollIntoViewIfNeeded();
            await event.click();

            found = true;
            break;
          }
        }

        if (await scrollContainer.count() === 0) {//bakal muncul error klo event yg dicari 0
          throw new Error('Container scroll tidak ditemukan');
        } 

        const previousPosition = await scrollContainer.evaluate(
          (el) => el.scrollTop //membaca posisi scroll
        );//el => elemen container

        const result = await scrollContainer.evaluate((el) => {
          const previous = el.scrollTop;

          el.scrollTop += Math.max(200, el.clientHeight * 0.8);//melakukan scroll terus sampai dapat

          return {
            current: el.scrollTop,
            max: el.scrollHeight - el.clientHeight,
            previous,//mastiin batas sebelum & sesudah di scroll
          };
        });

        await page.waitForTimeout(300);

        //Berhenti jika sudah mencapai akhir.
        const currentPosition = await scrollContainer.evaluate(
          (el) => el.scrollTop
        );

        if (
          currentPosition === previousPosition ||
          result.current === result.previous &&
          result.current >= result.max
        ) {
          break;//verif scroll udah berenti
        }
      }

      if (!found) {
        throw new Error(
          `Event "${targetEvent}" tidak ditemukan setelah scrolling`
        );
      }  
       // Verifikasi payload muncul
      const payload = page.locator('.cm-scroller');

      await expect(payload).toBeVisible();

      // Pastikan field messageId muncul di payload
      const messageIdLine = payload
        .locator('.cm-line')
        .filter({ hasText: '"messageId"' });

      await expect(messageIdLine).toBeVisible();

      // Beri izin clipboard untuk membaca seluruh isi payload
      await page.context().grantPermissions(
        ['clipboard-read', 'clipboard-write'],
        { origin: 'https://app.hightouch.com' }
      );

      // Salin seluruh isi JSON dari editor
      await payload.click();
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.press('ControlOrMeta+c');

      const payloadText = await page.evaluate(() =>
        navigator.clipboard.readText()
      );

      // Ubah teks menjadi object JSON
      const message = JSON.parse(payloadText);

      // Jalankan seluruh validasi payload
      validatePayload(message);


      // 14. Screenshot Debugger
      const screenshotScroller = page.locator('.cm-scroller');

      const scrollInfo = await screenshotScroller.evaluate((el) => ({
        height: el.clientHeight,
        scrollHeight: el.scrollHeight,
      }));

      const screenshotParts = Math.max(
        1,
        Math.ceil(scrollInfo.scrollHeight / scrollInfo.height)
      );

      for (let i = 0; i < screenshotParts; i++) {
        await screenshotScroller.evaluate((el, index) => {
          el.scrollTop = index * el.clientHeight;
        }, i);

        await page.waitForTimeout(200);

        await screenshotScroller.screenshot({
          path: `test-results/hightouch-payload-rfm_segmentation-${String(i + 1).padStart(2, '0')}.png`,
        });
      }

      console.log(
        `Screenshot payload tersimpan: ${screenshotParts} bagian`
      );
      // Report ke terminal
    console.log('PASS: Event rfm_segmentation ditemukan');
    console.log('PASS: Counter event ditemukan dengan nilai >= 1000');
    console.log('Screenshot saved: test-results/rfm_segmentation 1000 Counter.png');

   await page.waitForTimeout(5000);
    });
    });


  test.describe.parallel('pltv_buffer_3d_event', { tag: '@validGroup' }, () => {
  
      test('Verify pltv_buffer_3d_event 88 Counter', async ({ page }) => {
     // 1. Open Hightouch
      await page.goto('https://app.hightouch.com/');

      // 2. Open workspace
      await page.getByText('Kredivo-Dev', { exact: true }).click();

      // 3. Open Event Collection
      await page.getByText('Event Collection', { exact: true }).click();

      // 4. Open Event sources
      await page.getByText('Event sources', { exact: true }).click();

      await expect(page).toHaveURL(
        'https://app.hightouch.com/fti-kredivo-dev/events/sources'
      );

      // 5. Select HTTP CRM API
      await page.getByText('HTTP CRM API (crm)', { exact: true }).click();

      // 6. Open Event catalog
      await page.getByText('Event catalog', { exact: true }).click();

      // 7. Select 3-day time range
     // await page.getByText('3d', { exact: true }).click();

      // 8. Find event pltv_buffer_6d_event
      const eventName = page.getByText('stg_pltv_buffer_3d_event', {
        exact: true,
      });

      await expect(eventName).toBeVisible();

      // 9. Get the counter dynamically
      // NOTE: This assumes the event is displayed in a semantic table row.
      const eventRow = page
        .getByRole('row')
        .filter({ has: eventName });

      const counter = eventRow.getByText(/^\d+$/, { // /^\d+$/ => Regular Expression buat mastiin smua numerical
        exact: true,
      }).last(); // pakai ini => mengambil angka paling akhir

      const counterText = await counter.textContent(); // manggil text yg ada di counter
      const counterValue = Number(counterText?.trim()); // text dijadiin numeric dan trim slain numeric
                                                        //  ? agar value dari counter text > null maka.trim() ga jalan
      // 10. Validate counter >= 88
      expect(Number.isFinite(counterValue)).toBeTruthy(); //mastiin counterValue bukan NaN, Infinity, atau -Infinity
      expect(counterValue).toBeGreaterThanOrEqual(87);
      console.log(`Counter order_completed: ${counterValue}`);

      // 11. Screenshot Event Catalog
      await page.screenshot({
        path: 'test-results/stg_pltv_buffer_3d_event 88 Counter.png',
        fullPage: true,
      });

      // 12. Open Debugger tab
      await page.getByText('Debugger', { exact: true }).click();

      //13. Click event dan munculkan message
      const targetEvent = 'stg_pltv_buffer_3d_event';

      // Locator berdasarkan nama event, bukan posisi atau class CSS.
      const eventLocator = page.getByText(targetEvent, {
        exact: true,
      }); // menentukan target event yg dicari

      // Container scroll yang terlihat pada DevTools.
      const scrollContainer = page.locator('div[tabindex="0"]');

      const maxScrollAttempts = 100; //menentukan jumlah scroll maks
      let found = false;

      for (let i = 0; i < maxScrollAttempts; i++) {//proses pencarian
        if (await eventLocator.count() > 0) {//mastiin event harus > 0 bru dianggep ketemu
          const event = eventLocator.first();//event paling pertama yg sesuai yg dicari

          if (await event.isVisible()) {
            console.log(`Event ditemukan: ${targetEvent}`);
            console.log(`Percobaan ke-${i + 1}`);

            await event.scrollIntoViewIfNeeded();
            await event.click();

            found = true;
            break;
          }
        }

        if (await scrollContainer.count() === 0) {//bakal muncul error klo event yg dicari 0
          throw new Error('Container scroll tidak ditemukan');
        } 

        const previousPosition = await scrollContainer.evaluate(
          (el) => el.scrollTop //membaca posisi scroll
        );//el => elemen container

        const result = await scrollContainer.evaluate((el) => {
          const previous = el.scrollTop;

          el.scrollTop += Math.max(200, el.clientHeight * 0.8);//melakukan scroll terus sampai dapat

          return {
            current: el.scrollTop,
            max: el.scrollHeight - el.clientHeight,
            previous,//mastiin batas sebelum & sesudah di scroll
          };
        });

        await page.waitForTimeout(300);

        //Berhenti jika sudah mencapai akhir.
        const currentPosition = await scrollContainer.evaluate(
          (el) => el.scrollTop
        );

        if (
          currentPosition === previousPosition ||
          result.current === result.previous &&
          result.current >= result.max
        ) {
          break;//verif scroll udah berenti
        }
      }

      if (!found) {
        throw new Error(
          `Event "${targetEvent}" tidak ditemukan setelah scrolling`
        );
      }  
       // Verifikasi payload muncul
      const payload = page.locator('.cm-scroller');

await expect(payload).toBeVisible();

// Pastikan field messageId muncul di payload
const messageIdLine = payload
  .locator('.cm-line')
  .filter({ hasText: '"messageId"' });

await expect(messageIdLine).toBeVisible();

// Beri izin clipboard untuk membaca seluruh isi payload
await page.context().grantPermissions(
  ['clipboard-read', 'clipboard-write'],
  { origin: 'https://app.hightouch.com' }
);

// Salin seluruh isi JSON dari editor
await payload.click();
await page.keyboard.press('ControlOrMeta+a');
await page.keyboard.press('ControlOrMeta+c');

const payloadText = await page.evaluate(() =>
  navigator.clipboard.readText()
);

// Ubah teks menjadi object JSON
const message = JSON.parse(payloadText);

// Jalankan seluruh validasi payload
validatePayload(message);


      // 14. Screenshot Debugger
      const screenshotScroller = page.locator('.cm-scroller');

      const scrollInfo = await screenshotScroller.evaluate((el) => ({
        height: el.clientHeight,
        scrollHeight: el.scrollHeight,
      }));

      const screenshotParts = Math.max(
        1,
        Math.ceil(scrollInfo.scrollHeight / scrollInfo.height)
      );

      for (let i = 0; i < screenshotParts; i++) {
        await screenshotScroller.evaluate((el, index) => {
          el.scrollTop = index * el.clientHeight;
        }, i);

        await page.waitForTimeout(200);

        await screenshotScroller.screenshot({
          path: `test-results/hightouch-payload-part-${String(i + 1).padStart(2, '0')}.png`,
        });
      }

      console.log(
        `Screenshot payload tersimpan: ${screenshotParts} bagian`
      );
      // Report ke terminal
    console.log('PASS: Event pltv_buffer_3d_event ditemukan');
    console.log('PASS: Counter event ditemukan dengan nilai >= 88');
    console.log('Screenshot saved: test-results/stg_pltv_buffer_3d_event 88 Counter.png');

   await page.waitForTimeout(5000);
    });
    

      test('Verify pltv_buffer_3d_event 100 Counter', async ({ page }) => {
      // 1. Open Hightouch
      await page.goto('https://app.hightouch.com/');

      // 2. Open workspace
      await page.getByText('Kredivo-Dev', { exact: true }).click();

      // 3. Open Event Collection
      await page.getByText('Event Collection', { exact: true }).click();

      // 4. Open Event sources
      await page.getByText('Event sources', { exact: true }).click();

      await expect(page).toHaveURL(
        'https://app.hightouch.com/fti-kredivo-dev/events/sources'
      );

      // 5. Select HTTP CRM API
      await page.getByText('HTTP CRM API (crm)', { exact: true }).click();

      // 6. Open Event catalog
      await page.getByText('Event catalog', { exact: true }).click();

      // 7. Select 3-day time range
     // await page.getByText('3d', { exact: true }).click();

      // 8. Find event pltv_buffer_6d_event
      const eventName = page.getByText('stg_pltv_buffer_3d_event', {
        exact: true,
      });

      await expect(eventName).toBeVisible();

      // 9. Get the counter dynamically
      // NOTE: This assumes the event is displayed in a semantic table row.
      const eventRow = page
        .getByRole('row')
        .filter({ has: eventName });

      const counter = eventRow.getByText(/^\d+$/, { // /^\d+$/ => Regular Expression buat mastiin smua numerical
        exact: true,
      }).last(); // pakai ini => mengambil angka paling akhir

      const counterText = await counter.textContent(); // manggil text yg ada di counter
      const counterValue = Number(counterText?.trim()); // text dijadiin numeric dan trim slain numeric
                                                        //  ? agar value dari counter text > null maka.trim() ga jalan
      // 10. Validate counter >= 188
      expect(Number.isFinite(counterValue)).toBeTruthy(); //mastiin counterValue bukan NaN, Infinity, atau -Infinity
      expect(counterValue).toBeGreaterThanOrEqual(188);
      console.log(`Counter order_completed: ${counterValue}`);

      // 11. Screenshot Event Catalog
      await page.screenshot({
        path: 'test-results/stg_pltv_buffer_3d_event 188 Counter.png',
        fullPage: true,
      });

      // 12. Open Debugger tab
      await page.getByText('Debugger', { exact: true }).click();

      //13. Click event dan munculkan message
      const targetEvent = 'stg_pltv_buffer_3d_event';

      // Locator berdasarkan nama event, bukan posisi atau class CSS.
      const eventLocator = page.getByText(targetEvent, {
        exact: true,
      }); // menentukan target event yg dicari

      // Container scroll yang terlihat pada DevTools.
      const scrollContainer = page.locator('div[tabindex="0"]');

      const maxScrollAttempts = 100; //menentukan jumlah scroll maks
      let found = false;

      for (let i = 0; i < maxScrollAttempts; i++) {//proses pencarian
        if (await eventLocator.count() > 0) {//mastiin event harus > 0 bru dianggep ketemu
          const event = eventLocator.first();//event paling pertama yg sesuai yg dicari

          if (await event.isVisible()) {
            console.log(`Event ditemukan: ${targetEvent}`);
            console.log(`Percobaan ke-${i + 1}`);

            await event.scrollIntoViewIfNeeded();
            await event.click();

            found = true;
            break;
          }
        }

        if (await scrollContainer.count() === 0) {//bakal muncul error klo event yg dicari 0
          throw new Error('Container scroll tidak ditemukan');
        } 

        const previousPosition = await scrollContainer.evaluate(
          (el) => el.scrollTop //membaca posisi scroll
        );//el => elemen container

        const result = await scrollContainer.evaluate((el) => {
          const previous = el.scrollTop;

          el.scrollTop += Math.max(200, el.clientHeight * 0.8);//melakukan scroll terus sampai dapat

          return {
            current: el.scrollTop,
            max: el.scrollHeight - el.clientHeight,
            previous,//mastiin batas sebelum & sesudah di scroll
          };
        });

        await page.waitForTimeout(300);

        //Berhenti jika sudah mencapai akhir.
        const currentPosition = await scrollContainer.evaluate(
          (el) => el.scrollTop
        );

        if (
          currentPosition === previousPosition ||
          result.current === result.previous &&
          result.current >= result.max
        ) {
          break;//verif scroll udah berenti
        }
      }

      if (!found) {
        throw new Error(
          `Event "${targetEvent}" tidak ditemukan setelah scrolling`
        );
      }  
       // Verifikasi payload muncul
      const payload = page.locator('.cm-scroller');

      const messageIdLine = payload
        .locator('.cm-line')
        .filter({ hasText: '"messageId"' });

      await expect(messageIdLine).toBeVisible();

      // 14. Screenshot Debugger
      await page.screenshot({
        path: 'test-results/hightouch-debugger stg_pltv_buffer_3d_event 188 Counter.png',
        fullPage: true,
      });
      // Report ke terminal
    console.log('PASS: Event pltv_buffer_3d_event ditemukan');
    console.log('PASS: Counter event ditemukan dengan nilai >= 188');
    console.log('Screenshot saved: test-results/stg_pltv_buffer_3d_event 188 Counter.png');

   await page.waitForTimeout(5000);
    });

    });
 
 test.describe.parallel('pltv_buffer_6d_event', { tag: '@validGroup' }, () => {

      test('Verify pltv_buffer_6d_event 88 Counter', async ({ page }) => {
      // 1. Open Hightouch
      await page.goto('https://app.hightouch.com/');

      // 2. Open workspace
      await page.getByText('Kredivo-Dev', { exact: true }).click();

      // 3. Open Event Collection
      await page.getByText('Event Collection', { exact: true }).click();

      // 4. Open Event sources
      await page.getByText('Event sources', { exact: true }).click();

      await expect(page).toHaveURL(
        'https://app.hightouch.com/fti-kredivo-dev/events/sources'
      );

      // 5. Select HTTP CRM API
      await page.getByText('HTTP CRM API (crm)', { exact: true }).click();

      // 6. Open Event catalog
      await page.getByText('Event catalog', { exact: true }).click();

      // 7. Select 3-day time range
     // await page.getByText('3d', { exact: true }).click();

      // 8. Find event pltv_buffer_6d_event
      const eventName = page.getByText('stg_pltv_buffer_6d_event', {
        exact: true,
      });

      await expect(eventName).toBeVisible();

      // 9. Get the counter dynamically
      // NOTE: This assumes the event is displayed in a semantic table row.
      const eventRow = page
        .getByRole('row')
        .filter({ has: eventName });

      const counter = eventRow.getByText(/^\d+$/, { // /^\d+$/ => Regular Expression buat mastiin smua numerical
        exact: true,
      }).last(); // pakai ini => mengambil angka paling akhir

      const counterText = await counter.textContent(); // manggil text yg ada di counter
      const counterValue = Number(counterText?.trim()); // text dijadiin numeric dan trim slain numeric
                                                        //  ? agar value dari counter text > null maka.trim() ga jalan
      // 10. Validate counter >= 88
      expect(Number.isFinite(counterValue)).toBeTruthy(); //mastiin counterValue bukan NaN, Infinity, atau -Infinity
      expect(counterValue).toBeGreaterThanOrEqual(87);
      console.log(`Counter order_completed: ${counterValue}`);

      // 11. Screenshot Event Catalog
      await page.screenshot({
        path: 'test-results/stg_pltv_buffer_6d_event 88 Counter.png',
        fullPage: true,
      });

      // 12. Open Debugger tab
      await page.getByText('Debugger', { exact: true }).click();

      //13. Click event dan munculkan message
      const targetEvent = 'stg_pltv_buffer_6d_event';

      // Locator berdasarkan nama event, bukan posisi atau class CSS.
      const eventLocator = page.getByText(targetEvent, {
        exact: true,
      }); // menentukan target event yg dicari

      // Container scroll yang terlihat pada DevTools.
      const scrollContainer = page.locator('div[tabindex="0"]');

      const maxScrollAttempts = 100; //menentukan jumlah scroll maks
      let found = false;

      for (let i = 0; i < maxScrollAttempts; i++) {//proses pencarian
        if (await eventLocator.count() > 0) {//mastiin event harus > 0 bru dianggep ketemu
          const event = eventLocator.first();//event paling pertama yg sesuai yg dicari

          if (await event.isVisible()) {
            console.log(`Event ditemukan: ${targetEvent}`);
            console.log(`Percobaan ke-${i + 1}`);

            await event.scrollIntoViewIfNeeded();
            await event.click();

            found = true;
            break;
          }
        }

        if (await scrollContainer.count() === 0) {//bakal muncul error klo event yg dicari 0
          throw new Error('Container scroll tidak ditemukan');
        } 

        const previousPosition = await scrollContainer.evaluate(
          (el) => el.scrollTop //membaca posisi scroll
        );//el => elemen container

        const result = await scrollContainer.evaluate((el) => {
          const previous = el.scrollTop;

          el.scrollTop += Math.max(200, el.clientHeight * 0.8);//melakukan scroll terus sampai dapat

          return {
            current: el.scrollTop,
            max: el.scrollHeight - el.clientHeight,
            previous,//mastiin batas sebelum & sesudah di scroll
          };
        });

        await page.waitForTimeout(300);

        //Berhenti jika sudah mencapai akhir.
        const currentPosition = await scrollContainer.evaluate(
          (el) => el.scrollTop
        );

        if (
          currentPosition === previousPosition ||
          result.current === result.previous &&
          result.current >= result.max
        ) {
          break;//verif scroll udah berenti
        }
      }

      if (!found) {
        throw new Error(
          `Event "${targetEvent}" tidak ditemukan setelah scrolling`
        );
      }  
       // Verifikasi payload muncul
      const payload = page.locator('.cm-scroller');

      const messageIdLine = payload
        .locator('.cm-line')
        .filter({ hasText: '"messageId"' });

      await expect(messageIdLine).toBeVisible();

      // 14. Screenshot Debugger
      await page.screenshot({
        path: 'test-results/hightouch-debugger stg_pltv_buffer_6d_event 88 Counter.png',
        fullPage: true,
      });
      // Report ke terminal
    console.log('PASS: Event pltv_buffer_6d_event ditemukan');
    console.log('PASS: Counter event ditemukan dengan nilai >= 88');
    console.log('Screenshot saved: test-results/stg_pltv_buffer_6d_event 88 Counter.png');

   await page.waitForTimeout(5000);
    });

      test('Verify pltv_buffer_6d_event 100 Counter', async ({ page }) => {
      // 1. Open Hightouch
      await page.goto('https://app.hightouch.com/');

      // 2. Open workspace
      await page.getByText('Kredivo-Dev', { exact: true }).click();

      // 3. Open Event Collection
      await page.getByText('Event Collection', { exact: true }).click();

      // 4. Open Event sources
      await page.getByText('Event sources', { exact: true }).click();

      await expect(page).toHaveURL(
        'https://app.hightouch.com/fti-kredivo-dev/events/sources'
      );

      // 5. Select HTTP CRM API
      await page.getByText('HTTP CRM API (crm)', { exact: true }).click();

      // 6. Open Event catalog
      await page.getByText('Event catalog', { exact: true }).click();

      // 7. Select 3-day time range
     // await page.getByText('3d', { exact: true }).click();

      // 8. Find event pltv_buffer_6d_event
      const eventName = page.getByText('stg_pltv_buffer_6d_event', {
        exact: true,
      });

      await expect(eventName).toBeVisible();

      // 9. Get the counter dynamically
      // NOTE: This assumes the event is displayed in a semantic table row.
      const eventRow = page
        .getByRole('row')
        .filter({ has: eventName });

      const counter = eventRow.getByText(/^\d+$/, { // /^\d+$/ => Regular Expression buat mastiin smua numerical
        exact: true,
      }).last(); // pakai ini => mengambil angka paling akhir

      const counterText = await counter.textContent(); // manggil text yg ada di counter
      const counterValue = Number(counterText?.trim()); // text dijadiin numeric dan trim slain numeric
                                                        //  ? agar value dari counter text > null maka.trim() ga jalan
      // 10. Validate counter >= 188
      expect(Number.isFinite(counterValue)).toBeTruthy(); //mastiin counterValue bukan NaN, Infinity, atau -Infinity
      expect(counterValue).toBeGreaterThanOrEqual(188);
      console.log(`Counter order_completed: ${counterValue}`);

      // 11. Screenshot Event Catalog
      await page.screenshot({
        path: 'test-results/stg_pltv_buffer_6d_event 188 Counter.png',
        fullPage: true,
      });

      // 12. Open Debugger tab
      await page.getByText('Debugger', { exact: true }).click();

      //13. Click event dan munculkan message
      const targetEvent = 'stg_pltv_buffer_6d_event';

      // Locator berdasarkan nama event, bukan posisi atau class CSS.
      const eventLocator = page.getByText(targetEvent, {
        exact: true,
      }); // menentukan target event yg dicari

      // Container scroll yang terlihat pada DevTools.
      const scrollContainer = page.locator('div[tabindex="0"]');

      const maxScrollAttempts = 100; //menentukan jumlah scroll maks
      let found = false;

      for (let i = 0; i < maxScrollAttempts; i++) {//proses pencarian
        if (await eventLocator.count() > 0) {//mastiin event harus > 0 bru dianggep ketemu
          const event = eventLocator.first();//event paling pertama yg sesuai yg dicari

          if (await event.isVisible()) {
            console.log(`Event ditemukan: ${targetEvent}`);
            console.log(`Percobaan ke-${i + 1}`);

            await event.scrollIntoViewIfNeeded();
            await event.click();

            found = true;
            break;
          }
        }

        if (await scrollContainer.count() === 0) {//bakal muncul error klo event yg dicari 0
          throw new Error('Container scroll tidak ditemukan');
        } 

        const previousPosition = await scrollContainer.evaluate(
          (el) => el.scrollTop //membaca posisi scroll
        );//el => elemen container

        const result = await scrollContainer.evaluate((el) => {
          const previous = el.scrollTop;

          el.scrollTop += Math.max(200, el.clientHeight * 0.8);//melakukan scroll terus sampai dapat

          return {
            current: el.scrollTop,
            max: el.scrollHeight - el.clientHeight,
            previous,//mastiin batas sebelum & sesudah di scroll
          };
        });

        await page.waitForTimeout(300);

        //Berhenti jika sudah mencapai akhir.
        const currentPosition = await scrollContainer.evaluate(
          (el) => el.scrollTop
        );

        if (
          currentPosition === previousPosition ||
          result.current === result.previous &&
          result.current >= result.max
        ) {
          break;//verif scroll udah berenti
        }
      }

      if (!found) {
        throw new Error(
          `Event "${targetEvent}" tidak ditemukan setelah scrolling`
        );
      }  
       // Verifikasi payload muncul
      const payload = page.locator('.cm-scroller');

      const messageIdLine = payload
        .locator('.cm-line')
        .filter({ hasText: '"messageId"' });

      await expect(messageIdLine).toBeVisible();

      // 14. Screenshot Debugger
      await page.screenshot({
        path: 'test-results/hightouch-debugger stg_pltv_buffer_6d_event 188 Counter.png',
        fullPage: true,
      });
      // Report ke terminal
    console.log('PASS: Event pltv_buffer_6d_event ditemukan');
    console.log('PASS: Counter event ditemukan dengan nilai >= 188');
    console.log('Screenshot saved: test-results/stg_pltv_buffer_6d_event 188 Counter.png');

   await page.waitForTimeout(5000);
    });
    

    });

});






















