const form = document.querySelector('#form');
const result = document.querySelector('#result');

form.addEventListener('submit', event => {
  event.preventDefault();

  const input = document.querySelector('#url_input');
  fetch('/api/shorturl', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: input.value,
    })
  })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json();
    })
    .then(data => {
      while (result.hasChildNodes()) {
        result.removeChild(result.lastChild);
      }

      result.insertAdjacentHTML('afterbegin', `
        <div class="result">
          <a target="_blank" class="short-url" rel="noopener" href="/api/shorturl/${data.shortUrl}">
            ${location.origin}/api/shorturl/${data.shortUrl}
          </a>
        </div>
      `)
    })
    .catch(console.error)
});