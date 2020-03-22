import test from 'ava'
import concordance from 'concordance'
import React from 'react'
import renderer from 'react-test-renderer'

import plugin from '..'
import HelloMessage from './fixtures/react/HelloMessage'

const plugins = [plugin]
const format = (value, options) => concordance.format(value, Object.assign({ plugins }, options))

const snapshot = (t, getValue, options) => {
  t.snapshot(format(getValue(), options))
}
snapshot.title = prefix => `formats ${prefix}`
const snapshotRendered = (t, getValue, options) => {
  const tree = renderer.create(getValue()).toJSON()
  t.snapshot(format(tree, options))
}
snapshotRendered.title = prefix => `formats rendered ${prefix}`

const macros = [snapshot, snapshotRendered]

test('react elements', macros, () => <HelloMessage name='John' />)
test('fragments', macros, () => <React.Fragment><HelloMessage name='John' /></React.Fragment>)
test('object properties', macros, () => {
  return React.createElement('Foo', { object: { baz: 'thud' } })
})
test('array values in object properties', macros, () => {
  return React.createElement('Foo', { object: { baz: ['thud'] } })
})
test('array values in object properties in children', macros, () => {
  return React.createElement('Foo', null, React.createElement('Bar', { key: 'bar', object: { baz: ['thud'] } }))
})
test('multiline string properties', macros, () => {
  return React.createElement('Foo', { multiline: 'foo\nbar' })
})
test('illegal spaces in property names', macros, () => {
  return React.createElement('Foo', { 'foo bar': 'baz' })
})
test('string and number children', macros, () => {
  return React.createElement('div', null, 'foo', 'bar', 42)
})
test('properties and children', macros, () => {
  return React.createElement('Foo', { foo: 'bar' }, 'baz')
})

test('max depth', macros, () => {
  return (
    <div>
      <div>
        <div>
          Hello
        </div>
        <div id='foo'>Hello</div>
        <br id='bar'/>
        <br/>
      </div>
    </div>
  )
}, { maxDepth: 2 })

test('single line attribute values', snapshot, () => {
  return React.createElement('Foo', { bool: true })
})

test('opaque children', snapshot, () => {
  return (
    <div>
      {true}
      {-0}
      {() => {}}
      {new Set(['foo'])}
    </div>
  )
})
