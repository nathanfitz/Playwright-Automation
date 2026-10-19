import {test, expect} from '@playwright/test'

test ('orange create admin', async({page}) => {
await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
await page.waitForTimeout(3000);
await page.getByRole ('textbox',)



});