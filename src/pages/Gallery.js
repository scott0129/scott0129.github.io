import React from 'react';
import { useContentful } from 'react-contentful';


export default function Gallery() {
  const { data, error, fetched, loading } = useContentful({
    contentType: 'Page',
    query: {
      'content_type': 'photo'
    }
  });

  if (loading || !fetched) {
    return null;
  }
 
  if (error) {
    console.error(error);
    return null;
  }
 
  if (!data) {
    return <p>Page does not exist.</p>;
  }
  
  // See the Contentful query response
  console.debug(data);

  return (
<div class='col'>
  <div class='paper container border-dashed border-thick'>
    <h1 class='margin-none'>Some photos I took</h1>
    <img src={`${data.items[0].fields.image.fields.file.url}?fm=jpg&fl=progressive`}></img>
  </div>
</div>
)
}