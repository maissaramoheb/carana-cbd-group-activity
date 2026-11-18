const assert=require('node:assert/strict');
module.exports=async function advance(page,selector){
 await page.locator(selector).click();
 const reminder=page.locator('.exploration-reminder');
 if(await reminder.count() && await reminder.isVisible()){
  assert.match(await reminder.innerText(),/not a knowledge check/);
  await page.locator('.exploration-anyway').click();
 }
};
