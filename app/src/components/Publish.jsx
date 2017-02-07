import React from 'react';
import marked from 'marked';
import MediumEditor from 'medium-editor';
import toMarkdown from '../scripts/toMarkdown.js';
import { Match, Link } from 'react-router';
import { encodeContentBody } from '../scripts/formatting.js';

class Publish extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      view: 'edit',
      channel: '',
      error: '',
      publishWatcher: 0
    };

    this.preventHeaderUnbold = (e) => {
      var action = e.target.getAttribute('data-action') || e.target.parentNode.getAttribute('data-action');
      if (action == 'bold') {
        var active = document.getElementsByClassName('medium-editor-button-active');
        for (var i = 0; i < active.length; i++) {
          if (/h+/.test(active[i].getAttribute('data-action', ''))) {
            e.stopPropagation();
            e.preventDefault();
            return;
          }
        }
      }
    };

    this.preventFormatHotkey = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.keyCode){
          case 66: //ctrl+B or ctrl+b
          case 98:
          case 73: //ctrl+I or ctrl+i
          case 105:
          case 85: //ctrl+U or ctrl+u
          case 117:
            e.stopPropagation();
            e.preventDefault();
            return false;
        }
      }
    };

    this.editPost = this.editPost.bind(this);
    this.previewPost = this.previewPost.bind(this);
    this.submitPost = this.submitPost.bind(this);
    marked.setOptions({
      gfm: false,
      tables: false,
      breaks: false,
      pedantic: false,
      sanitize: true,
      smartLists: false
    });
  }

  componentDidMount() {
    var editor = new MediumEditor('#new-post-body', {
      buttonLabels: 'fontawesome',
      keyboardCommands: false,
      toolbar: {
        buttons: ['bold', 'italic', 'h2', 'h3', 'anchor', 'quote'],
      },
      placeholder: {
        text: 'body',
        hideOnClick: true
      }
    });
    // Prevent the user from 'unbolding' text marked with h1, h2, hX...
    document.addEventListener('click', this.preventHeaderUnbold, true);

    // Prevent Bold/Italics/Underline via shortcuts
    document.addEventListener('keydown', this.preventFormatHotkey);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.preventHeaderUnbold);
    document.removeEventListener('keydown', this.preventFormatHotkey);
    if (this.state.publishWatch > 0) {
      window.clearTimeout(this.state.publishWatcher);
    }
  }

  editPost() {
    this.setState({
      view: 'edit',
      error: ''
    });
  }

  previewPost() {
    this.setState({
      view: 'preview',
      error: ''
    });
    document.getElementById('new-post-title-preview').innerHTML = document.getElementById('new-post-title').value;
    document.getElementById('new-post-body-preview').innerHTML = marked(toMarkdown(document.getElementById('new-post-body')));
  }

  submitPost() {
    this.setState({
      view: 'submit'
    });
    var errors = [];

    var channel = this.state.channel;
    var header = JSON.stringify({
      title: document.getElementById('new-post-title').value,
      version: '1.0',
      encoding: 'lz-string'
    });
    var body = encodeContentBody(toMarkdown(document.getElementById('new-post-body')));
    var indexes = [
      window.addressseries.address,
      window.contentseries.address,
      window.channelseries.address
    ];
    var tx = {
      from: window.account,
      value: 0
    };
    content.toChannelID(channel, (error, channelID) => {
      if (channelID.toNumber() == 0) {
        this.setState({
          error: 'A valid channel must be specified (above the title). '+
          'Channels are used to group related content together. A '+
          'channel is any combination of letters, numbers, '+
          'and underscores between 3 and 30 characters long. '
        });
        return;
      }
      content.toContentID(window.account, channelID, header, body, (error, contentID) => {
        content.publish.estimateGas(channel, header, body, indexes, tx, (error, gasEstimate) => {
          console.log(gasEstimate);
          tx.gas = gasEstimate + 100000;
          content.publish(channel, header, body, indexes, tx, (error) => {
            if (error) {
              this.setState({
                error: error.toString()
              });
            }
            else {
              var watcher = () => {
                content.Publish({contentID: contentID}, {fromBlock: 0}).get((error, post) => {
                  if (error) {
                    this.setState({
                      error: error.toString()
                    });
                  }
                  else if (post.length == 0) {
                    this.setState({
                      publishWatcher: window.setTimeout(watcher, 5000)
                    });
                  }
                  else {
                    window.location.hash = `#/content/0x${contentID.toString(16)}`;
                  }
                });
              }
              watcher();
            }
          });
        });
      });
    });
  }

  render() {
    return (
      <div style={{width: '100%', margin: '0 auto'}}>
        <div style={{maxWidth: '600px', margin: '0 auto', color: 'black'}}>
          <div style={{paddingLeft: '1em'}}>
            <span style={{color: 'gray'}}>#</span>
            <input
              type='text'
              placeholder='channel'
              onChange={(e) => this.setState({'channel': e.target.value})}
              value={this.state.channel} style={{
                border: 0,
                padding: '1em 1em 1em 0',
                fontSize: '1em',
                color: 'black',
                outline: 0,
                backgroundColor: 'transparent'
            }}/>
          </div>
        </div>
        <div style={{width: '100%', backgroundColor: '#FFF'}}>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <div style={{padding: '1.5em 1em', wordWrap: 'break-word'}}>
              <div style={{display: this.state.view == 'edit' ? 'block' : 'none'}}>
                <textarea id='new-post-title' type='text' placeholder='title'></textarea>
                <div id='new-post-body' contentEditable='true' className='post'></div>
              </div>
              <div style={{display: this.state.view != 'edit' ? 'block' : 'none'}}>
                <h1 id='new-post-title-preview'></h1>
                <div id='new-post-body-preview' className='post'></div>
              </div>
            </div>
          </div>
        </div>
        <div style={{maxWidth: '600px', margin: '0 auto', color: 'black'}}>
          <div style={{padding: '1em', display: this.state.view == 'edit' ? 'block' : 'none', textAlign: 'right'}}>
            <a style={{display: 'inline-block', textDecoration: 'underline'}} onClick={this.previewPost}>Preview</a>
          </div>
          <div style={{padding: '1em', display: (this.state.view == 'preview' || this.state.view == 'submit') ? 'block' : 'none'}}>
            <a style={{display: 'inline-block', textDecoration: 'underline'}} onClick={this.editPost}>Edit</a>
            <a style={{display: 'inline-block', textDecoration: 'underline', float: 'right'}} onClick={this.submitPost}>Publish</a>
          </div>
        </div>
        <div className='backdrop' style={{
          width: '100%',
          height: '100%',
          opacity: 0.5,
          backgroundColor: 'black',
          position: 'fixed',
          zIndex: 1,
          display: this.state.view == 'submit' ? 'block' : 'none',
          top: '0',
          left: '0'
        }}>{' '}</div>
        <div style={{
          display: this.state.view == 'submit' ? 'block' : 'none',
          top: '25%',
          left: '0',
          width: '100%',
          position: 'fixed',
          backgroundColor: 'transparent',
          zIndex: 2
        }}>
          <div style={{maxWidth: '600px', margin: '0 auto', backgroundColor: '#FCFCFC', border: '1px solid #DDD'}}>
            <div style={{padding: '1em', display: this.state.error.length > 0 ? 'block' : 'none'}}>
              <h1>Unable to publish</h1>
              <div style={{
                padding: '1em 0',
                maxHeight: '5em',
                overflow: 'scroll'
              }}>{this.state.error}</div>
              <span onClick={() => this.setState({view: 'preview', error: ''})} style={{
                color: 'black',
                textDecoration: 'underline',
                display: 'inline-block',
                cursor: 'pointer'
              }}>Close</span>
            </div>
            <div style={{padding: '1em', display: this.state.error.length == 0 ? 'block' : 'none'}}>
              <h1>Publishing...</h1>
              <div style={{padding: '1em 0'}}>{
                'Your post is being published. This page will redirect to your post once published. '+
                'If you are not redirected after several minutes, try closing this message and publishing again.'
              }</div>
              <span onClick={() => this.setState({view: 'preview', error: ''})} style={{
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

export default Publish;