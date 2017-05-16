import test from 'ava'
import concordance from 'concordance'
import React from 'react'
import renderer from 'react-test-renderer'

import plugin from '../'
import HelloMessage from './fixtures/react/HelloMessage'

const plugins = [plugin]
const format = value => concordance.format(value, {plugins})

const snapshot = (t, getValue) => {
  t.snapshot(format(getValue()))
}
snapshot.title = prefix => `formats ${prefix}`
const snapshotRendered = (t, getValue) => {
  const tree = renderer.create(getValue()).toJSON()
  t.snapshot(format(tree))
}
snapshotRendered.title = prefix => `formats rendered ${prefix}`

const macros = [snapshot, snapshotRendered]

test('react elements', macros, () => <HelloMessage name='John' />)
test('object properties', macros, () => {
  return React.createElement('Foo', {object: {baz: 'thud'}})
})
test('array values in object properties', macros, () => {
  return React.createElement('Foo', {object: {baz: ['thud']}})
})
test('array values in object properties in children', macros, () => {
  return React.createElement('Foo', null, React.createElement('Bar', {key: 'bar', object: {baz: ['thud']}}))
})
test('multiline string properties', macros, () => {
  return React.createElement('Foo', {multiline: 'foo\nbar'})
})
test('illegal spaces in property names', macros, () => {
  return React.createElement('Foo', {'foo bar': 'baz'})
})
test('concatenated string and number children', macros, () => {
  return React.createElement('div', null, 'foo', 'bar', 42)
})
test('concatenated string children (no space insertion)', macros, () => {
  return React.createElement('div', null, 'foo\n', 'bar', ' baz')
})
test('properties and children', macros, () => {
  return React.createElement('Foo', {foo: 'bar'}, 'baz')
})
