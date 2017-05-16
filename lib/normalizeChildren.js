'use strict'

const arrify = require('arrify')
const flattenDeep = require('lodash.flattendeep')

function escapeText (text) {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // TODO: Escape characters that Concordance would otherwise replace with \u
    // sequences.
}

function normalizeChildren (children) {
  return flattenDeep(arrify(children))
    .reduceRight((acc, child, index) => {
      const type = typeof child
      if (child !== null && type === 'object') {
        if (acc.buffer !== '') {
          acc.children.unshift(acc.buffer)
          acc.buffer = ''
        }
        acc.children.unshift(child)
      } else if (type === 'string' || type === 'number') {
        const text = escapeText(String(child))
        const infix = acc.buffer === '' || /^\s/.test(acc.buffer) || /\s$/.test(text)
          ? ''
          : ' '
        acc.buffer = text + infix + acc.buffer
      }

      if (index === 0 && acc.buffer !== '') {
        acc.children.unshift(acc.buffer)
      }

      return acc
    }, {children: [], buffer: ''})
    .children
}
module.exports = normalizeChildren
