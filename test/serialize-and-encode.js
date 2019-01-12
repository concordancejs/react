import test from 'ava'
import {compareDescriptors, describe, deserialize, formatDescriptor, serialize} from 'concordance'

import React from 'react'
import renderer from 'react-test-renderer'

import plugin from '..'
import HelloMessage from './fixtures/react/HelloMessage'

const plugins = [plugin]

const useDeserialized = (t, getValue) => {
  const original = describe(getValue(), {plugins})

  const buffer = serialize(original)
  const deserialized = deserialize(buffer, {plugins})
  t.true(
    compareDescriptors(deserialized, original),
    'the deserialized descriptor equals the original')
  t.is(
    formatDescriptor(deserialized, {plugins}),
    formatDescriptor(original, {plugins}),
    'the deserialized descriptor is formatted like the original')

  const redeserialized = deserialize(serialize(deserialized), {plugins})
  t.true(
    compareDescriptors(redeserialized, original),
    'after serializing and deserializing it again, the deserialized descriptor equals the original')
  t.is(
    formatDescriptor(redeserialized, {plugins}),
    formatDescriptor(original, {plugins}),
    'after serializing and deserializing it again, the deserialized descriptor is formatted like the original')

  t.true(
    compareDescriptors(redeserialized, deserialized),
    'deserialized descriptors equal each other')
}

useDeserialized.title = prefix => `deserialized ${prefix} is equivalent to the original`

const useDeserializedRendered = (t, getValue) => {
  return useDeserialized(t, () => renderer.create(getValue()).toJSON())
}
useDeserializedRendered.title = prefix => `deserialized rendered ${prefix} is equivalent to the original`

const macros = [useDeserialized, useDeserializedRendered]

test('react elements', macros, () => <HelloMessage name='John' />)
// TODO: Combine next two tests with `macros` array
test.failing('memoized react elements', useDeserialized, () => {
  const MemoizedHelloMessage = React.memo(HelloMessage)
  return <MemoizedHelloMessage name='John' />
})
test('memoized react elements', useDeserializedRendered, () => {
  const MemoizedHelloMessage = React.memo(HelloMessage)
  return <MemoizedHelloMessage name='John' />
})
test('fragments', macros, () => <React.Fragment><HelloMessage name='John' /></React.Fragment>)
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
