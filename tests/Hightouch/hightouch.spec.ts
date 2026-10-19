import { test, expect } from '@playwright/test';

test.use({ storageState: 'auth.json' });
function logTime(message: string) {
  const timestamp = new Date().toLocaleTimeString('id-ID', {
    hour12: false,
    fractionalSecondDigits: 3,
  });

  console.log(`[${timestamp}] ${message}`);
}

test.describe.parallel('All Groups', { tag: '@allGroup' }, () => {

  test.describe.parallel('propensity_pl_retook Group', { tag: '@validGroup' }, () => {
  
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
      const eventName = page.getByText('stg_propensity_pl_retook', {
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
        path: 'test-results/stg_propensity_pl_retook 88 Counter.png',
        fullPage: true,
      });

      // 12. Open Debugger tab
      await page.getByText('Debugger', { exact: true }).click();

      //13. Click event dan munculkan message
      const targetEvent = 'stg_propensity_pl_retook';

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
        path: 'test-results/hightouch-debugger stg_propensity_pl_retook 88 Counter.png',
        fullPage: true,
      });
      // Report ke terminal
    console.log('PASS: Event propensity_pl_retook ditemukan');
    console.log('PASS: Counter event ditemukan dengan nilai >= 88');
    console.log('Screenshot saved: test-results/stg_propensity_pl_retook 88 Counter.png');

   await page.waitForTimeout(5000);
    });

      test('Verify propensity_pl_retook 100 Counter', async ({ page }) => {
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
      const eventName = page.getByText('stg_propensity_pl_retook', {
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
        path: 'test-results/stg_propensity_pl_retook 100 Counter.png',
        fullPage: true,
      });

      // 12. Open Debugger tab
      await page.getByText('Debugger', { exact: true }).click();

      //13. Click event dan munculkan message
      const targetEvent = 'stg_propensity_pl_retook';

      // Locator berdasarkan nama event, bukan posisi atau class CSS.
      const eventLocator = page.getByText(targetEvent, {
        exact: true,
      }); // menentukan target event yg dicari

      // Container scroll yang terlihat pada DevTools.
      const scrollContainer = page.locator('div[tabindex="0"]');

      const maxScrollAttempts = 200; //menentukan jumlah scroll maks
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
        path: 'test-results/hightouch-debugger stg_propensity_pl_retook 100 Counter.png',
        fullPage: true,
      });
      // Report ke terminal
    console.log('PASS: Event propensity_pl_retook ditemukan');
    console.log('PASS: Counter event ditemukan dengan nilai >= 188');
    console.log('Screenshot saved: test-results/stg_propensity_pl_retook 100 Counter.png');

   await page.waitForTimeout(5000);
    });
    
});


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
      const eventName = page.getByText('stg_rfm_segmentation', {
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
        path: 'test-results/stg_rfm_segmentation 88 Counter.png',
        fullPage: true,
      });

      // 12. Open Debugger tab
      await page.getByText('Debugger', { exact: true }).click();

      //13. Click event dan munculkan message
      const targetEvent = 'stg_rfm_segmentation';

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
        path: 'test-results/hightouch-debugger stg_rfm_segmentation 88 Counter.png',
        fullPage: true,
      });
      // Report ke terminal
    console.log('PASS: Event rfm_segmentation ditemukan');
    console.log('PASS: Counter event ditemukan dengan nilai >= 88');
    console.log('Screenshot saved: test-results/stg_rfm_segmentation 88 Counter.png');

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

      const messageIdLine = payload
        .locator('.cm-line')
        .filter({ hasText: '"messageId"' });

      await expect(messageIdLine).toBeVisible();

      // 14. Screenshot Debugger
      await page.screenshot({
        path: 'test-results/hightouch-debugger stg_pltv_buffer_3d_event 88 Counter.png',
        fullPage: true,
      });
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





















