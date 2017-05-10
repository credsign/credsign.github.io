import React from 'react';
import Editor from './Editor.jsx';
import Popup from './Popup.jsx';
import { serializeHeaders, serializeDocument, parseDocument, getContentSlug, parseHeaders, submitPost, cacheContent } from '../scripts/formatting.js';

class Publish extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      view: 'edit',
      channel: '',
      postBody: '',
      error: '',
      watcherTimeout: 0
    };

    this.editPost = this.editPost.bind(this);
    this.onPostEdit = this.onPostEdit.bind(this);
    this.previewPost = this.previewPost.bind(this);
    this.submitPost = this.submitPost.bind(this);
  }

  componentWillUnmount() {
    if (this.state.watcherTimeout > 0) {
      window.clearTimeout(this.state.watcherTimeout);
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
    // document.getElementById('new-post-body-preview').innerHTML = marked(toMarkdown(document.getElementById('new-post-body')));
    document.getElementById('new-post-body-preview').innerHTML = parseDocument(
      serializeDocument(document.getElementById('new-post-body'), 'markdown', 'lz-string-valid-utf16'),
      'markdown',
      'lz-string-valid-utf16'
    );
  }

  onPostEdit(postBody) {
    // this.setState({
    //   postBody: postBody
    // });
  }

  submitPost() {
    this.setState({
      view: 'submit'
    });
    var token = 0;
    var title = document.getElementById('new-post-title').value;
    var body = document.getElementById('new-post-body');
    var parentID = 0;
    window.web3.eth.getBlockNumber((error, currentBlock) => {
      submitPost(title, body, token, parentID, (error, contentID) => {
        if (error) {
          this.setState({
            error: error.toString()
          });
        }
        else {
          var watcherFn = () => {
            window.post.Content({contentID: contentID}, {fromBlock: currentBlock, toBlock: 'latest'}).get((error, post) => {
              if (error) {
                this.setState({
                  error: error.toString()
                });
              }
              else if (post.length == 0) {
                this.setState({
                  watcherTimeout: window.setTimeout(watcherFn, 3000)
                });
              }
              else {
                cacheContent(contentID, post[0]);
                let slug = getContentTitle(parseHeaders(post[0].headers).title);
                window.location.hash = `#/eth/${slug}-${contentID}}`;
              }
            });
          }
          watcherFn();
        }
      });
    });
  }

  render() {
    return (
      <div style={{
        minHeight: '100%',
        width: '100%',
        overflowY: 'auto',
        height: '0',
        position: 'absolute',
        top: '0',
        margin: '0 auto',
        backgroundColor: '#fff'
      }} className='flex flex-column'>
        <div style={{width: '100%', backgroundColor: '#fafafa'}} className='flex-shrink'>
          <div style={{maxWidth: '600px', margin: '0 auto', color: 'black'}}>
            <div style={{height: '3em'}}>&nbsp;</div>
            <div style={{padding: '1em'}}>
              <span style={{color: 'gray'}}>{this.state.view == 'edit' ? 'Currently editing draft' : 'Currently previewing draft'}</span>
            </div>
          </div>
        </div>
        <div style={{width: '100%', backgroundColor: '#FFF', display: this.state.view == 'edit' ? 'block' : 'none'}} className='flex-grow'>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <div style={{padding: '1.5em 1em', wordWrap: 'break-word'}}>
              <textarea id='new-post-title' type='text' placeholder='title'></textarea>
              <Editor placeholder={'body'} />
            </div>
          </div>
        </div>
        <div style={{width: '100%', backgroundColor: '#FFF', display: this.state.view != 'edit' ? 'block' : 'none'}} className='flex-grow'>
          <div style={{maxWidth: '600px', margin: '0 auto'}}>
            <div style={{padding: '1.5em 1em', wordWrap: 'break-word'}}>
              <div style={{display: this.state.view != 'edit' ? 'block' : 'none'}}>
                <h1 id='new-post-title-preview'></h1>
                <div id='new-post-body-preview' className='post'></div>
              </div>
            </div>
          </div>
        </div>
        <div style={{width: '100%', backgroundColor: '#fafafa'}} className='flex-shrink'>
          <div style={{maxWidth: '600px', margin: '0 auto', color: 'black', backgroundColor: '#fafafa'}}>
            <div style={{padding: '1em', display: this.state.view == 'edit' ? 'block' : 'none', textAlign: 'right'}}>
              <a style={{display: 'inline-block', textDecoration: 'underline'}} onClick={this.previewPost}>Preview</a>
            </div>
            <div style={{padding: '1em', display: (this.state.view == 'preview' || this.state.view == 'submit') ? 'block' : 'none'}}>
              <a style={{display: 'inline-block', textDecoration: 'underline'}} onClick={this.editPost}>Edit</a>
              <a style={{display: 'inline-block', textDecoration: 'underline', float: 'right'}} onClick={this.submitPost}>Publish</a>
            </div>
          </div>
          <div style={{height: '3em'}}>&nbsp;</div>
        </div>
        {
          this.state.view == 'submit' ?
          <Popup
            onClose={() => { clearTimeout(this.state.watcherTimeout); this.setState({view: 'preview', error: '', watcherTimeout: -1}) } }
            errorHeader={'Unable to publish'}
            errorMessage={this.state.error}
            actionHeader={'Publishing'}
            actionMessage={'Your post is being published. This page will redirect to your post once published. If you are not redirected after several minutes, try closing this message and publishing again.'}
            /> : ''
        }
      </div>
    );
  }
}

export default Publish;