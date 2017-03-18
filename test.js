import test from 'ava';
import requireFromString from 'require-from-string';
import {
  buildDefault,
  buildWithParser,
  buildWithCssModules,
  buildCombinedStyles,
  buildExtract
} from './tests/build';

test('test postcss', async t => {
  const data = await buildDefault().catch(err => console.log(err.stack));
  requireFromString(data);
  const styles = window.getComputedStyle(document.body);
  t.is(styles.margin, '0px');
});

test('use sugarss as parser', async t => {
  const data = await buildWithParser().catch(err => console.log(err.stack));
  requireFromString(data);
  const styles = window.getComputedStyle(document.body);
  t.is(styles.fontSize, '20px');
});

test('use cssmodules', async t => {
  const data = await buildWithCssModules().catch(err => console.log(err.stack));
  const exported = requireFromString(data);
  t.regex(exported.trendy, /trendy_/);
});

test('combine styles', async t => {
  const data = await buildCombinedStyles().catch(err => console.log(err.stack));
  requireFromString(data);
  const styles = window.getComputedStyle(document.body);
  t.is(styles.margin, '0px');
  t.is(styles.fontSize, '20px');
})

test('extract css', async t => {
  const data = await buildExtract().catch(err => console.log(err.stack));
  
})
