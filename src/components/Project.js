import React from 'react';
import blockss from '../images/blockss.png';

export default function Project(props) {
  return (
<div class='card margin shadow shadow-small'>
  <div class='row'>
    <img src={blockss} class='sm-3 col'></img>
    <div class='card-body sm-9 col'>
      <h4 class='card-title'>{props.title}</h4>
      <h5 class='card-subtitle'>{props.subtitle}</h5>
      <p class='card-text'>{props.detail}</p>
      <a class='card-link' href={props.linkAddress}>Check it out!</a>
    </div>
  </div>
</div>
  )
}