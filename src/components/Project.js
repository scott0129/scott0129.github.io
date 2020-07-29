import React from 'react';

export default function Project(props) {
  return (
<div class='card margin border-dashed shadow shadow-small'>
  <div class='card-body'>
    <h4 class='card-title'>{props.title}</h4>
    <h5 class='card-subtitle'>{props.subtitle}</h5>
    <p class='card-text'>{props.detail}</p>
    <a class='card-link' href={props.linkAddress}>Check it out!</a>
  </div>
</div>
  )
}