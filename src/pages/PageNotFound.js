import React from 'react';

export default function PageNotFound(staticContext) {
  return (
<div class='row margin-top-large'>
  <div class='paper container border-dashed border-thick'>
    <div class='text-center'>
      <h1 class='margin-none'> 404 </h1>
      <h3 class='margin-top-none'> Oh no! </h3>
    </div>
    <div class='col flex-spaces text-center'>
      <p> I really hope this was on purpose </p>
      <p> Otherwise it means I have to fix something :( </p>
    </div>
  </div>
</div>
)
}