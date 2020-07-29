import React from 'react';
import me from '../me.jpg'

export default function Home() {
  return (
<div class='col'>
  <div class='paper container border-dashed border-thick'>
    <div class='row flex-spaces' id='introduction'>
      <span class='col-8 col'>
        <div id='title-name'>
            <h1>
              Hello there!
            </h1>
        </div>
        <div id='self-intro'>
            <p>Oh boy, looks like you've found my website</p>
            <p>I'm just a regular guy that likes cool things and stuff</p>
            <p>Feel free to take a look around, and enjoy your stay my friend</p>
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