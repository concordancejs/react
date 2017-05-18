'use strict'

const diffShallow = require('./diffShallow')
const normalizeChildren = require('./normalizeChildren')

const tag = Symbol('@concordance/react.ElementValue')

function themeProperty (theme) {
  theme.property.separator = theme.react.attribute.separator + theme.react.attribute.value.openBracket
  theme.property.after = theme.react.attribute.value.closeBracket
  theme.property.increaseValueIndent = true
}

function themeStringProperty (theme) {
  theme.property.separator = theme.react.attribute.separator
  theme.property.after = ''
  Object.assign(theme.string.line, theme.react.attribute.value.string.line)
}

function themeChild (theme) {
  theme.item.after = ''
}

function themeStringChild (theme) {
  theme.item.after = ''
  Object.assign(theme.string, theme.react.child.string)
}

function factory (api, text) {
  function describe (props) {
    const element = props.value

    const type = element.type
    const hasTypeFn = typeof type === 'function'
    const typeFn = hasTypeFn ? type : null
    const name = hasTypeFn ? type.displayName || type.name : type

    const children = normalizeChildren(element.props.children)

    const properties = Object.assign({}, element.props)
    delete properties.children
    if (element.key !== null) {
      properties.key = element.key
    }
    const hasProperties = Object.keys(properties).length > 0

    return new DescribedElementValue(Object.assign({
      children,
      hasProperties,
      hasTypeFn,
      name,
      properties,
      typeFn,
      isList: children.length > 0
    }, props))
  }

  function deserialize (state, recursor) {
    return new DeserializedElementValue(state, recursor)
  }

  class ElementValue extends api.ObjectValue {
    constructor (props) {
      super(props)
      this.name = props.name
      this.hasProperties = props.hasProperties
      this.hasTypeFn = props.hasTypeFn

      this.hasChildren = this.isList
    }

    compare (expected) {
      return this.tag === expected.tag && this.name === expected.name
        ? api.SHALLOW_EQUAL
        : api.UNEQUAL
    }

    formatName (theme) {
      const formatted = api.wrapFromTheme(theme.react.tagName, this.name)
      return this.hasTypeFn
        ? formatted + theme.react.functionType
        : formatted
    }

    compareNames (expected) {
      return this.name === expected.name && this.hasTypeFn === expected.hasTypeFn
    }

    formatShallow (theme, indent) {
      const childBuffer = api.lineBuilder.buffer()
      const propertyBuffer = api.lineBuilder.buffer()

      return {
        append (formatted, origin) {
          if (origin.isItem === true) {
            childBuffer.append(formatted)
          } else {
            propertyBuffer.append(formatted)
          }
        },

        finalize: () => {
          const name = this.formatName(theme)
          const openTag = theme.react.openTag

          if (!this.hasChildren && !this.hasProperties) {
            return api.lineBuilder.single(openTag.start + name + openTag.selfCloseVoid + openTag.end)
          }

          const innerIndentation = indent.increase()
          const children = childBuffer.withFirstPrefixed(innerIndentation).stripFlags()
          const properties = propertyBuffer.withFirstPrefixed(innerIndentation).stripFlags()

          const result = api.lineBuilder.buffer()
          if (this.hasProperties) {
            result
              .append(api.lineBuilder.first(openTag.start + name))
              .append(properties)

            if (this.hasChildren) {
              result.append(api.lineBuilder.line(indent + openTag.end))
            } else {
              result.append(api.lineBuilder.last(indent + openTag.selfClose + openTag.end))
            }
          } else {
            result.append(api.lineBuilder.first(openTag.start + name + openTag.end))
          }

          if (this.hasChildren) {
            result
              .append(children)
              .append(api.lineBuilder.last(indent + api.wrapFromTheme(theme.react.closeTag, name)))
          }

          return result
        },

        shouldFormat (subject) {
          return subject.isItem === true || subject.isProperty === true
        },

        increaseIndent: true
      }
    }

    prepareDiff (expected) {
      return {
        compareResult: this.tag === expected.tag
          ? api.SHALLOW_EQUAL
          : api.UNEQUAL
      }
    }

    diffShallow (expected, theme, indent) {
      return diffShallow(api, this, expected, theme, indent)
    }

    serialize () {
      return [this.name, this.hasProperties, this.hasTypeFn, super.serialize()]
    }
  }
  Object.defineProperty(ElementValue.prototype, 'tag', {value: tag})

  function modifyThemes (recursor) {
    return api.mapRecursor(recursor, next => {
      let modifier
      if (next.isItem === true) {
        if (next.tag === api.descriptorTags.primitiveItem && next.value.tag === api.descriptorTags.string) {
          modifier = themeStringChild
        } else {
          modifier = themeChild
        }
      } else if (next.isProperty === true) {
        if (
          next.tag === api.descriptorTags.primitiveProperty &&
          next.value.tag === api.descriptorTags.string &&
          !next.value.includesLinebreaks
        ) {
          modifier = themeStringProperty
        } else {
          modifier = themeProperty
        }
      }

      return modifier
        ? api.modifyTheme(next, modifier)
        : next
    })
  }

  function DescribedMixin (base) {
    return class extends api.DescribedMixin(base) {
      constructor (props) {
        super(props)
        this.children = props.children
        this.properties = props.properties
        this.typeFn = props.typeFn
      }

      compare (expected) {
        const result = super.compare(expected)
        return result === api.SHALLOW_EQUAL && this.typeFn !== expected.typeFn
          ? api.UNEQUAL
          : result
      }

      compareNames (expected) {
        return super.compareNames(expected) && this.typeFn === expected.typeFn
      }

      createPropertyRecursor () {
        // Symbols are not valid property keys for React elements. This code
        // also assumes that the keys can be formatted as JSX-like attribute
        // names. Keys are not pre-escaped before being passed to Concordance's
        // property descriptor.
        const keys = Object.keys(this.properties).sort()
        const size = keys.length

        let index = 0
        const next = () => {
          if (index === size) return null

          const key = keys[index++]
          // Note that string values are not specifically escaped such that the
          // output is valid JSX.
          return this.describeProperty(key, this.describeAny(this.properties[key]))
        }

        return {size, next}
      }

      createListRecursor () {
        if (!this.isList) return super.createListRecursor()

        const size = this.children.length

        let index = 0
        const next = () => {
          if (index === size) return null

          const current = index++
          return this.describeItem(current, this.describeAny(this.children[current]))
        }

        return {size, next}
      }

      createRecursor () {
        return modifyThemes(super.createRecursor())
      }
    }
  }

  function DeserializedMixin (base) {
    return class extends api.DeserializedMixin(base) {
      constructor (state, recursor) {
        super(state[3], recursor)
        this.name = state[0]
        this.hasProperties = state[1]
        this.hasTypeFn = state[2]
      }

      createRecursor () {
        return modifyThemes(super.createRecursor())
      }
    }
  }

  const DescribedElementValue = DescribedMixin(ElementValue)
  const DeserializedElementValue = DeserializedMixin(ElementValue)

  return {
    DescribedMixin,
    DeserializedMixin,
    ElementValue,
    describe,
    deserialize,
    tag
  }
}
module.exports = factory