import React from 'react';
import me from '../images/me-small.jpg'

export default function Home() {
  return (
<div class='row margin-top-large'>
  <div class='paper container border-dashed border-thick'>
    <div class='row flex-spaces' id='introduction'>
      <span class='md-8 col'>
        <div id='title-name'>
            <h1>
              Hello!
            </h1>
        </div>
        <div id='self-intro'>
            <p>Oh boy, looks like you've found my website</p>
            <p>I'm just a regular guy that likes cool things and such</p>
            <p>Feel free to take a look around, and I hope you enjoy your stay friend</p>
        </div>
    </span>
    <span class='col-4 col'>
        <img src={me} title='A picture of me!' alt='Myself climbing onto sign post' id='img-of-me'></img>
    </span>
    </div>
  </div>
</div>
)
}