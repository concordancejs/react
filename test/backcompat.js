import test from 'ava'
import {compareDescriptors, describe, deserialize} from 'concordance'

import React from 'react'

import plugin from '..'
import HelloMessage from './fixtures/react/HelloMessage'

const plugins = [plugin]

const equalsSerialization = (t, buffer, getValue) => {
  const expected = describe(getValue(), {plugins})

  const deserialized = deserialize(buffer, {plugins})
  t.true(
    compareDescriptors(deserialized, expected),
    'the deserialized descriptor equals the expected value')
}

test('element serialization before React.memo support was added',
  equalsSerialization,
  Buffer.from('AwAfAAAAAQERARJAY29uY29yZGFuY2UvcmVhY3QBAgEBAQEBAlwAAABiAAAAEwEFEBEBDEhlbGxvTWVzc2FnZQ8PEwEGEQEGT2JqZWN0AQERAQZPYmplY3QQEBAAAQ0AAQEAAQ8AEwECFAEDAAEFEQEEbmFtZRQBAwABBREBBEpvaG4=', 'base64'), // eslint-disable-line max-len
  () => <HelloMessage name='John' />
)
