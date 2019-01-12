import React from 'react'

class NameHighlight extends React.Component {
  render () {
    return <mark>{this.props.name}</mark>
  }
}

export default class HelloMessage extends React.Component {
  render () {
    return <div>Hello <NameHighlight name={this.props.name} /></div>
  }
}

export const MemoizedHelloMessage = React.memo(HelloMessage)
