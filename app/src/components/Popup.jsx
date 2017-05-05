import React from 'react';

class Popup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    return (
      <div>
        <div className='backdrop' style={{
          width: '100%',
          height: '100%',
          opacity: 0.5,
          backgroundColor: 'black',
          position: 'fixed',
          zIndex: 1,
          top: '0',
          left: '0'
        }}>{' '}</div>
        <div style={{
          top: '25%',
          left: '0',
          width: '100%',
          position: 'fixed',
          backgroundColor: 'transparent',
          zIndex: 2
        }}>
          <div style={{maxWidth: '600px', margin: '0 auto', backgroundColor: '#FCFCFC', border: '1px solid #DDD'}}>
            <div style={{padding: '1em', display: this.props.errorMessage.length > 0 ? 'block' : 'none'}}>
              <h1>{this.props.errorHeader}</h1>
              <div style={{
                padding: '1em 0',
                maxHeight: '5em',
                overflow: 'scroll'
              }}>{this.props.errorMessage}</div>
              <span onClick={this.props.onClose} style={{
                color: 'black',
                textDecoration: 'underline',
                display: 'inline-block',
                cursor: 'pointer'
              }}>Close</span>
            </div>
            <div style={{padding: '1em', display: this.props.errorMessage.length == 0 ? 'block' : 'none'}}>
              <h1>{this.props.actionHeader}</h1>
              <div style={{padding: '1em 0'}}>{this.props.actionMessage}</div>
              <span onClick={this.props.onClose} style={{
                color: 'black',
                textDecoration: 'underline',
                display: 'inline-block',
                cursor: 'pointer'
              }}>Close</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Popup;