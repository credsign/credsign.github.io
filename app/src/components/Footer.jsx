import React from 'react';

class Footer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div style={{position: 'absolute', bottom: '0', width: '100%'}}>
        <div style={{
          width: '100%',
          backgroundColor: '#fafafa',
          borderTop: '1px solid #DDD',
          color: 'dimgray',
          height: '1em',
          padding: '1em 0',
          zIndex: 10
        }}>
          <div style={{
            fontSize: '69%',
            textTransform: 'uppercase',
            textAlign: 'center'
          }}>
            <a href='https://github.com/channel/channel.github.io/issues'>Issues</a>
            <span>{' · '}</span>
            <a href='https://github.com/channel/channel.github.io'>Source</a>
            <span>{' · '}</span>
            <a href='https://github.com/channel/channel.github.io/blob/master/LICENSE'>Terms</a>
          </div>
        </div>
      </div>
    );
  }
}

export default Footer;