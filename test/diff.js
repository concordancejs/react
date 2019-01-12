import test from 'ava'
import concordance from 'concordance'
import React from 'react'
import renderer from 'react-test-renderer'

import plugin from '..'
import HelloMessage from './fixtures/react/HelloMessage'

const plugins = [plugin]

const diff = (t, getSame, getOther, options) => {
  t.snapshot(concordance.diff(getSame(), getOther(), Object.assign({plugins}, options)))
}
diff.title = prefix => `diffs ${prefix}`
const diffRendered = (t, getSame, getOther, options) => {
  const render = value => renderer.create(value).toJSON()
  t.snapshot(concordance.diff(render(getSame()), render(getOther()), Object.assign({plugins}, options)))
}
diffRendered.title = prefix => `diffs rendered ${prefix}`

const macros = [diff, diffRendered]

test('property differences between react elements', macros,
  () => <HelloMessage name='John' />,
  () => <HelloMessage name='Olivia' />)

test('react elements', macros,
  () => <strong>arm</strong>,
  () => <em>arm</em>)

test('fragments', macros,
  () => <React.Fragment><HelloMessage name='John' /></React.Fragment>,
  () => <React.Fragment><HelloMessage name='Olivia' /></React.Fragment>)

test('object properties', macros,
  () => React.createElement('Foo', {object: {baz: 'thud'}}),
  () => React.createElement('Foo', {object: {baz: 'qux'}}))

test('array values in object properties', macros,
  () => React.createElement('Foo', {object: {baz: ['thud']}}),
  () => React.createElement('Foo', {object: {baz: ['qux']}}))

test('array values in object properties in children', macros,
  () => {
    return React.createElement('Foo', null, React.createElement('Bar', {object: {baz: ['thud']}}))
  },
  () => {
    return React.createElement('Foo', null, React.createElement('Bar', {object: {baz: ['qux']}}))
  })

test('same name, different component function', t => {
  const actual = <HelloMessage name='John' />
  class Faux extends React.Component {}
  Faux.displayName = 'HelloMessage'
  const expected = <Faux name='John' />
  t.snapshot(concordance.diff(actual, expected, {plugins}))
})

test('multiline string properties', macros,
  () => React.createElement('Foo', {multiline: 'foo\nbar'}),
  () => React.createElement('Foo', {multiline: 'foo\nbaz'}))

test('string and number children', macros,
  () => React.createElement('div', null, 'foo', 'bar', 42),
  () => React.createElement('div', null, 'foo bar', 39))

test('both have properties and children, same name', macros,
  () => React.createElement('Foo', {foo: 'bar'}, React.createElement('Bar')),
  () => React.createElement('Foo', {baz: 'thud'}, React.createElement('Baz')))

test('both have properties and children, different names', macros,
  () => React.createElement('Foo', {foo: 'bar'}, React.createElement('Bar')),
  () => React.createElement('Qux', {baz: 'thud'}, React.createElement('Baz')))

test('both have properties, first has children, same name', macros,
  () => React.createElement('Foo', {foo: 'bar'}, React.createElement('Bar')),
  () => React.createElement('Foo', {baz: 'thud'}))

test('both have properties, second has children, same name', macros,
  () => React.createElement('Foo', {foo: 'bar'}),
  () => React.createElement('Foo', {baz: 'thud'}, React.createElement('Baz')))

test('both have properties, neither has children, same name', macros,
  () => React.createElement('Foo', {foo: 'bar'}),
  () => React.createElement('Foo', {baz: 'thud'}))

test('first has properties, both have children, same name', macros,
  () => React.createElement('Foo', {foo: 'bar'}, React.createElement('Bar')),
  () => React.createElement('Foo', null, React.createElement('Baz')))

test('first has properties, both have children, different names', macros,
  () => React.createElement('Foo', {foo: 'bar'}, React.createElement('Bar')),
  () => React.createElement('Qux', null, React.createElement('Baz')))

test('first has properties, first has children, same name', macros,
  () => React.createElement('Foo', {foo: 'bar'}, React.createElement('Bar')),
  () => React.createElement('Foo'))

test('first has properties, second has children, same name', macros,
  () => React.createElement('Foo', {foo: 'bar'}),
  () => React.createElement('Foo', null, React.createElement('Baz')))

test('first has properties, neither has children, same name', macros,
  () => React.createElement('Foo', {foo: 'bar'}),
  () => React.createElement('Foo'))

test('second has properties, both have children, same name', macros,
  () => React.createElement('Foo', null, React.createElement('Bar')),
  () => React.createElement('Foo', {baz: 'thud'}, React.createElement('Baz')))

test('second has properties, both have children, different names', macros,
  () => React.createElement('Foo', null, React.createElement('Bar')),
  () => React.createElement('Qux', {baz: 'thud'}, React.createElement('Baz')))

test('second has properties, first has children, same name', macros,
  () => React.createElement('Foo', null, React.createElement('Bar')),
  () => React.createElement('Foo', {baz: 'thud'}))

test('second has properties, second has children, same name', macros,
  () => React.createElement('Foo'),
  () => React.createElement('Foo', {baz: 'thud'}, React.createElement('Baz')))

test('second has properties, neither has children, same name', macros,
  () => React.createElement('Foo'),
  () => React.createElement('Foo', {baz: 'thud'}))

test('neither have properties, both have children, same name', macros,
  () => React.createElement('Foo', null, React.createElement('Bar')),
  () => React.createElement('Foo', null, React.createElement('Baz')))

test('neither have properties, both have children, different names', macros,
  () => React.createElement('Foo', null, React.createElement('Bar')),
  () => React.createElement('Qux', null, React.createElement('Baz')))

test('neither have properties, first has children, same name', macros,
  () => React.createElement('Foo', null, React.createElement('Bar')),
  () => React.createElement('Foo'))

test('neither have properties, second has children, same name', macros,
  () => React.createElement('Foo'),
  () => React.createElement('Foo', null, React.createElement('Baz')))

test('neither have properties, neither has children, same name', macros,
  () => React.createElement('Foo'),
  () => React.createElement('Foo'))

test('max depth', macros,
  () => (
    <div>
      <div>
        <div>
          Hello
        </div>
        <div id='foo'>Hello</div>
        <br id='bar'/>
        <br/>
        <section>
          <div>
            Foo
          </div>
        </section>
      </div>
    </div>
  ),
  () => (
    <div>
      <div>
        <div>
          Hello
        </div>
        <div id='foo'>Hello</div>
        <br id='bar'/>
        <br/>
        <section>
          <div>
            Bar
          </div>
        </section>
      </div>
    </div>
  ),
  {maxDepth: 2})
