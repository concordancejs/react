import test from 'ava'
import concordance from 'concordance'
import React from 'react'
import renderer from 'react-test-renderer'

import plugin from '..'
import HelloMessage, {MemoizedHelloMessage} from './fixtures/react/HelloMessage'

const plugins = [plugin]
const render = value => renderer.create(value).toJSON()

const compare = (t, getSame, getOther) => {
  t.true(concordance.compare(getSame(), getSame(), {plugins}).pass)
  t.false(concordance.compare(getSame(), getOther(), {plugins}).pass)
}
compare.title = prefix => `compares ${prefix}`
const compareRendered = (t, getSame, getOther) => {
  t.true(concordance.compare(render(getSame()), render(getSame()), {plugins}).pass)
  t.false(concordance.compare(render(getSame()), render(getOther()), {plugins}).pass)
}
compareRendered.title = prefix => `compares rendered ${prefix}`

const macros = [compare, compareRendered]

test('properties of react elements', macros,
  () => <HelloMessage name='John' />,
  () => <HelloMessage name='Olivia' />)

test('react elements', macros,
  () => React.createElement('Foo'),
  () => React.createElement('Bar'))

test('memoized elements', macros,
  () => <MemoizedHelloMessage name='John' />,
  () => <MemoizedHelloMessage name='Olivia' />)

test('different memoizations are equal', t => {
  const SecondHelloMessage = React.memo(HelloMessage)
  t.true(concordance.compare(<MemoizedHelloMessage name='John' />, <SecondHelloMessage name='John' />, {plugins}).pass)
})

test('fragments', macros,
  () => <React.Fragment><HelloMessage name='John' /></React.Fragment>,
  () => <React.Fragment><HelloMessage name='Olivia' /></React.Fragment>)

test('compare rendered elements against an expected React tree', t => {
  const actual = <HelloMessage name='John' />
  const expected = <div>Hello <mark>John</mark></div>
  t.true(concordance.compare(render(actual), expected, {plugins}).pass)
})

test('compares component functions', t => {
  const actual = <HelloMessage name='John' />
  class Faux extends React.Component {}
  Faux.displayName = 'HelloMessage'
  const expected = <Faux name='John' />
  t.false(concordance.compare(actual, expected, {plugins}).pass)
})
