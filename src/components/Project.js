import React from 'react';

export default function Project(props) {
  return (
<div class='card margin shadow shadow-small'>
  <div class='row margin-small'>
    <div class='col' style={{flex: '1 0 250px', display: 'grid', placeItems: 'center'}}>
      <img class='' src={props.image}></img>
    </div>
    <div class='card-body col' style={{flex: '10 0 350px'}}>
      <h4 class='card-title'>{props.title}</h4>
      <h5 class='card-subtitle'>{props.subtitle}</h5>
      <p class='card-text'>{props.detail}</p>
      <a class='card-link' href={props.linkAddress}>Check it out!</a>
    </div>
  </div>
</div>
  )
}