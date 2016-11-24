import React from 'react';
import { Match, Link } from 'react-router';

class Filter extends React.Component {
  constructor(props, context) {
    super(props);
    this.state = {
      filter: '',
      address: null,
      channel: null,
      contentID: null
    };


    this.setFilter = this.setFilter.bind(this);
    this.resetFilter = this.resetFilter.bind(this);
  }

  resetFilter(props) {
    var filter = '';
    if (props.type == 'channel') {
      filter = '#' + props.value;
    }
    else if (props.type == 'address') {
      filter = props.value;
    }
    this.setState({
      originalFilter: filter,
      filter: filter,
      channel: null,
      address: null
    });
  }

  componentWillReceiveProps(nextProps) {
    this.resetFilter(nextProps);
  }

  componentDidMount() {
    this.resetFilter(this.props);
  }

  setFilter(e) {
    var filter = e.target.value;

    var options = [];
    var channelMatch = filter.match(/(?:#)?([0-9a-zA-Z_]{3,30})/);
    var addressMatch = filter.match(/(?:0x)?([0-9a-fA-F]{40})/);

    var channel = null;
    var address = null;

    if (channelMatch) {
      if (filter.length < 31) {
        channel = channelMatch[1];
      }
    }

    if (addressMatch) {
      address = addressMatch[1];
    }

    this.setState({
      filter: filter,
      channel: channel,
      address: address
    });
  }

  render() {
    return (
      <div id='filter' style={{width: '100%'}}>
        <div style={{backgroundColor: 'white'}}>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <div
              onFocus={() => {this.setState({'keying': true})}}
              onBlur={() => {this.setState({'keying': false, filter: this.state.originalFilter})}}
              style={{padding: '.5em', maxHeight: this.state.keying ? '6.5em' : '2em', overflow: 'hidden'}} id='suggestions'>
              <input
                id='filterInput'
                onFocus={() => {if (!this.state.keying) { this.setState({filter: ''})}}}
                type='text' placeholder='Filter content' id='filter' value={this.state.filter} onChange={this.setFilter}
              style={{
                backgroundColor: 'transparent',
                fontSize: '1em',
                padding: '.5em',
                margin: 0,
                border: 0,
                borderRadius: 0,
                boxShadow: 'none',
                borderLeft: 0,
                backgroundColor: 'white',
                outline: 0,
                width: '100%',
                color: 'black'
              }}></input>
              <Link
                onClick={() => this.setState({originalFilter: `#${this.state.channel}`})}
                id='channelResult'
                to={`/channel/${this.state.channel}`}
              style={{
                display: this.state.channel != null ? 'inline-block' : 'none',
                padding: '.5em',
                textDecoration: 'none',
                color: 'purple',
                fontWeight: 'bold'
              }}>{`#${this.state.channel}`}</Link>
              <Link
                onClick={() => this.setState({originalFilter: `0x${this.state.address}`})}
                id='addressResult'
                to={`/address/0x${this.state.address}`}
              style={{
                display: this.state.address != null ? 'inline-block' : 'none',
                padding: '.5em',
                textDecoration: 'none',
                color: 'purple',
                fontWeight: 'bold'
              }}>{`0x${this.state.address}`}</Link>
              <div style={{
                fontStyle: 'italic',
                padding: '.5em',
                display: (this.state.channel == null && this.state.address == null) ? 'block' : 'none'
              }}>Enter an address or channel</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Filter.contextTypes = {
  history: React.PropTypes.object
};

export default Filter;
