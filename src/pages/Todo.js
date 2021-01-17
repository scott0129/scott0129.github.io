import React from 'react';
import './Todo.css';


export default function Todo() {
  return (
<div class='row margin-top-large'>
  <div class='paper container border-dashed border-thick'>
    <div class='text-center'>
      <h1 class='margin-none'> To-do </h1>
      <h3 class='margin-top-none'>Don't know what to do?</h3>
    </div>
    <div class='row flex'>
      <div class='col-6 col'>
        <fieldset class="form-group">
          <label for="paperChecks1" class="paper-check activity">
            <input type="checkbox"/> <span><p>This is the first check</p></span>
            <input type="checkbox"/> <span><p>This is the second check</p></span>
          </label>
        </fieldset>
      </div>
      <div class='col-6 col'>
        <fieldset class="form-group">
          <label for="paperChecks1" class="paper-check activity">
            <input type="checkbox"/> <span><p>This is the first check</p></span>
            <input type="checkbox"/> <span><p>This is the second check</p></span>
          </label>
        </fieldset>
      </div>
    </div>
  </div>
</div>
)}
